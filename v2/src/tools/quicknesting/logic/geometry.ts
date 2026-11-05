// Geometría de polígonos simples que el motor original tomaba de Shapely: área, límites,
// rotación, traslación, validez, contención, solape con área y distancia entre bordes.
// Los anillos se guardan abiertos (sin repetir el primer punto al final).

export type Pt = [number, number]
export type Bounds = [number, number, number, number]

/** Distancia por debajo de la cual un punto se considera sobre una recta o un borde, en mm. */
const TOUCH = 1e-9
/** Desplazamiento hacia el interior para saber de qué lado queda un borde compartido. */
const PROBE = 1e-6

export interface Poly {
  pts: Pt[]
  bounds: Bounds
  area: number
}

export function openRing(points: readonly (readonly number[])[]): Pt[] {
  const pts = points.map((p) => [p[0], p[1]] as Pt)
  if (pts.length > 1) {
    const a = pts[0]
    const b = pts[pts.length - 1]
    if (a[0] === b[0] && a[1] === b[1]) pts.pop()
  }
  return pts
}

/** Coordenadas del contorno cerrado, como `exterior.coords` de Shapely. */
export function closedCoords(pts: readonly Pt[]): number[][] {
  const out = pts.map((p) => [p[0], p[1]])
  if (pts.length) out.push([pts[0][0], pts[0][1]])
  return out
}

/** Misma fórmula que GEOS (Area::ofRing), para obtener los mismos valores. */
export function ringArea(pts: readonly Pt[]): number {
  const n = pts.length
  if (n < 3) return 0
  const ring = [...pts, pts[0]]
  const x0 = ring[0][0]
  let sum = 0
  for (let i = 1; i < ring.length - 1; i++) {
    sum += (ring[i][0] - x0) * (ring[i - 1][1] - ring[i + 1][1])
  }
  return Math.abs(sum / 2)
}

function signedArea(pts: readonly Pt[]): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    s += a[0] * b[1] - b[0] * a[1]
  }
  return s / 2
}

export function boundsOf(pts: readonly Pt[]): Bounds {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
  for (const [x, y] of pts) {
    if (x < a) a = x
    if (y < b) b = y
    if (x > c) c = x
    if (y > d) d = y
  }
  return [a, b, c, d]
}

export function makePoly(pts: Pt[]): Poly {
  return { pts, bounds: boundsOf(pts), area: ringArea(pts) }
}

export function translate(poly: Poly, dx: number, dy: number): Poly {
  return makePoly(poly.pts.map(([x, y]) => [x + dx, y + dy] as Pt))
}

/** Rotación antihoraria alrededor del origen, en grados, con el redondeo de Shapely. */
export function rotate(poly: Poly, degrees: number): Poly {
  const r = (degrees * Math.PI) / 180
  let c = Math.cos(r)
  let s = Math.sin(r)
  if (Math.abs(c) < 2.5e-16) c = 0
  if (Math.abs(s) < 2.5e-16) s = 0
  return makePoly(poly.pts.map(([x, y]) => [c * x - s * y, s * x + c * y] as Pt))
}

/** Gira siempre la fuente sin cambios y la apoya en el origen: el ángulo es absoluto. */
export function orient(poly: Poly, degrees: number): Poly {
  const rotated = rotate(poly, degrees)
  return translate(rotated, -rotated.bounds[0], -rotated.bounds[1])
}

function cross(a: Pt, b: Pt, c: Pt): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

/** Lado de c respecto a la recta ab: 1 izquierda, -1 derecha, 0 sobre ella. */
function side(a: Pt, b: Pt, c: Pt): number {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const d = len ? cross(a, b, c) / len : 0
  return d > TOUCH ? 1 : d < -TOUCH ? -1 : 0
}

function pointSegDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  let t = len2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/** Cruce transversal: cada segmento corta al otro en un punto interior de ambos. */
function properCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const s1 = side(a, b, c)
  const s2 = side(a, b, d)
  const s3 = side(c, d, a)
  const s4 = side(c, d, b)
  return s1 * s2 < 0 && s3 * s4 < 0
}

function segmentsTouch(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  if (properCross(a, b, c, d)) return true
  return pointSegDist(c, a, b) <= TOUCH || pointSegDist(d, a, b) <= TOUCH ||
    pointSegDist(a, c, d) <= TOUCH || pointSegDist(b, c, d) <= TOUCH
}

function segSegDist(a: Pt, b: Pt, c: Pt, d: Pt): number {
  if (properCross(a, b, c, d)) return 0
  return Math.min(pointSegDist(a, c, d), pointSegDist(b, c, d), pointSegDist(c, a, b), pointSegDist(d, a, b))
}

/** 1 dentro, 0 sobre el borde, -1 fuera. */
export function locate(p: Pt, pts: readonly Pt[]): number {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[j]
    const b = pts[i]
    if (pointSegDist(p, a, b) <= TOUCH) return 0
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside
    }
  }
  return inside ? 1 : -1
}

function boxesApart(a: Bounds, b: Bounds, margin: number): boolean {
  return a[2] + margin < b[0] || b[2] + margin < a[0] || a[3] + margin < b[1] || b[3] + margin < a[1]
}

function segBounds(a: Pt, b: Pt): Bounds {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]
}

/**
 * Tramos de los bordes de `a` separados donde toca el borde de `b`. Devuelve null si los
 * bordes se cruzan de forma transversal. Cada tramo queda entero dentro, fuera o sobre `b`.
 */
function pieces(a: readonly Pt[], b: readonly Pt[]): { mid: Pt; normal: Pt }[] | null {
  const out: { mid: Pt; normal: Pt }[] = []
  const ccw = signedArea(a) > 0
  for (let i = 0; i < a.length; i++) {
    const p = a[i]
    const q = a[(i + 1) % a.length]
    const box = segBounds(p, q)
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len2 = dx * dx + dy * dy
    const cuts = [0, 1]
    for (let j = 0; j < b.length; j++) {
      const c = b[j]
      const d = b[(j + 1) % b.length]
      if (boxesApart(box, segBounds(c, d), TOUCH)) continue
      if (properCross(p, q, c, d)) return null
      for (const v of [c, d]) {
        if (len2 && pointSegDist(v, p, q) <= TOUCH) {
          const t = ((v[0] - p[0]) * dx + (v[1] - p[1]) * dy) / len2
          if (t > 0 && t < 1) cuts.push(t)
        }
      }
    }
    cuts.sort((x, y) => x - y)
    const len = Math.sqrt(len2)
    const normal: Pt = len ? (ccw ? [-dy / len, dx / len] : [dy / len, -dx / len]) : [0, 0]
    for (let k = 0; k < cuts.length - 1; k++) {
      if (cuts[k + 1] - cuts[k] <= 1e-12) continue
      const t = (cuts[k] + cuts[k + 1]) / 2
      out.push({ mid: [p[0] + t * dx, p[1] + t * dy], normal })
    }
  }
  return out
}

function sideOverlaps(a: Poly, b: Poly): boolean {
  const parts = pieces(a.pts, b.pts)
  if (parts === null) return true
  for (const { mid, normal } of parts) {
    const where = locate(mid, b.pts)
    if (where > 0) return true
    if (where === 0) {
      const probe: Pt = [mid[0] + normal[0] * PROBE, mid[1] + normal[1] * PROBE]
      if (locate(probe, b.pts) > 0) return true
    }
  }
  return false
}

/** ¿Los interiores se solapan con área positiva? Tocarse por un borde o un punto no cuenta. */
export function overlaps(a: Poly, b: Poly): boolean {
  if (boxesApart(a.bounds, b.bounds, TOUCH)) return false
  return sideOverlaps(a, b) || sideOverlaps(b, a)
}

/** Distancia mínima entre bordes; 0 si se tocan o se cruzan. */
export function distance(a: Poly, b: Poly): number {
  let best = Infinity
  for (let i = 0; i < a.pts.length; i++) {
    const p = a.pts[i]
    const q = a.pts[(i + 1) % a.pts.length]
    for (let j = 0; j < b.pts.length; j++) {
      const d = segSegDist(p, q, b.pts[j], b.pts[(j + 1) % b.pts.length])
      if (d < best) best = d
      if (best === 0) return 0
    }
  }
  return best
}

/** ¿`outer` contiene por completo a `inner` (bordes compartidos incluidos)? */
export function contains(outer: Poly, inner: Poly): boolean {
  const ib = inner.bounds
  const ob = outer.bounds
  if (ib[0] < ob[0] - TOUCH || ib[1] < ob[1] - TOUCH || ib[2] > ob[2] + TOUCH || ib[3] > ob[3] + TOUCH) return false
  const parts = pieces(inner.pts, outer.pts)
  if (parts === null) return false
  return inner.pts.every((p) => locate(p, outer.pts) >= 0) && parts.every(({ mid }) => locate(mid, outer.pts) >= 0)
}

/** Polígono simple: al menos tres vértices distintos y sin cruces ni toques entre bordes. */
export function isValidRing(pts: readonly Pt[]): boolean {
  const ring = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1])
  if (ring.length > 1) {
    const a = ring[0]
    const b = ring[ring.length - 1]
    if (a[0] === b[0] && a[1] === b[1]) ring.pop()
  }
  const n = ring.length
  if (n < 3 || !pts.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) return false
  const edges = ring.map((p, i) => ({ i, p, q: ring[(i + 1) % n], box: segBounds(p, ring[(i + 1) % n]) }))
  for (const e of edges) {
    const next = edges[(e.i + 1) % n]
    // Borde que vuelve sobre el anterior (espiga): no es un polígono válido.
    if (side(e.p, e.q, next.q) === 0) {
      const dot = (e.q[0] - e.p[0]) * (next.q[0] - next.p[0]) + (e.q[1] - e.p[1]) * (next.q[1] - next.p[1])
      if (dot < 0) return false
    }
  }
  const sorted = [...edges].sort((x, y) => x.box[0] - y.box[0])
  for (let k = 0; k < sorted.length; k++) {
    const e = sorted[k]
    for (let m = k + 1; m < sorted.length && sorted[m].box[0] <= e.box[2] + TOUCH; m++) {
      const f = sorted[m]
      const gap = Math.abs(e.i - f.i)
      if (gap === 1 || gap === n - 1) continue
      if (boxesApart(e.box, f.box, TOUCH)) continue
      if (segmentsTouch(e.p, e.q, f.p, f.q)) return false
    }
  }
  return true
}
