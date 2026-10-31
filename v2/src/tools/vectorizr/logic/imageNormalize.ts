// Normalización de la imagen subida. clampDimensions es copia literal de
// Digitalizacion/src/lib/imageNormalize.ts:1-11; normalizeImage añade fondo blanco (M6) y devuelve el Blob.
export const MAX_SIZE = 4096
const JPEG_QUALITY = 0.92

export function clampDimensions(
  width: number,
  height: number,
  maxSize = MAX_SIZE,
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) return { width, height }
  const ratio = Math.min(maxSize / width, maxSize / height)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

export interface NormalizedImage {
  image: HTMLImageElement
  blob: Blob
  width: number
  height: number
}

/**
 * Carga un Blob como <img>. La object URL sigue viva porque la UI usa `img.src` en un <img>;
 * el store la revoca al reemplazar o descartar la imagen. Solo se revoca aquí si falla.
 */
export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen')) }
    img.src = url
  })
}

/** Reduce a MAX_SIZE, pinta fondo blanco (un PNG transparente ya no queda negro) y pasa a JPEG 0.92. */
export async function normalizeImage(img: HTMLImageElement): Promise<NormalizedImage> {
  const { width, height } = clampDimensions(img.naturalWidth, img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo codificar la imagen'))), 'image/jpeg', JPEG_QUALITY)
  })
  const image = await loadImageFromBlob(blob)
  return { image, blob, width, height }
}
