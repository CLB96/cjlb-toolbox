// Conversor MWX/MWP/MPX -> Excel (convertSingleMwxFile). JSZip 3.10.1 + SheetJS 0.18.5, ambos bajo demanda.
// Igual que el original: lee solo la primera hoja (sheet.json), mensajes de registro fijos en español.

export type MwxLogType = 'info' | 'success' | 'error' | 'warning'
export type MwxLog = (message: string, type?: MwxLogType) => void

interface MwxColumn {
  WorksheetVarBody?: {
    Name?: string
    VarData?: { VarDataBody?: { NumericData?: (number | string)[]; TextData?: (number | string)[] } }
  }
}
interface MwxSheet {
  Data?: { Columns?: MwxColumn[]; PrivateTitle?: string; Charts?: unknown[]; Analysis?: unknown[] }
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const MWX_EXT = /\.(mwx|mwp|mpx)$/i

export const xlsxName = (name: string): string => name.replace(MWX_EXT, '.xlsx')

/** Convierte el contenido del archivo en un libro XLSX (bytes). Lanza los mismos errores que el original. */
export async function mwxToXlsx(buffer: ArrayBuffer, log: MwxLog): Promise<Uint8Array> {
  const { default: JSZip } = await import('jszip')
  const XLSX = await import('xlsx')
  const zip = await JSZip.loadAsync(buffer)
  const sheetJsonFile = zip.file(/sheets\/.*\/sheet\.json$/i)[0]
  if (!sheetJsonFile) {
    throw new Error('No se encontró sheet.json en el archivo (verifica que sea un MWX/MWP/MPX válido)')
  }
  const data = JSON.parse(await sheetJsonFile.async('text')) as MwxSheet
  const columns = data.Data?.Columns || []
  if (columns.length === 0) {
    throw new Error('No se encontraron columnas de datos')
  }
  log(`  └─ Encontradas ${columns.length} columna(s) de datos`, 'info')

  const wb = XLSX.utils.book_new()
  const sheetName = data.Data?.PrivateTitle || 'Hoja 1'
  const headers: string[] = []
  const columnData: (number | string)[][] = []
  let maxRows = 0
  columns.forEach((col) => {
    headers.push(col.WorksheetVarBody?.Name || 'Sin nombre')
    const body = col.WorksheetVarBody?.VarData?.VarDataBody
    const numericData = body?.NumericData || []
    const textData = body?.TextData || []
    const colValues = numericData.length > 0 ? numericData : textData
    columnData.push(colValues)
    maxRows = Math.max(maxRows, colValues.length)
  })
  log(`  └─ Total de ${maxRows} filas de datos`, 'info')

  const excelData: (number | string)[][] = [headers]
  for (let row = 0; row < maxRows; row++) {
    excelData.push(columnData.map((colValues) => (row < colValues.length ? colValues[row]! : '')))
  }
  const ws = XLSX.utils.aoa_to_sheet(excelData)
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...columnData[i]!.slice(0, 100).map((v) => String(v).length))
    return { wch: Math.min(maxLen + 2, 30) }
  })
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))

  if ((data.Data?.Charts?.length ?? 0) > 0 || (data.Data?.Analysis?.length ?? 0) > 0) {
    log('  ⚠ Archivo contiene gráficas/análisis no convertibles', 'warning')
  }
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array
}

/** Convierte y descarga un archivo (un .xlsx por entrada). */
export async function convertMwxFile(file: File, log: MwxLog): Promise<void> {
  const bytes = await mwxToXlsx(await file.arrayBuffer(), log)
  const blob = new Blob([bytes as BlobPart], { type: XLSX_MIME })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = xlsxName(file.name)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  log(`  ✓ Guardado como: ${a.download}`, 'success')
}

/** convertMwxFiles: procesa en orden, registra errores por archivo y devuelve cuántos salieron bien. */
export async function convertMwxFiles(files: File[], log: MwxLog): Promise<number> {
  let ok = 0
  log(`📂 Iniciando conversión de ${files.length} archivo(s)...`, 'info')
  for (const file of files) {
    try {
      log(`🔄 Procesando: ${file.name}`, 'info')
      await convertMwxFile(file, log)
      ok++
    } catch (error) {
      log(`❌ Error en ${file.name}: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }
  log(`✅ Conversión completada: ${ok}/${files.length} exitosos`, 'success')
  return ok
}
