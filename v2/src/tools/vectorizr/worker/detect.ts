// Detección del contorno mayor. Mismo algoritmo que Digitalizacion/src/workers/opencv.worker.ts:37-167
// (mismos parámetros y resultado), con M7: se liberan los Mat de `contours.get(i)` y, con try/finally,
// todo lo creado aunque OpenCV lance. Módulo puro: recibe `cv` para poder probarlo en Node.
import type { ImagePoint } from '../types'
import {
  applyKeep, approxPoints, areaAt, detailParams, EPSILON_RATIO, externalContours, findLargestContour, keepMask, KERNEL, MIN_AREA_RATIO,
  OTSU_EPSILON_RATIO, THRESH_BINARY, THRESH_BINARY_INV, type Cv, type DetectInput, type Mat,
} from './cvBase'
import { flatten, otsuContours, pickInverted } from './otsu'

export type { DetectInput, RgbaImageLike } from './cvBase'
export { previewMask } from './maskPreview'

const FALLBACK_CANNY: [number, number] = [50, 150]

function cannyContours(cv: Cv, blurred: Mat, t1: number, t2: number, keep: Mat = null): Mat {
  const edges = new cv.Mat()
  try {
    cv.Canny(blurred, edges, t1, t2)
    applyKeep(cv, edges, keep)
    return externalContours(cv, edges)
  } finally {
    edges.delete()
  }
}

function detectCanny(cv: Cv, blurred: Mat, minArea: number, t1: number, t2: number, keep: Mat = null): ImagePoint[] {
  const contours = cannyContours(cv, blurred, t1, t2, keep)
  try {
    const idx = findLargestContour(cv, contours, minArea)
    return idx >= 0 ? approxPoints(cv, contours, idx) : []
  } finally {
    contours.delete()
  }
}

function detectOtsu(cv: Cv, blurred: Mat, minArea: number, keep: Mat = null, epsilon = OTSU_EPSILON_RATIO, polarity?: 'dark' | 'light'): ImagePoint[] {
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(KERNEL, KERNEL))
  let flat: Mat = null
  let inv: Mat = null
  let normal: Mat = null
  try {
    // THRESH_BINARY_INV: objeto oscuro sobre fondo claro; THRESH_BINARY: al revés.
    flat = flatten(cv, blurred)
    inv = otsuContours(cv, flat, kernel, THRESH_BINARY_INV, true, keep)
    const invIdx = findLargestContour(cv, inv, minArea)
    normal = otsuContours(cv, blurred, kernel, THRESH_BINARY, false, keep)
    const normIdx = findLargestContour(cv, normal, minArea)

    if (invIdx < 0 && normIdx < 0) {
      // Neither found anything — fall back to Canny (sin área mínima)
      return detectCanny(cv, blurred, 0, FALLBACK_CANNY[0], FALLBACK_CANNY[1], keep)
    }
    const useInv = pickInverted(cv, blurred, inv, invIdx, normal, normIdx, polarity)
    return useInv ? approxPoints(cv, inv, invIdx, epsilon) : approxPoints(cv, normal, normIdx, epsilon)
  } finally {
    flat?.delete(); inv?.delete(); normal?.delete(); kernel.delete()
  }
}

/** Todos los contornos de un binario con área mínima, con su borde izquierdo para ordenar. */
function allPoints(cv: Cv, contours: Mat, minArea: number, epsilon = EPSILON_RATIO): ImagePoint[][] {
  const found: { left: number; points: ImagePoint[] }[] = []
  for (let i = 0; i < contours.size(); i++) {
    if (areaAt(cv, contours, i) < minArea) continue
    const points = approxPoints(cv, contours, i, epsilon)
    if (points.length > 2) found.push({ left: Math.min(...points.map((p) => p.x)), points })
  }
  return found.sort((a, b) => a.left - b.left).map((f) => f.points)
}

/** Polaridad de Otsu que da el contorno mayor (misma regla que detectOtsu); null si ninguna encuentra nada. */
function allOtsu(cv: Cv, blurred: Mat, minArea: number, keep: Mat = null, epsilon = OTSU_EPSILON_RATIO, polarity?: 'dark' | 'light'): ImagePoint[][] | null {
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(KERNEL, KERNEL))
  let flat: Mat = null
  let inv: Mat = null
  let normal: Mat = null
  try {
    flat = flatten(cv, blurred)
    inv = otsuContours(cv, flat, kernel, THRESH_BINARY_INV, false, keep)
    const invIdx = findLargestContour(cv, inv, minArea)
    normal = otsuContours(cv, blurred, kernel, THRESH_BINARY, false, keep)
    const normIdx = findLargestContour(cv, normal, minArea)
    if (invIdx < 0 && normIdx < 0) return null
    const useInv = pickInverted(cv, blurred, inv, invIdx, normal, normIdx, polarity)
    return allPoints(cv, useInv ? inv : normal, minArea, epsilon)
  } finally {
    flat?.delete(); inv?.delete(); normal?.delete(); kernel.delete()
  }
}

/** Varias piezas: todos los contornos externos con el área mínima, de izquierda a derecha. */
export function detectAll(cv: Cv, input: DetectInput): ImagePoint[][] {
  const { imageData, method, threshold1, threshold2 } = input
  const minArea = imageData.width * imageData.height * MIN_AREA_RATIO
  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const keep = input.ignoreTransparent ? keepMask(cv, imageData) : null
  const { blur, epsilon } = detailParams(input.detail)
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(blur, blur), 0)
    if (method === 1) {
      const contours = cannyContours(cv, blurred, threshold1, threshold2, keep)
      try { return allPoints(cv, contours, minArea) } finally { contours.delete() }
    }
    const found = allOtsu(cv, blurred, minArea, keep, epsilon, input.polarity)
    if (found) return found
    const fallback = detectCanny(cv, blurred, 0, FALLBACK_CANNY[0], FALLBACK_CANNY[1], keep)
    return fallback.length > 0 ? [fallback] : []
  } finally {
    src.delete(); gray.delete(); blurred.delete(); keep?.delete()
  }
}

export function detect(cv: Cv, input: DetectInput): ImagePoint[] {
  const { imageData, method, threshold1, threshold2 } = input
  const minArea = imageData.width * imageData.height * MIN_AREA_RATIO

  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const keep = input.ignoreTransparent ? keepMask(cv, imageData) : null
  const { blur, epsilon } = detailParams(input.detail)
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(blur, blur), 0)
    return method === 1
      ? detectCanny(cv, blurred, minArea, threshold1, threshold2, keep)
      : detectOtsu(cv, blurred, minArea, keep, epsilon, input.polarity)
  } finally {
    src.delete(); gray.delete(); blurred.delete(); keep?.delete()
  }
}

