// Detección del contorno mayor. Mismo algoritmo que Digitalizacion/src/workers/opencv.worker.ts:37-167
// (mismos parámetros y resultado), con M7: se liberan los Mat de `contours.get(i)` y, con try/finally,
// todo lo creado aunque OpenCV lance. Módulo puro: recibe `cv` para poder probarlo en Node.
import type { DetectParams, ImagePoint } from '../types'

/** Lo que necesita cv.matFromImageData (un ImageData o equivalente). */
export interface RgbaImageLike {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface DetectInput extends DetectParams {
  imageData: RgbaImageLike
}

const MIN_AREA_RATIO = 0.005 // 0.5% of image
const BLUR = 7
const KERNEL = 7
const EPSILON_RATIO = 0.002
const FALLBACK_CANNY: [number, number] = [50, 150]
const THRESH_OTSU = 8
const THRESH_BINARY = 0
const THRESH_BINARY_INV = 1

/* eslint-disable @typescript-eslint/no-explicit-any -- la API de opencv.js no tiene tipos */
type Cv = any
type Mat = any

/** Área del contorno i liberando el wrapper que crea `get`. */
function areaAt(cv: Cv, contours: Mat, i: number): number {
  const c = contours.get(i)
  try { return cv.contourArea(c) } finally { c.delete() }
}

/** Find the largest contour (by area) in a binary Mat. Returns index or -1. */
function findLargestContour(cv: Cv, contours: Mat, minArea: number): number {
  let bestArea = minArea
  let bestIdx = -1
  for (let i = 0; i < contours.size(); i++) {
    const area = areaAt(cv, contours, i)
    if (area > bestArea) { bestArea = area; bestIdx = i }
  }
  return bestIdx
}

/** approxPolyDP del contorno idx y conversión a puntos. */
function approxPoints(cv: Cv, contours: Mat, idx: number): ImagePoint[] {
  const contour = contours.get(idx)
  const approx = new cv.Mat()
  try {
    cv.approxPolyDP(contour, approx, EPSILON_RATIO * cv.arcLength(contour, true), true)
    const points: ImagePoint[] = []
    for (let i = 0; i < approx.rows; i++) {
      points.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] })
    }
    return points
  } finally {
    approx.delete(); contour.delete()
  }
}

/** Contornos externos de un binario; quien llama libera `contours`. */
function externalContours(cv: Cv, binary: Mat): Mat {
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  try {
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    return contours
  } catch (e) {
    contours.delete()
    throw e
  } finally {
    hierarchy.delete()
  }
}

function cannyContours(cv: Cv, blurred: Mat, t1: number, t2: number): Mat {
  const edges = new cv.Mat()
  try {
    cv.Canny(blurred, edges, t1, t2)
    return externalContours(cv, edges)
  } finally {
    edges.delete()
  }
}

function detectCanny(cv: Cv, blurred: Mat, minArea: number, t1: number, t2: number): ImagePoint[] {
  const contours = cannyContours(cv, blurred, t1, t2)
  try {
    const idx = findLargestContour(cv, contours, minArea)
    return idx >= 0 ? approxPoints(cv, contours, idx) : []
  } finally {
    contours.delete()
  }
}

function otsuContours(cv: Cv, blurred: Mat, kernel: Mat, invertFlag: number): Mat {
  const binary = new cv.Mat()
  try {
    cv.threshold(blurred, binary, 0, 255, invertFlag + THRESH_OTSU)
    // Close gaps, then open to remove noise
    cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel)
    cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel)
    return externalContours(cv, binary)
  } finally {
    binary.delete()
  }
}

function detectOtsu(cv: Cv, blurred: Mat, minArea: number): ImagePoint[] {
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(KERNEL, KERNEL))
  let inv: Mat = null
  let normal: Mat = null
  try {
    // THRESH_BINARY_INV: objeto oscuro sobre fondo claro; THRESH_BINARY: al revés.
    inv = otsuContours(cv, blurred, kernel, THRESH_BINARY_INV)
    const invIdx = findLargestContour(cv, inv, minArea)
    normal = otsuContours(cv, blurred, kernel, THRESH_BINARY)
    const normIdx = findLargestContour(cv, normal, minArea)

    if (invIdx < 0 && normIdx < 0) {
      // Neither found anything — fall back to Canny (sin área mínima)
      return detectCanny(cv, blurred, 0, FALLBACK_CANNY[0], FALLBACK_CANNY[1])
    }
    // Pick whichever polarity gave the larger contour (empate: invertida, como el original)
    const useInv = normIdx < 0 || (invIdx >= 0 && areaAt(cv, inv, invIdx) >= areaAt(cv, normal, normIdx))
    return useInv ? approxPoints(cv, inv, invIdx) : approxPoints(cv, normal, normIdx)
  } finally {
    inv?.delete(); normal?.delete(); kernel.delete()
  }
}

/** Todos los contornos de un binario con área mínima, con su borde izquierdo para ordenar. */
function allPoints(cv: Cv, contours: Mat, minArea: number): ImagePoint[][] {
  const found: { left: number; points: ImagePoint[] }[] = []
  for (let i = 0; i < contours.size(); i++) {
    if (areaAt(cv, contours, i) < minArea) continue
    const points = approxPoints(cv, contours, i)
    if (points.length > 2) found.push({ left: Math.min(...points.map((p) => p.x)), points })
  }
  return found.sort((a, b) => a.left - b.left).map((f) => f.points)
}

/** Polaridad de Otsu que da el contorno mayor (misma regla que detectOtsu); null si ninguna encuentra nada. */
function allOtsu(cv: Cv, blurred: Mat, minArea: number): ImagePoint[][] | null {
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(KERNEL, KERNEL))
  let inv: Mat = null
  let normal: Mat = null
  try {
    inv = otsuContours(cv, blurred, kernel, THRESH_BINARY_INV)
    const invIdx = findLargestContour(cv, inv, minArea)
    normal = otsuContours(cv, blurred, kernel, THRESH_BINARY)
    const normIdx = findLargestContour(cv, normal, minArea)
    if (invIdx < 0 && normIdx < 0) return null
    const useInv = normIdx < 0 || (invIdx >= 0 && areaAt(cv, inv, invIdx) >= areaAt(cv, normal, normIdx))
    return allPoints(cv, useInv ? inv : normal, minArea)
  } finally {
    inv?.delete(); normal?.delete(); kernel.delete()
  }
}

/** Varias piezas: todos los contornos externos con el área mínima, de izquierda a derecha. */
export function detectAll(cv: Cv, input: DetectInput): ImagePoint[][] {
  const { imageData, method, threshold1, threshold2 } = input
  const minArea = imageData.width * imageData.height * MIN_AREA_RATIO
  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(BLUR, BLUR), 0)
    if (method === 1) {
      const contours = cannyContours(cv, blurred, threshold1, threshold2)
      try { return allPoints(cv, contours, minArea) } finally { contours.delete() }
    }
    const found = allOtsu(cv, blurred, minArea)
    if (found) return found
    const fallback = detectCanny(cv, blurred, 0, FALLBACK_CANNY[0], FALLBACK_CANNY[1])
    return fallback.length > 0 ? [fallback] : []
  } finally {
    src.delete(); gray.delete(); blurred.delete()
  }
}

export function detect(cv: Cv, input: DetectInput): ImagePoint[] {
  const { imageData, method, threshold1, threshold2 } = input
  const minArea = imageData.width * imageData.height * MIN_AREA_RATIO

  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(BLUR, BLUR), 0)
    return method === 1
      ? detectCanny(cv, blurred, minArea, threshold1, threshold2)
      : detectOtsu(cv, blurred, minArea)
  } finally {
    src.delete(); gray.delete(); blurred.delete()
  }
}
