/** Zoom que hace caber una imagen w×h en un área cw×ch con margen; null si no hay medidas. */
export function fitZoom(cw: number, ch: number, w: number, h: number, padding: number): number | null {
  if (!cw || !ch || !w || !h) return null
  const z = Math.min((cw - padding * 2) / w, (ch - padding * 2) / h)
  return z > 0 ? z : null
}
