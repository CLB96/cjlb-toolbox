import type { ImagePoint } from '../types'

/** Ajuste de objectFit: contain: escala y márgenes con los que la imagen cabe en el canvas visible. */
export function letterbox(rect: DOMRect, imageWidth: number, imageHeight: number) {
  const scaleRatio = Math.min(rect.width / imageWidth, rect.height / imageHeight)
  const offsetX = (rect.width - imageWidth * scaleRatio) / 2
  const offsetY = (rect.height - imageHeight * scaleRatio) / 2
  return { scaleRatio, offsetX, offsetY }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** cos y sin exactos del giro (múltiplos de 90° a la derecha, como Konva en el editor). */
function trig(rotation: number): { cos: number; sin: number } {
  const q = (((Math.round(rotation / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3
  return [{ cos: 1, sin: 0 }, { cos: 0, sin: 1 }, { cos: -1, sin: 0 }, { cos: 0, sin: -1 }][q]!
}

/** Tamaño del lienzo con la foto girada: con 90° o 270° intercambia ancho y alto. */
export function viewDims(width: number, height: number, rotation: number): { w: number; h: number } {
  return Math.abs(trig(rotation).sin) === 1 ? { w: height, h: width } : { w: width, h: height }
}

/** Punto de la foto (en sus píxeles) a coordenadas del lienzo girado. El giro es alrededor del centro. */
export function imageToView(x: number, y: number, width: number, height: number, rotation: number): ImagePoint {
  const { cos, sin } = trig(rotation)
  const v = viewDims(width, height, rotation)
  const dx = x - width / 2
  const dy = y - height / 2
  return { x: dx * cos - dy * sin + v.w / 2, y: dx * sin + dy * cos + v.h / 2 }
}

/** Inverso de imageToView: punto del lienzo girado a píxeles de la foto. */
export function viewToImage(x: number, y: number, width: number, height: number, rotation: number): ImagePoint {
  const { cos, sin } = trig(rotation)
  const v = viewDims(width, height, rotation)
  const dx = x - v.w / 2
  const dy = y - v.h / 2
  return { x: dx * cos + dy * sin + width / 2, y: -dx * sin + dy * cos + height / 2 }
}

/** Punto del puntero en píxeles de la foto, recortado a sus bordes, y la escala pantalla/lienzo. */
export function pointerToImage(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  imageWidth: number,
  imageHeight: number,
  rotation = 0,
): { point: ImagePoint; scaleRatio: number } {
  const rect = canvas.getBoundingClientRect()
  const v = viewDims(imageWidth, imageHeight, rotation)
  const { scaleRatio, offsetX, offsetY } = letterbox(rect, v.w, v.h)
  const p = viewToImage((e.clientX - rect.left - offsetX) / scaleRatio, (e.clientY - rect.top - offsetY) / scaleRatio, imageWidth, imageHeight, rotation)
  return { point: { x: clamp(p.x, 0, imageWidth), y: clamp(p.y, 0, imageHeight) }, scaleRatio }
}

/** Punto del clic en píxeles de la foto, o null si cae fuera de ella (cuenta el margen de objectFit: contain y el giro). */
export function canvasClickToImageCoords(
  e: { clientX: number; clientY: number; currentTarget: HTMLCanvasElement },
  imageWidth: number,
  imageHeight: number,
  rotation = 0,
): ImagePoint | null {
  const rect = e.currentTarget.getBoundingClientRect()
  const v = viewDims(imageWidth, imageHeight, rotation)
  const { scaleRatio, offsetX, offsetY } = letterbox(rect, v.w, v.h)
  const vx = (e.clientX - rect.left - offsetX) / scaleRatio
  const vy = (e.clientY - rect.top - offsetY) / scaleRatio
  if (!(vx >= 0 && vy >= 0 && vx <= v.w && vy <= v.h)) return null
  return viewToImage(vx, vy, imageWidth, imageHeight, rotation)
}
