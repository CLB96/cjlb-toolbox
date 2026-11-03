/**
 * Generador de la plantilla de captura (navegador, exceljs).
 *
 * Una sola hoja y cuatro columnas: Pieza, Operador, Ensayo y Valor. Los datos
 * del estudio (característica, límites, método) se capturan en el formulario y
 * no viajan en el archivo.
 *
 * El diseño decide las filas: 10 piezas x 3 operadores x 3 ensayos = 90 filas
 * ya preparadas, en el orden que el usuario espera encontrar.
 */
import ExcelJS from 'exceljs'

export interface DisenoPlantilla {
  piezas: readonly string[]
  operadores: readonly string[]
  ensayos: number
  /** Filas vacías al final, por si el estudio crece. Por defecto, 0. */
  extra?: number
}

const NEGRO = 'FF2E1B52'
const BORDE = { style: 'thin' as const, color: { argb: 'FFD9D2F0' } }
const TODOS = { top: BORDE, left: BORDE, bottom: BORDE, right: BORDE }

const NOTAS: Record<string, string> = {
  A1: 'Pieza: texto o número. La misma pieza para todos los operadores.',
  B1: 'Operador: el mismo nombre en todas sus filas.',
  C1: 'Ensayo: entero, 1, 2, 3…',
  D1: 'Rellena solo esta columna.\nAcepta 2.501 o 2,501, sin unidades.\n' +
      'Si falta una lectura, deja la celda vacía.',
}

export function filasDelDiseno(d: DisenoPlantilla): { pieza: string; operador: string; ensayo: number }[] {
  const filas: { pieza: string; operador: string; ensayo: number }[] = []
  for (const pieza of d.piezas) {
    for (const operador of d.operadores) {
      for (let e = 1; e <= d.ensayos; e++) filas.push({ pieza, operador, ensayo: e })
    }
  }
  return filas
}

export async function generarPlantilla(d: DisenoPlantilla): Promise<ArrayBuffer> {
  const piezas = d.piezas.length ? [...d.piezas] : ['1']
  const operadores = d.operadores.length ? [...d.operadores] : ['Operador 1']
  const filas = filasDelDiseno({ piezas, operadores, ensayos: Math.max(1, d.ensayos) })
  const extra = Math.max(0, d.extra ?? 0)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'CJLB Toolbox'
  wb.created = new Date()
  const ws = wb.addWorksheet('Datos', { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = [
    { header: 'Pieza', key: 'pieza', width: 14 },
    { header: 'Operador', key: 'operador', width: 22 },
    { header: 'Ensayo', key: 'ensayo', width: 10 },
    { header: 'Valor', key: 'valor', width: 12 },
  ]

  const cabecera = ws.getRow(1)
  cabecera.height = 22
  cabecera.eachCell((cell, col) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = TODOS
    const nota = NOTAS[cell.address]
    if (nota) cell.note = { texts: [{ text: nota }] }
    void col
  })

  for (const f of filas) ws.addRow([f.pieza, f.operador, f.ensayo, null])
  for (let i = 0; i < extra; i++) ws.addRow([null, null, null, null])

  const ultima = filas.length + extra + 1
  for (let r = 2; r <= ultima; r++) {
    const fila = ws.getRow(r)
    for (let c = 1; c <= 4; c++) {
      const cell = fila.getCell(c)
      cell.border = TODOS
      if (c === 4) cell.numFmt = '0.000'
    }
  }

  ws.autoFilter = { from: 'A1', to: `D${ultima}` }

  // exceljs lo soporta en runtime, pero sus tipos no declaran dataValidations.
  const dv = (ws as unknown as {
    dataValidations: { add(ref: string, opciones: Record<string, unknown>): void }
  }).dataValidations

  dv.add(`B2:B${ultima}`, {
    type: 'list',
    allowBlank: false,
    formulae: [`"${operadores.join(',').slice(0, 250)}"`],
    showErrorMessage: true,
    errorStyle: 'warning',
    errorTitle: 'Operador fuera de la lista',
    error: 'Revisa que sea el mismo nombre en todas sus filas.',
  })
  dv.add(`C2:C${ultima}`, {
    type: 'whole',
    operator: 'between',
    formulae: ['1', '10'],
    allowBlank: false,
    showErrorMessage: true,
    errorStyle: 'warning',
    errorTitle: 'Ensayo no válido',
    error: 'El ensayo va de 1 a 10.',
  })
  dv.add(`D2:D${ultima}`, {
    type: 'decimal',
    operator: 'between',
    formulae: ['-1000000', '1000000'],
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Valor no válido',
    error: 'Escribe un número, sin unidades ni símbolos.',
  })

  // Resalta las filas preparadas a las que todavía les falta el valor.
  ws.addConditionalFormatting({
    ref: `D2:D${ultima}`,
    rules: [{
      type: 'expression',
      priority: 1,
      formulae: ['AND($A2<>"",$D2="")'],
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFD9D9' } } },
    }],
  })

  const buffer = await wb.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}
