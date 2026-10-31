// Exportación DXF (R12, AC1009). Igual que Digitalizacion/src/lib/export-dxf.ts salvo M3: los tramos
// Bezier se exportan aplanados como en el canvas. La Y NO se invierte (M2 rechazada por el dueño).
import type { ContourPoint } from '../types'
import { flattenContour } from './contourPath'
import { downloadBlob } from './download'

function polylineBlock(points: ContourPoint[], scaleFactor: number, layer = '0'): string[] {
  if (points.length < 2) return []
  const lines: string[] = []
  const add = (code: number, value: string | number) => {
    lines.push(String(code)); lines.push(String(value))
  }
  add(0, 'POLYLINE'); add(8, layer); add(66, 1); add(70, 1)
  for (const pt of flattenContour(points)) {
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

export function downloadDxf(
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
  filename = 'vectorizr.dxf',
): void {
  const content = pointsToDxf(active, scaleFactor, extraPaths)
  downloadBlob(new Blob([content], { type: 'application/dxf' }), filename)
}
