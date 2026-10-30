import type { Column, ParsedSheet } from './types'

export type ParseResult =
  | { ok: true; data: ParsedSheet }
  | { ok: false; reason: 'empty' | 'noTemperature' }

/**
 * Convierte filas crudas (sheet_to_json header:1) en columnas de temperatura.
 * La primera fila es siempre dato (no hay manejo de encabezados). Igual que el original:
 * se descartan filas totalmente vacías, se ignoran columnas sin números y se recorta
 * al último dato presente en cualquier columna.
 */
export function parseSheetRows(raw: unknown[][]): ParseResult {
  const rows = raw.filter((r) => r.some((v) => v !== null && v !== ''))
  if (!rows.length) return { ok: false, reason: 'empty' }

  let numCols = 0
  for (const r of rows) if (r.length > numCols) numCols = r.length

  const allColumns: Column[] = []
  for (let c = 0; c < numCols; c++) {
    const col: Column = []
    for (let r = 0; r < rows.length; r++) {
      const val = parseFloat(String(rows[r][c]))
      col.push(isNaN(val) ? null : val)
    }
    allColumns.push(col)
  }

  const activeColumns = allColumns.filter((col) => col.some((v) => v !== null))
  if (!activeColumns.length) return { ok: false, reason: 'noTemperature' }

  let lastRow = 0
  for (const col of activeColumns) {
    for (let r = col.length - 1; r >= 0; r--) {
      if (col[r] !== null) {
        if (r + 1 > lastRow) lastRow = r + 1
        break
      }
    }
  }

  return { ok: true, data: { columns: activeColumns.map((col) => col.slice(0, lastRow)), totalRows: lastRow } }
}
