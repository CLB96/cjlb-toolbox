// «Ver lo que detecta»: la imagen en blanco y negro que el detector usa para sacar el contorno.
import {
  applyKeep, detailParams, externalContours, findLargestContour, keepMask, KERNEL, MIN_AREA_RATIO, THRESH_BINARY, THRESH_BINARY_INV,
  type Cv, type DetectInput, type Mat,
} from './cvBase'
import { flatten, otsuBinary, pickInverted } from './otsu'

const MASK_OTHER = 80

type MaskLike = { width: number; height: number; data: Uint8ClampedArray }

function toRgba(width: number, height: number, pick: (i: number) => number): MaskLike {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const v = pick(i)
    data[i * 4] = v
    data[i * 4 + 1] = v
    data[i * 4 + 2] = v
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}

/**
 * Lo que el detector «ve» para el método elegido: en automático, el binario de la polaridad que usaría con la pieza
 * mayor en blanco y los demás objetos en gris; en semi automático, los bordes de Canny. La zona ignorada sale negra.
 */
export function previewMask(cv: Cv, input: DetectInput): MaskLike {
  const { imageData, method, threshold1, threshold2 } = input
  const { width, height } = imageData
  const minArea = width * height * MIN_AREA_RATIO
  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const keep = input.ignoreTransparent ? keepMask(cv, imageData) : null
  const { blur } = detailParams(input.detail)
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(KERNEL, KERNEL))
  const mats: Mat[] = []
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(blur, blur), 0)
    if (method === 1) {
      const edges = new cv.Mat()
      mats.push(edges)
      cv.Canny(blurred, edges, threshold1, threshold2)
      applyKeep(cv, edges, keep)
      return toRgba(width, height, (i) => (edges.data[i] ? 255 : 0))
    }
    const flat = flatten(cv, blurred)
    mats.push(flat)
    const invBin = otsuBinary(cv, flat, kernel, THRESH_BINARY_INV, true, keep)
    const normBin = otsuBinary(cv, blurred, kernel, THRESH_BINARY, false, keep)
    const inv = externalContours(cv, invBin)
    const normal = externalContours(cv, normBin)
    mats.push(invBin, normBin, inv, normal)
    const invIdx = findLargestContour(cv, inv, minArea)
    const normIdx = findLargestContour(cv, normal, minArea)
    const useInv = invIdx < 0 && normIdx < 0 ? true : pickInverted(cv, blurred, inv, invIdx, normal, normIdx, input.polarity)
    const bin = useInv ? invBin : normBin
    const idx = useInv ? invIdx : normIdx
    const contours = useInv ? inv : normal
    const core = cv.Mat.zeros(height, width, cv.CV_8UC1)
    mats.push(core)
    if (idx >= 0) {
      const vec = new cv.MatVector()
      const c = contours.get(idx)
      try {
        vec.push_back(c)
        cv.drawContours(core, vec, 0, new cv.Scalar(255), -1)
      } finally {
        c.delete()
        vec.delete()
      }
    }
    return toRgba(width, height, (i) => (core.data[i] ? 255 : bin.data[i] ? MASK_OTHER : 0))
  } finally {
    src.delete(); gray.delete(); blurred.delete(); kernel.delete(); keep?.delete()
    mats.forEach((m) => m.delete())
  }
}
