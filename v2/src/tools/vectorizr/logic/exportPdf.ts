// Exportación PDF 1:1. Basado en Digitalizacion/src/lib/export-pdf.ts con:
//   M3: tramos Bezier aplanados como en el canvas.
//   M5/S7: la hoja ISO A más pequeña (A4…A0, vertical u horizontal) donde cabe el dibujo + márgenes;
//          si no cabe en A0, página a medida. El mínimo del dibujo queda en el margen. Nunca recorta.
import type { ContourPoint, ImagePoint } from '../types'
import { flattenContour } from './contourPath'

export const PDF_MARGIN = 15

export type PdfPageName = 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'custom'
export type PdfOrientation = 'portrait' | 'landscape'

export interface PdfPage {
  name: PdfPageName
  orientation: PdfOrientation
  /** Ancho y alto reales de la página en mm (ya orientada). */
  width: number
  height: number
}

/** Hojas ISO A en vertical (mm), de menor a mayor. */
const ISO_SHEETS: { name: Exclude<PdfPageName, 'custom'>; w: number; h: number }[] = [
  { name: 'A4', w: 210, h: 297 },
  { name: 'A3', w: 297, h: 420 },
  { name: 'A2', w: 420, h: 594 },
  { name: 'A1', w: 594, h: 841 },
  { name: 'A0', w: 841, h: 1189 },
]

/** Hoja más pequeña donde cabe un dibujo de bboxW×bboxH mm más PDF_MARGIN por lado. */
export function choosePdfPage(bboxW: number, bboxH: number): PdfPage {
  const needW = bboxW + 2 * PDF_MARGIN
  const needH = bboxH + 2 * PDF_MARGIN
  for (const s of ISO_SHEETS) {
    if (needW <= s.w && needH <= s.h) return { name: s.name, orientation: 'portrait', width: s.w, height: s.h }
    if (needW <= s.h && needH <= s.w) return { name: s.name, orientation: 'landscape', width: s.h, height: s.w }
  }
  return { name: 'custom', orientation: needW > needH ? 'landscape' : 'portrait', width: needW, height: needH }
}

export interface PdfLayout {
  page: PdfPage
  /** Polilíneas cerradas ya en mm de página. */
  polylines: ImagePoint[][]
}

/** Calcula hoja y coordenadas. null si no hay ningún trazo (el original tampoco generaba PDF). */
export function layoutPdf(
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
): PdfLayout | null {
  const allPaths = [...extraPaths, ...(active.length >= 2 ? [active] : [])]
  if (allPaths.length === 0) return null

  const drawable = allPaths.filter((path) => path.length >= 2).map((path) => flattenContour(path))
  const pts = drawable.flat()
  const minX = pts.length ? Math.min(...pts.map((p) => p.x * scaleFactor)) : 0
  const minY = pts.length ? Math.min(...pts.map((p) => p.y * scaleFactor)) : 0
  const maxX = pts.length ? Math.max(...pts.map((p) => p.x * scaleFactor)) : 0
  const maxY = pts.length ? Math.max(...pts.map((p) => p.y * scaleFactor)) : 0

  const page = choosePdfPage(maxX - minX, maxY - minY)
  const offX = PDF_MARGIN - minX
  const offY = PDF_MARGIN - minY
  const polylines = drawable.map((path) => path.map((p) => ({ x: p.x * scaleFactor + offX, y: p.y * scaleFactor + offY })))
  return { page, polylines }
}

/** Lo mínimo de jsPDF que se usa para dibujar (permite grabar las llamadas en las pruebas). */
export interface PdfDrawTarget {
  setDrawColor(ch1: number): unknown
  setLineWidth(width: number): unknown
  line(x1: number, y1: number, x2: number, y2: number): unknown
}

export function drawPdf(doc: PdfDrawTarget, layout: PdfLayout): void {
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  for (const scaled of layout.polylines) {
    for (let i = 0; i < scaled.length; i++) {
      const curr = scaled[i]
      const next = scaled[(i + 1) % scaled.length]
      doc.line(curr.x, curr.y, next.x, next.y)
    }
  }
}

export async function downloadPdf(
  active: ContourPoint[],
  scaleFactor: number,
  extraPaths: ContourPoint[][] = [],
  filename = 'vectorizr.pdf',
): Promise<void> {
  const layout = layoutPdf(active, scaleFactor, extraPaths)
  if (!layout) return
  const { jsPDF } = await import('jspdf')
  const { page } = layout
  const format = page.name === 'custom' ? [page.width, page.height] : page.name.toLowerCase()
  const doc = new jsPDF({ unit: 'mm', format, orientation: page.orientation })
  drawPdf(doc, layout)
  doc.save(filename)
}
