import * as XLSX from 'xlsx'

/** Textos del aviso de error de lectura; Task 4 los mueve al diccionario (clave `importFailed`). */
export const IMPORT_FAILED_TEXT = {
  es: 'No se pudo leer el archivo',
  en: 'The file could not be read',
} as const

function readBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsArrayBuffer(file)
  })
}

/** Lee la primera hoja del libro como filas (header: 1), igual que el original. */
export async function importExcelFile(file: File): Promise<unknown[][]> {
  try {
    const buf = await readBuffer(file)
    const workbook = XLSX.read(new Uint8Array(buf), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new Error('empty workbook')
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}
