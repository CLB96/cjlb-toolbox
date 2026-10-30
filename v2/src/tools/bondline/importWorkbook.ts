import * as XLSX from 'xlsx'

function readBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsArrayBuffer(file)
  })
}

export interface RawSheet {
  name: string
  raw: unknown[][]
}

/** Lee todas las hojas del libro como filas (header: 1), en el orden del archivo. Rechaza si no se puede leer. */
export async function importWorkbook(file: File): Promise<RawSheet[]> {
  const buf = await readBuffer(file)
  const workbook = XLSX.read(new Uint8Array(buf), { type: 'array' })
  if (!workbook.SheetNames.length) throw new Error('empty workbook')
  return workbook.SheetNames.map((name) => ({
    name,
    raw: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null }) as unknown[][],
  }))
}
