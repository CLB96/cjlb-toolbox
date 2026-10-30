export interface MarkerPosition {
  x: number
  y: number
}

interface Grid {
  rows: number
  x0: number
  xSpan: number
  y0: number
  yStep: number
}

function gridFor(count: number): Grid {
  if (count <= 6) return { rows: 2, x0: 15, xSpan: 70, y0: 30, yStep: 40 }
  if (count <= 12) return { rows: 3, x0: 10, xSpan: 80, y0: 25, yStep: 30 }
  if (count <= 20) return { rows: 4, x0: 8, xSpan: 84, y0: 20, yStep: 22 }
  if (count <= 30) return { rows: 5, x0: 6, xSpan: 88, y0: 15, yStep: 18 }
  return { rows: 6, x0: 5, xSpan: 90, y0: 12, yStep: 15 }
}

/** Posiciones iniciales (% del contenedor) de los marcadores de punto. */
export function defaultMarkerPositions(count: number): MarkerPosition[] {
  const out: MarkerPosition[] = []
  for (let i = 0; i < count; i++) {
    if (count <= 3) {
      out.push({ x: 20 + (i * 60) / count, y: 50 })
      continue
    }
    const g = gridFor(count)
    const cols = Math.ceil(count / g.rows)
    const row = Math.floor(i / cols)
    const col = i % cols
    out.push({ x: g.x0 + (col * g.xSpan) / cols, y: g.y0 + row * g.yStep })
  }
  return out
}
