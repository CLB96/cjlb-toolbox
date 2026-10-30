import type { GapPoint } from './types'

function isHeaderCell(cell: unknown): boolean {
  return typeof cell === 'string' && cell.trim() !== '' && Number.isNaN(Number(cell))
}

function readNumber(cell: unknown): number | null {
  if (typeof cell === 'number' && !Number.isNaN(cell)) return cell
  if (typeof cell === 'string' && cell.trim() !== '' && !Number.isNaN(parseFloat(cell))) {
    return parseFloat(cell)
  }
  return null
}

/** Convierte las filas de la hoja (header:1) en puntos; null si no hay datos. */
export function parseRows(
  rows: unknown[][],
): { points: GapPoint[]; maxIter: number } | null {
  if (!rows || rows.length === 0) return null

  const firstRow: unknown[] = rows[0] || []
  const hasHeaders = firstRow.some(isHeaderCell)
  const dataStart = hasHeaders ? 1 : 0
  let numCols = 0
  for (const r of rows) numCols = Math.max(numCols, (r || []).length)

  const points: GapPoint[] = []
  for (let col = 0; col < numCols; col++) {
    const rawName = hasHeaders ? firstRow[col] : undefined
    const name =
      rawName !== undefined && rawName !== null && String(rawName).trim() !== ''
        ? String(rawName).trim()
        : `P${col + 1}`

    const values: number[] = []
    for (let row = dataStart; row < rows.length; row++) {
      const value = readNumber((rows[row] || [])[col])
      if (value !== null) values.push(value)
    }
    if (values.length > 0) points.push({ name, values })
  }

  if (points.length === 0) return null
  let maxIter = 0
  for (const p of points) maxIter = Math.max(maxIter, p.values.length)
  return { points, maxIter }
}
