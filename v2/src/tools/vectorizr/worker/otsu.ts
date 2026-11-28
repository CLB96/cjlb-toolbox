// Umbral de Otsu en las dos polaridades, aplanado de luz y separación del cuerpo principal (regla, sombra pegadas).
import { applyKeep, areaAt, externalContours, type Cv, type Mat } from './cvBase'

const SEPARATE_DIVISOR = 40 // radio de la apertura que corta lo que solo se une por un cuello (regla, sombra)
const BORDER_MARGIN = 0.01
const FLAT_SCALE = 4 // el fondo de iluminación se estima en una copia reducida a 1/4
const THRESH_OTSU = 8

/**
 * Quita del binario lo que cuelga de la pieza por un cuello fino (la regla pegada, una sombra): abre con un
 * kernel grande, se queda con el cuerpo mayor, lo dilata ese mismo radio y recorta el binario original con eso,
 * así el borde conserva su detalle. Si la apertura no deja nada (pieza más fina que el kernel) no toca nada.
 */
export function separateMainBody(cv: Cv, binary: Mat): void {
  const radius = Math.max(3, Math.round(Math.min(binary.cols, binary.rows) / SEPARATE_DIVISOR))
  const side = 2 * radius + 1
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(side, side))
  const opened = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  let core: Mat = null
  let grown: Mat = null
  let keep: Mat = null
  let best = -1
  try {
    cv.morphologyEx(binary, opened, cv.MORPH_OPEN, kernel)
    cv.findContours(opened, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    let bestArea = 0
    for (let i = 0; i < contours.size(); i++) {
      const area = areaAt(cv, contours, i)
      if (area > bestArea) { bestArea = area; best = i }
    }
    if (best < 0) return
    core = cv.Mat.zeros(binary.rows, binary.cols, cv.CV_8UC1)
    keep = new cv.MatVector()
    const c = contours.get(best)
    try { keep.push_back(c) } finally { c.delete() }
    cv.drawContours(core, keep, 0, new cv.Scalar(255), -1)
    grown = new cv.Mat()
    cv.dilate(core, grown, kernel)
    cv.bitwise_and(binary, grown, binary)
  } finally {
    kernel.delete(); opened.delete(); contours.delete(); hierarchy.delete()
    core?.delete(); grown?.delete(); keep?.delete()
  }
}

/** Binario de Otsu ya limpio (cierre, apertura, zona ignorada y cuerpo principal); quien llama lo libera. */
export function otsuBinary(cv: Cv, blurred: Mat, kernel: Mat, invertFlag: number, separate = false, keep: Mat = null): Mat {
  const binary = new cv.Mat()
  try {
    cv.threshold(blurred, binary, 0, 255, invertFlag + THRESH_OTSU)
    applyKeep(cv, binary, keep)
    // Close gaps, then open to remove noise
    cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel)
    cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel)
    applyKeep(cv, binary, keep) // el cierre no debe devolver lo ignorado
    if (separate) separateMainBody(cv, binary)
    return binary
  } catch (e) {
    binary.delete()
    throw e
  }
}

export function otsuContours(cv: Cv, blurred: Mat, kernel: Mat, invertFlag: number, separate = false, keep: Mat = null): Mat {
  const binary = otsuBinary(cv, blurred, kernel, invertFlag, separate, keep)
  try {
    return externalContours(cv, binary)
  } finally {
    binary.delete()
  }
}

/** Lados de la imagen (0-4) que toca el contorno idx, con un margen del 1 %. */
export function touchedSides(cv: Cv, contours: Mat, idx: number, width: number, height: number): number {
  const c = contours.get(idx)
  try {
    const r = cv.boundingRect(c)
    const mx = width * BORDER_MARGIN
    const my = height * BORDER_MARGIN
    return [r.x <= mx, r.y <= my, r.x + r.width >= width - mx, r.y + r.height >= height - my].filter(Boolean).length
  } finally { c.delete() }
}

/**
 * Elige la polaridad de Otsu. Un contorno que toca más lados de la imagen es el fondo (la hoja de papel),
 * no la pieza, aunque tenga más área; entre empatados gana el mayor (empate total: invertida, como el original).
 */
export function pickInverted(cv: Cv, blurred: Mat, inv: Mat, invIdx: number, normal: Mat, normIdx: number, polarity?: 'dark' | 'light'): boolean {
  if (polarity === 'dark' && invIdx >= 0) return true // la elige el usuario, si esa polaridad encontró algo
  if (polarity === 'light' && normIdx >= 0) return false
  if (normIdx < 0) return true
  if (invIdx < 0) return false
  const w = blurred.cols
  const h = blurred.rows
  const invSides = touchedSides(cv, inv, invIdx, w, h)
  const normSides = touchedSides(cv, normal, normIdx, w, h)
  if (invSides !== normSides) return invSides < normSides
  return areaAt(cv, inv, invIdx) >= areaAt(cv, normal, normIdx)
}

/**
 * Aplana la iluminación para el caso objeto oscuro sobre fondo claro: divide por el fondo local (el máximo en
 * una ventana grande), así un degradado de luz o una sombra del papel no parten el umbral de Otsu.
 */
export function flatten(cv: Cv, blurred: Mat): Mat {
  const w = blurred.cols
  const h = blurred.rows
  const small = new cv.Mat()
  const bg = new cv.Mat()
  const g32 = new cv.Mat()
  const b32 = new cv.Mat()
  const out = new cv.Mat()
  let k: Mat = null
  try {
    cv.resize(blurred, small, new cv.Size(Math.round(w / FLAT_SCALE), Math.round(h / FLAT_SCALE)), 0, 0, cv.INTER_AREA)
    const side = Math.max(5, Math.round(Math.min(w, h) / 4 / FLAT_SCALE)) | 1
    k = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(side, side))
    cv.dilate(small, bg, k)
    cv.GaussianBlur(bg, bg, new cv.Size(15, 15), 0)
    cv.resize(bg, bg, new cv.Size(w, h), 0, 0, cv.INTER_LINEAR)
    blurred.convertTo(g32, cv.CV_32F)
    bg.convertTo(b32, cv.CV_32F)
    cv.divide(g32, b32, g32, 255)
    g32.convertTo(out, cv.CV_8U)
    return out
  } catch (e) {
    out.delete()
    throw e
  } finally {
    small.delete(); bg.delete(); g32.delete(); b32.delete(); k?.delete()
  }
}
