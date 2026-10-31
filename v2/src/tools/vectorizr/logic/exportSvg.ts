// Exportación SVG en mm. Igual que Digitalizacion/src/lib/export-svg.ts salvo:
//   M3: los tramos Bezier usan las mismas curvas C que el canvas (Catmull-Rom).
//   M4: viewBox del mínimo al máximo (antes de 0 al máximo); las coordenadas no cambian.
import type { ContourPoint } from '../types'
import { contourSegments, flattenContour } from './contourPath'
import { downloadBlob } from './download'

const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

function pathD(points: ContourPoint[], scaleFactor: number): string {
  const f = (v: number) => (v * scaleFactor).toFixed(3)
  const n = points.length
  let d = `M ${f(points[0].x)} ${f(points[0].y)}`
  for (const seg of contourSegments(points, true)) {
    if (seg.controls) {
      const [c1, c2] = seg.controls
      d += ` C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(seg.to.x)} ${f(seg.to.y)}`
    } else if (seg.index < n - 1) {
      // El tramo recto de cierre lo hace la Z, como en el original.
      d += ` L ${f(seg.to.x)} ${f(seg.to.y)}`
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
  // Caja con lo que se dibuja (curvas incluidas) para no recortar nada.
  const allPoints = allPaths.flatMap((pts) => flattenContour(pts))
  if (allPoints.length === 0) return EMPTY_SVG

  const xs = allPoints.map(p => p.x * scaleFactor)
  const ys = allPoints.map(p => p.y * scaleFactor)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const w = (Math.max(...xs) - minX).toFixed(3)
  const h = (Math.max(...ys) - minY).toFixed(3)

  const pathTags = allPaths
    .filter(pts => pts.length >= 2)
    .map(pts => `  <path d="${pathD(pts, scaleFactor)}" fill="none" stroke="#000000" stroke-width="0.5"/>`)
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(3)} ${minY.toFixed(3)} ${w} ${h}" width="${w}mm" height="${h}mm">\n${pathTags}\n</svg>`
}

export function downloadSvg(
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
  filename = 'vectorizr.svg',
): void {
  const content = pointsToSvg(active, scaleFactor, extraPaths)
  downloadBlob(new Blob([content], { type: 'image/svg+xml' }), filename)
}
