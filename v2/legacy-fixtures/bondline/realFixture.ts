import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const REAL_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../private/bondline-real.xlsx',
)

/** Todas las hojas del Excel real (gitignored) como las lee el original; null si no existe. */
export function loadRealWorkbook(): { name: string; raw: unknown[][] }[] | null {
  if (!existsSync(REAL_FILE)) return null
  const workbook = XLSX.readFile(REAL_FILE)
  return workbook.SheetNames.map((name) => ({
    name,
    raw: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null }) as unknown[][],
  }))
}
