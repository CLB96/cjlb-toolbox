// Exportar piezas: todo en un archivo (como antes) o un archivo por pieza con su nombre.
import type { ContourPoint, Piece } from '../types'
import { downloadDxf } from './exportDxf'
import { downloadPdf } from './exportPdf'
import { downloadSvg } from './exportSvg'
import { pieceLabel, uniqueFileNames } from './pieces'

export type ExportFormat = 'DXF' | 'SVG' | 'PDF'

export const EXPORT_FILENAMES: Record<ExportFormat, string> = {
  DXF: 'vectorizr.dxf',
  SVG: 'vectorizr.svg',
  PDF: 'vectorizr.pdf',
}

/** Argumentos de los exportadores para todo en un archivo. Con una pieza son los de siempre. */
export function allInOneArgs(pieces: Piece[]): { active: ContourPoint[]; extra: ContourPoint[][] } {
  const [first, ...rest] = pieces
  if (!first) return { active: [], extra: [] }
  const extra = [...first.paths, ...rest.flatMap((p) => [...p.paths, ...(p.contourPoints.length > 1 ? [p.contourPoints] : [])])]
  return { active: first.contourPoints, extra }
}

export async function exportAllInOne(format: ExportFormat, pieces: Piece[], scaleFactor: number): Promise<void> {
  const { active, extra } = allInOneArgs(pieces)
  const filename = EXPORT_FILENAMES[format]
  if (format === 'DXF') downloadDxf(active, scaleFactor, extra, filename)
  else if (format === 'SVG') downloadSvg(active, scaleFactor, extra, filename)
  else await downloadPdf(active, scaleFactor, extra, filename)
}

/** Un archivo por pieza, con el nombre de la pieza. Se detiene en el primer fallo. */
export async function exportIndividual(format: ExportFormat, pieces: Piece[], scaleFactor: number): Promise<void> {
  const ext = format.toLowerCase() as 'dxf' | 'svg' | 'pdf'
  const names = uniqueFileNames(pieces.map((p, i) => pieceLabel(p, i)), ext)
  for (const [i, piece] of pieces.entries()) {
    if (format === 'DXF') downloadDxf(piece.contourPoints, scaleFactor, piece.paths, names[i])
    else if (format === 'SVG') downloadSvg(piece.contourPoints, scaleFactor, piece.paths, names[i])
    else await downloadPdf(piece.contourPoints, scaleFactor, piece.paths, names[i])
  }
}
