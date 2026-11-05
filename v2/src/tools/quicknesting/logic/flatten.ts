// Convierte cada entidad DXF admitida en una polilínea 3D en coordenadas del dibujo (WCS).
// Igual que ezdxf `make_path(...).flattening(tolerancia, segments=4)`: cada tramo curvo de
// hasta 90° (o cada tramo entre nudos de una spline) empieza con 4 segmentos y se subdivide
// mientras la flecha supere la tolerancia.
import { num, nums } from './dxf'
import type { DxfEntity, Tag } from './dxf'

export type V3 = [number, number, number]

export interface FlatPath {
  points: V3[]
  closed: boolean
}

const MAX_DEPTH = 18

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
const crossV = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2])
  if (!l) throw new Error('zero_vector')
  return mul(a, 1 / l)
}
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Sistema de coordenadas del objeto (algoritmo del eje arbitrario de AutoCAD). */
function ocs(tags: Tag[]): (p: V3) => V3 {
  const n = norm([num(tags, 210, 0), num(tags, 220, 0), num(tags, 230, 1)])
  if (n[0] === 0 && n[1] === 0 && n[2] === 1) return (p) => p
  const ax = norm(Math.abs(n[0]) < 1 / 64 && Math.abs(n[1]) < 1 / 64 ? crossV([0, 1, 0], n) : crossV([0, 0, 1], n))
  const ay = norm(crossV(n, ax))
  return (p) => add(add(mul(ax, p[0]), mul(ay, p[1])), mul(n, p[2]))
}

/** Muestrea f en [t0, t1] con `segments` tramos iniciales y subdivisión por flecha. */
function adaptive(f: (t: number) => V3, t0: number, t1: number, tol: number, out: V3[]): void {
  const step = (t1 - t0) / 4
  for (let k = 0; k < 4; k++) {
    const a = t0 + k * step
    refine(f, a, f(a), a + step, f(a + step), tol, out, 0)
  }
}

function refine(f: (t: number) => V3, a: number, pa: V3, b: number, pb: V3, tol: number, out: V3[], depth: number): void {
  const m = (a + b) / 2
  const pm = f(m)
  if (depth < MAX_DEPTH && dist(pm, mul(add(pa, pb), 0.5)) > tol) {
    refine(f, a, pa, m, pm, tol, out, depth + 1)
    refine(f, m, pm, b, pb, tol, out, depth + 1)
  } else {
    out.push(pb)
  }
}

/** Arco por ángulos (radianes, sentido antihorario), en tramos de hasta 90°. */
function arcPoints(f: (t: number) => V3, start: number, sweep: number, tol: number, out: V3[]): void {
  const parts = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9))
  for (let k = 0; k < parts; k++) {
    adaptive(f, start + (sweep * k) / parts, start + (sweep * (k + 1)) / parts, tol, out)
  }
}

/** Como ezdxf.math.arc_angle_span_deg. */
function spanDeg(start: number, end: number): number {
  if (Math.abs(start - end) <= 1e-9 * Math.max(Math.abs(start), Math.abs(end))) return 0
  const s = ((start % 360) + 360) % 360
  const e = ((end % 360) + 360) % 360
  if (Math.abs(s - e) <= 1e-9 * Math.max(s, e)) return 360
  return e > s ? e - s : 360 - s + e
}

function line(tags: Tag[]): V3[] {
  return [[num(tags, 10), num(tags, 20), num(tags, 30)], [num(tags, 11), num(tags, 21), num(tags, 31)]]
}

function arc(tags: Tag[], tol: number): V3[] {
  const toW = ocs(tags)
  const c: V3 = [num(tags, 10), num(tags, 20), num(tags, 30)]
  const r = num(tags, 40)
  const a0 = num(tags, 50)
  const sweep = spanDeg(a0, num(tags, 51))
  const f = (t: number): V3 => toW([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t), c[2]])
  const start = (a0 * Math.PI) / 180
  const out: V3[] = [f(start)]
  if (sweep) arcPoints(f, start, (sweep * Math.PI) / 180, tol, out)
  return out
}

/** Vértices en OCS con su abultamiento; el cierre añade el tramo final al primero. */
function bulgePath(verts: { x: number; y: number; b: number }[], closed: boolean, z: number, toW: (p: V3) => V3, tol: number): V3[] {
  if (!verts.length) return []
  const out: V3[] = [toW([verts[0].x, verts[0].y, z])]
  const count = closed ? verts.length : verts.length - 1
  for (let i = 0; i < count; i++) {
    const p = verts[i]
    const q = verts[(i + 1) % verts.length]
    if (!p.b || (p.x === q.x && p.y === q.y)) {
      out.push(toW([q.x, q.y, z]))
      continue
    }
    const theta = 4 * Math.atan(p.b)
    const chord = Math.hypot(q.x - p.x, q.y - p.y)
    const r = chord / (2 * Math.sin(theta / 2))
    const mx = (p.x + q.x) / 2
    const my = (p.y + q.y) / 2
    const h = r * Math.cos(theta / 2)
    const cx = mx - (h * (q.y - p.y)) / chord
    const cy = my + (h * (q.x - p.x)) / chord
    const rad = Math.abs(r)
    const start = Math.atan2(p.y - cy, p.x - cx)
    const f = (t: number): V3 => toW([cx + rad * Math.cos(t), cy + rad * Math.sin(t), z])
    const seg: V3[] = []
    arcPoints(f, start, theta, tol, seg)
    seg[seg.length - 1] = toW([q.x, q.y, z])
    out.push(...seg)
  }
  return out
}

function lwpolyline(tags: Tag[], tol: number): V3[] {
  const verts: { x: number; y: number; b: number }[] = []
  for (const [code, value] of tags) {
    const n = Number(value)
    if (code === 10) verts.push({ x: n, y: 0, b: 0 })
    else if (code === 20 && verts.length) verts[verts.length - 1].y = n
    else if (code === 42 && verts.length) verts[verts.length - 1].b = n
  }
  if (verts.some((v) => !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.b))) throw new Error('bad_number')
  return bulgePath(verts, (num(tags, 70) & 1) === 1, num(tags, 38), ocs(tags), tol)
}

function polyline(e: DxfEntity, tol: number): V3[] {
  const flags = num(e.tags, 70)
  if (flags & (16 | 64)) throw new Error('mesh_unsupported')
  const closed = (flags & 1) === 1
  const verts = (e.vertices ?? []).filter((v) => !(num(v, 70) & 16))
  if (flags & 8) {
    const pts: V3[] = verts.map((v) => [num(v, 10), num(v, 20), num(v, 30)])
    return closed && pts.length ? [...pts, pts[0]] : pts
  }
  const list = verts.map((v) => ({ x: num(v, 10), y: num(v, 20), b: num(v, 42) }))
  return bulgePath(list, closed, num(e.tags, 30), ocs(e.tags), tol)
}

function ellipse(tags: Tag[], tol: number): V3[] {
  const c: V3 = [num(tags, 10), num(tags, 20), num(tags, 30)]
  const major: V3 = [num(tags, 11), num(tags, 21), num(tags, 31)]
  const n = norm([num(tags, 210, 0), num(tags, 220, 0), num(tags, 230, 1)])
  const minor = mul(crossV(n, major), num(tags, 40, 1))
  const t0 = num(tags, 41, 0)
  let t1 = num(tags, 42, Math.PI * 2)
  if (t1 <= t0 + 1e-12) t1 += Math.PI * 2
  const f = (t: number): V3 => add(c, add(mul(major, Math.cos(t)), mul(minor, Math.sin(t))))
  const out: V3[] = [f(t0)]
  arcPoints(f, t0, t1 - t0, tol, out)
  return out
}

/** B-spline (racional si hay pesos) por de Boor, tramo a tramo entre nudos distintos. */
function spline(tags: Tag[], tol: number): V3[] {
  const p = num(tags, 71, 3)
  const knots = nums(tags, 40)
  const xs = nums(tags, 10)
  const ys = nums(tags, 20)
  const zs = nums(tags, 30)
  const ctrl: V3[] = xs.map((x, i) => [x, ys[i] ?? 0, zs[i] ?? 0])
  const weights = nums(tags, 41)
  const n = ctrl.length
  if (n < p + 1 || knots.length !== n + p + 1) throw new Error('spline_unsupported')
  const w = weights.length === n ? weights : ctrl.map(() => 1)
  const lo = knots[p]
  const hi = knots[n]
  const f = (t: number): V3 => {
    let k = p
    while (k < n - 1 && t >= knots[k + 1]) k++
    const d: [number, number, number, number][] = []
    for (let j = 0; j <= p; j++) {
      const q = ctrl[k - p + j]
      const wj = w[k - p + j]
      d.push([q[0] * wj, q[1] * wj, q[2] * wj, wj])
    }
    for (let r = 1; r <= p; r++) {
      for (let j = p; j >= r; j--) {
        const i = k - p + j
        const den = knots[i + p - r + 1] - knots[i]
        const a = den ? (t - knots[i]) / den : 0
        d[j] = [0, 1, 2, 3].map((m) => (1 - a) * d[j - 1][m] + a * d[j][m]) as [number, number, number, number]
      }
    }
    return [d[p][0] / d[p][3], d[p][1] / d[p][3], d[p][2] / d[p][3]]
  }
  const out: V3[] = [f(lo)]
  const breaks = [...new Set(knots.filter((k) => k > lo && k < hi))]
  const bounds = [lo, ...breaks, hi]
  for (let s = 0; s + 1 < bounds.length; s++) adaptive(f, bounds[s], bounds[s + 1], tol, out)
  return out
}

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1e-9 * Math.max(Math.abs(a), Math.abs(b)), 1e-12)

/** Polilínea aplanada de la entidad en unidades del dibujo; lanza si la geometría no es usable. */
export function flatten(e: DxfEntity, tol: number): FlatPath {
  const points = e.type === 'LINE' ? line(e.tags)
    : e.type === 'ARC' ? arc(e.tags, tol)
      : e.type === 'LWPOLYLINE' ? lwpolyline(e.tags, tol)
        : e.type === 'POLYLINE' ? polyline(e, tol)
          : e.type === 'ELLIPSE' ? ellipse(e.tags, tol)
            : spline(e.tags, tol)
  if (points.some((q) => q.some((v) => !Number.isFinite(v)))) throw new Error('bad_number')
  const a = points[0]
  const b = points[points.length - 1]
  const closed = points.length > 0 && close(a[0], b[0]) && close(a[1], b[1]) && close(a[2], b[2])
  return { points, closed }
}
