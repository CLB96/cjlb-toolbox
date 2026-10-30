import * as XLSX from 'xlsx'
import { importWorkbook } from './importWorkbook'

function xlsxFile(sheets: Record<string, unknown[][]>): File {
  const wb = XLSX.utils.book_new()
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name)
  }
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new File([out], 'libro.xlsx')
}

test('devuelve todas las hojas en orden', async () => {
  const file = xlsxFile({ A: [[1, 2], [3, 4]], B: [[5, 6]], C: [[7, 8]] })
  const sheets = await importWorkbook(file)
  expect(sheets.map((s) => s.name)).toEqual(['A', 'B', 'C'])
  expect(sheets[0].raw).toEqual([[1, 2], [3, 4]])
  expect(sheets[2].raw).toEqual([[7, 8]])
})

test('si la lectura del archivo falla, rechaza', async () => {
  const file = new File(['x'], 'x.xlsx')
  Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.reject(new Error('boom')) })
  await expect(importWorkbook(file)).rejects.toThrow('boom')
})
