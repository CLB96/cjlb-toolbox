import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const REAL_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../private/gapcheck-real.xlsx',
)

/** Filas del Excel real (gitignored) como las lee el original; null si no existe. */
export function loadRealRows(): unknown[][] | null {
  if (!existsSync(REAL_FILE)) return null
  const workbook = XLSX.readFile(REAL_FILE)
  const ws = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][]
}
