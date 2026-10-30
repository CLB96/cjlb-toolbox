export interface MarkerPosition {
  x: number
  y: number
}

/** Posiciones iniciales (% del contenedor) de los marcadores de TC visibles. */
export function defaultMarkerPositions(visibleCount: number): MarkerPosition[] {
  const out: MarkerPosition[] = []
  for (let i = 0; i < visibleCount; i++) {
    if (visibleCount <= 2) {
      out.push({ x: 30 + i * 40, y: 50 })
    } else if (visibleCount <= 4) {
      out.push({ x: 25 + (i % 2) * 50, y: 30 + Math.floor(i / 2) * 40 })
    } else if (visibleCount <= 6) {
      out.push({ x: 20 + (i % 3) * 30, y: 30 + Math.floor(i / 3) * 40 })
    } else if (visibleCount <= 9) {
      out.push({ x: 20 + (i % 3) * 30, y: 25 + Math.floor(i / 3) * 30 })
    } else {
      out.push({ x: 15 + (i % 5) * 18, y: 20 + Math.floor(i / 5) * 20 })
    }
  }
  return out
}
