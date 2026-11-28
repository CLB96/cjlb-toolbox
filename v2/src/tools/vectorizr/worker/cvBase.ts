// Piezas comunes del detector: tipos de OpenCV, constantes y utilidades de contornos y de la zona ignorada.
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

export const MIN_AREA_RATIO = 0.005 // 0.5% of image
const BLUR = 7
const DETAIL_DEFAULT = 3
// Control «Detalle» (1-5): más detalle = menos desenfoque previo y contorno menos simplificado. El 3 es el comportamiento de siempre.
const DETAIL_BLUR = [13, 9, BLUR, 5, 3]
const DETAIL_EPSILON = [2, 1.4, 1, 0.7, 0.5]
export const KERNEL = 7
export const EPSILON_RATIO = 0.002
export const OTSU_EPSILON_RATIO = 0.0008 // Otsu conserva más detalle (muescas, dientes) que Canny
export const THRESH_BINARY = 0
export const THRESH_BINARY_INV = 1

/* eslint-disable @typescript-eslint/no-explicit-any -- la API de opencv.js no tiene tipos */
export type Cv = any
export type Mat = any

/** Área del contorno i liberando el wrapper que crea `get`. */
export function areaAt(cv: Cv, contours: Mat, i: number): number {
  const c = contours.get(i)
  try { return cv.contourArea(c) } finally { c.delete() }
}

/** Find the largest contour (by area) in a binary Mat. Returns index or -1. */
export function findLargestContour(cv: Cv, contours: Mat, minArea: number): number {
  let bestArea = minArea
  let bestIdx = -1
  for (let i = 0; i < contours.size(); i++) {
    const area = areaAt(cv, contours, i)
    if (area > bestArea) { bestArea = area; bestIdx = i }
  }
  return bestIdx
}

/** approxPolyDP del contorno idx y conversión a puntos. */
export function approxPoints(cv: Cv, contours: Mat, idx: number, epsilon = EPSILON_RATIO): ImagePoint[] {
  const contour = contours.get(idx)
  const approx = new cv.Mat()
  try {
    cv.approxPolyDP(contour, approx, epsilon * cv.arcLength(contour, true), true)
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
export function externalContours(cv: Cv, binary: Mat): Mat {
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

/** Desenfoque y simplificación del contorno según «Detalle» (1-5); sin valor o fuera de rango, el de siempre. */
export function detailParams(detail: number | undefined): { blur: number; epsilon: number } {
  const i = Number.isInteger(detail) && detail! >= 1 && detail! <= 5 ? detail! - 1 : DETAIL_DEFAULT - 1
  return { blur: DETAIL_BLUR[i]!, epsilon: OTSU_EPSILON_RATIO * DETAIL_EPSILON[i]! }
}

/** Deja en 0 lo que la máscara `keep` descarta (zona que el usuario pidió ignorar). Sin máscara no hace nada. */
export function applyKeep(cv: Cv, mat: Mat, keep: Mat) {
  if (keep) cv.bitwise_and(mat, keep, mat)
}

/** Máscara 255 = se usa, 0 = se ignora, a partir del canal alfa (0 = ignorar) que arma «Editar imagen». */
export function keepMask(cv: Cv, imageData: RgbaImageLike): Mat {
  const { data, width, height } = imageData
  const keep = new cv.Mat(height, width, cv.CV_8UC1)
  const out = keep.data
  for (let i = 0; i < width * height; i++) out[i] = data[i * 4 + 3] === 0 ? 0 : 255
  return keep
}
