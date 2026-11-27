export type Point = readonly [number, number]

/** Margen extra alrededor del botón en el recorte para que la sombra exterior no se corte. */
const CLIP_PAD = 40

/** Puntos repartidos sobre el contorno de un rectángulo redondeado, empezando en (r, 0) y en sentido horario. */
export function roundRectPoints(w: number, h: number, r: number, n: number): Point[] {
  const sx = w - 2 * r
  const sy = h - 2 * r
  const arc = (Math.PI * r) / 2
  const total = 2 * sx + 2 * sy + 4 * arc
  const pts: Point[] = []
  for (let i = 0; i < n; i++) {
    let s = (i / n) * total
    if (s < sx) {
      pts.push([r + s, 0])
    } else if ((s -= sx) < arc) {
      const a = -Math.PI / 2 + s / r
      pts.push([w - r + r * Math.cos(a), r + r * Math.sin(a)])
    } else if ((s -= arc) < sy) {
      pts.push([w, r + s])
    } else if ((s -= sy) < arc) {
      const a = s / r
      pts.push([w - r + r * Math.cos(a), h - r + r * Math.sin(a)])
    } else if ((s -= arc) < sx) {
      pts.push([w - r - s, h])
    } else if ((s -= sx) < arc) {
      const a = Math.PI / 2 + s / r
      pts.push([r + r * Math.cos(a), h - r + r * Math.sin(a)])
    } else if ((s -= arc) < sy) {
      pts.push([0, h - r - s])
    } else {
      s -= sy
      const a = Math.PI + s / r
      pts.push([r + r * Math.cos(a), r + r * Math.sin(a)])
    }
  }
  return pts
}

/**
 * Mueve cada punto del contorno hacia el punto de contacto, con más fuerza cuanto más cerca esté (campana
 * gaussiana). Una profundidad positiva hunde el borde; una negativa lo abomba (la vibración al soltar).
 */
export function dentPoints(
  base: readonly Point[],
  touch: Point,
  amplitude: number,
  sigma: number,
): Point[] {
  const k2 = 2 * sigma * sigma
  return base.map(([x, y]) => {
    const dx = touch[0] - x
    const dy = touch[1] - y
    const dist = Math.hypot(dx, dy) || 1
    const falloff = Math.exp(-(dist * dist) / k2)
    const move = Math.sign(amplitude) * Math.min(Math.abs(amplitude) * falloff, dist * 0.85)
    return [x + (dx / dist) * move, y + (dy / dist) * move] as const
  })
}

function poly(points: readonly Point[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z'
}

/**
 * Recorte del botón: el contorno hundido más todo lo que queda fuera de la caja original (para no cortar la sombra).
 * Tres trazos: marco exterior (horario), caja original (antihorario) y contorno hundido (horario).
 */
export function dentClipPath(base: readonly Point[], dented: readonly Point[], w: number, h: number): string {
  const frame = `M${-CLIP_PAD} ${-CLIP_PAD}H${w + CLIP_PAD}V${h + CLIP_PAD}H${-CLIP_PAD}Z`
  const original = poly([...base].reverse())
  return `path("${frame}${original}${poly(dented)}")`
}
