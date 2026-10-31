// @ts-nocheck
// Referencia legacy de VectoriZr: copia literal del original (Digitalizacion/src); solo cambian los
// imports y los `export`. Origen:
//   unitToMm/computeScaleFactor/pxToMm <- hooks/useScale.ts:3-29
//   MAX_SIZE/clampDimensions           <- lib/imageNormalize.ts:1-11
//   polylineBlock/pointsToDxf          <- lib/export-dxf.ts:3-46
//   pathD/pointsToSvg                  <- lib/export-svg.ts:3-38
//   legacyDrawPdf                      <- lib/export-pdf.ts:10-31 (cuerpo de downloadPdf; `doc` se
//                                         recibe ya creado como A4 mm para poder grabar las llamadas)
//   buildPath                          <- components/editor/EditorCanvas.tsx:20-39
import type { ContourPoint, ScaleUnit } from '../../src/tools/vectorizr/types'

export function unitToMm(value: number, unit: ScaleUnit): number {
  switch (unit) {
    case 'mm': return value
    case 'cm': return value * 10
    case 'm':  return value * 1000
    case 'in': return value * 25.4
  }
}

export function computeScaleFactor(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  realValue: number,
  unit: ScaleUnit,
): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const distPx = Math.sqrt(dx * dx + dy * dy)
  const distMm = unitToMm(realValue, unit)
  return distMm / distPx
}

export function pxToMm(px: number, scaleFactor: number): number {
  return px * scaleFactor
}

export const MAX_SIZE = 4096

export function clampDimensions(
  width: number,
  height: number,
  maxSize = MAX_SIZE,
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) return { width, height }
  const ratio = Math.min(maxSize / width, maxSize / height)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function polylineBlock(points: ContourPoint[], scaleFactor: number, layer = '0'): string[] {
  if (points.length < 2) return []
  const lines: string[] = []
  const add = (code: number, value: string | number) => {
    lines.push(String(code)); lines.push(String(value))
  }
  add(0, 'POLYLINE'); add(8, layer); add(66, 1); add(70, 1)
  for (const pt of points) {
    add(0, 'VERTEX'); add(8, layer)
    add(10, (pt.x * scaleFactor).toFixed(6))
    add(20, (pt.y * scaleFactor).toFixed(6))
    add(30, '0.0')
  }
  add(0, 'SEQEND')
  return lines
}

export function pointsToDxf(
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
): string {
  const lines: string[] = []
  const add = (code: number, value: string | number) => {
    lines.push(String(code)); lines.push(String(value))
  }

  add(0, 'SECTION'); add(2, 'HEADER')
  add(9, '$ACADVER'); add(1, 'AC1009')
  add(0, 'ENDSEC')

  add(0, 'SECTION'); add(2, 'ENTITIES')

  // All finalized paths first
  extraPaths.forEach((path, i) => {
    polylineBlock(path, scaleFactor, String(i + 1)).forEach(l => lines.push(l))
  })
  // Active path
  polylineBlock(active, scaleFactor, '0').forEach(l => lines.push(l))

  add(0, 'ENDSEC')
  add(0, 'EOF')
  return lines.join('\n')
}

function pathD(points: ContourPoint[], scaleFactor: number): string {
  const s = points.map(p => ({ x: p.x * scaleFactor, y: p.y * scaleFactor, type: p.type, handles: p.handles }))
  let d = `M ${s[0].x.toFixed(3)} ${s[0].y.toFixed(3)}`
  for (let i = 1; i < s.length; i++) {
    const p = s[i]
    if (p.type === 'bezier' && p.handles) {
      d += ` C ${(p.handles.cp1.x * scaleFactor).toFixed(3)} ${(p.handles.cp1.y * scaleFactor).toFixed(3)}`
        + ` ${(p.handles.cp2.x * scaleFactor).toFixed(3)} ${(p.handles.cp2.y * scaleFactor).toFixed(3)}`
        + ` ${p.x.toFixed(3)} ${p.y.toFixed(3)}`
    } else {
      d += ` L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`
    }
  }
  return d + ' Z'
}

export function pointsToSvg(
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
): string {
  const allPaths = [...extraPaths, ...(active.length >= 2 ? [active] : [])]
  if (allPaths.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

  const allPoints = allPaths.flat()
  const maxX = Math.max(...allPoints.map(p => p.x * scaleFactor))
  const maxY = Math.max(...allPoints.map(p => p.y * scaleFactor))
  const w = maxX.toFixed(3)
  const h = maxY.toFixed(3)

  const pathTags = allPaths
    .filter(pts => pts.length >= 2)
    .map(pts => `  <path d="${pathD(pts, scaleFactor)}" fill="none" stroke="#000000" stroke-width="0.5"/>`)
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">\n${pathTags}\n</svg>`
}

/** Cuerpo de downloadPdf legacy; `doc` es un jsPDF A4 en mm (o un grabador de llamadas). */
export function legacyDrawPdf(
  doc: any,
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
  filename = 'vectorizr.pdf',
): void {
  const allPaths = [...extraPaths, ...(active.length >= 2 ? [active] : [])]
  if (allPaths.length === 0) return

  const margin = 15

  doc.setDrawColor(0)
  doc.setLineWidth(0.3)

  allPaths.forEach(path => {
    if (path.length < 2) return
    const scaled = path.map(p => ({
      x: p.x * scaleFactor + margin,
      y: p.y * scaleFactor + margin,
    }))
    for (let i = 0; i < scaled.length; i++) {
      const curr = scaled[i]
      const next = scaled[(i + 1) % scaled.length]
      doc.line(curr.x, curr.y, next.x, next.y)
    }
  })

  doc.save(filename)
}

/** Build an SVG path string supporting line and bezier segments (Catmull-Rom → cubic bezier). */
export function buildPath(pts: ContourPoint[], closed = true): string {
  if (pts.length < 2) return ''
  const n = pts.length
  let d = `M ${pts[0].x} ${pts[0].y}`
  const limit = closed ? n : n - 1
  for (let i = 0; i < limit; i++) {
    const curr = pts[i]
    const next = pts[(i + 1) % n]
    if (curr.type === 'bezier') {
      const prev = pts[(i - 1 + n) % n]
      const nn   = pts[(i + 2) % n]
      const t = 0.35
      d += ` C ${curr.x + (next.x - prev.x) * t} ${curr.y + (next.y - prev.y) * t} ${next.x - (nn.x - curr.x) * t} ${next.y - (nn.y - curr.y) * t} ${next.x} ${next.y}`
    } else {
      d += ` L ${next.x} ${next.y}`
    }
  }
  if (closed) d += ' Z'
  return d
}
