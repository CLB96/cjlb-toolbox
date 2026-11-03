import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { nombreArchivo } from '../export/descargar'
import { construirLibro } from '../export/exportExcel'
import { filasDelDiseno, generarPlantilla } from '../export/generarPlantilla'
import { calcularEstudio } from '../logic/estudio'
import { aMatriz, parseGrid, type Cell } from '../logic/parse'

const grid: Cell[][] = csv.trim().split(/\r?\n/).map((l) => l.split(',')
  .map((c, i) => (i < 2 || Number.isNaN(Number(c)) ? c : Number(c))))
const parsed = parseGrid(grid)
const resultado = calcularEstudio(aMatriz(parsed.lecturas, parsed.diseno), { lsl: 2.4, usl: 2.6 })
const META = { pieza: 'A-12', caracteristica: 'Espesor', especificacion: '2.5', lang: 'es' as const }

async function leerHoja(buffer: ArrayBuffer, nombre: string): Promise<Cell[][]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const filas: Cell[][] = []
  wb.getWorksheet(nombre)?.eachRow((fila) => {
    filas.push((fila.values as Cell[]).slice(1))
  })
  return filas
}

describe('nombre de archivo', () => {
  const fecha = new Date(2026, 10, 2)

  it('sigue el formato gageflow-<pieza>-<fecha>', () => {
    expect(nombreArchivo('A-12', 'png', fecha)).toBe('gageflow-A-12-20261102.png')
  })

  it('limpia acentos y signos', () => {
    expect(nombreArchivo(' Pieza ñ/1 ', 'pdf', fecha)).toBe('gageflow-Pieza-n-1-20261102.pdf')
  })

  it('usa un nombre por defecto si la pieza queda vacía', () => {
    expect(nombreArchivo('///', 'xlsx', fecha)).toBe('gageflow-estudio-20261102.xlsx')
  })
})

describe('plantilla', () => {
  const diseno = { piezas: ['1', '2'], operadores: ['Ana', 'Luis'], ensayos: 3 }

  it('prepara una fila por pieza, operador y ensayo', () => {
    const f = filasDelDiseno(diseno)
    expect(f).toHaveLength(12)
    expect(f[0]).toEqual({ pieza: '1', operador: 'Ana', ensayo: 1 })
    expect(f[11]).toEqual({ pieza: '2', operador: 'Luis', ensayo: 3 })
  })

  it('el lector reconoce la plantilla recién descargada', async () => {
    const filas = await leerHoja(await generarPlantilla(diseno), 'Datos')
    const r = parseGrid(filas)
    expect(r.layout).toBe('long')
    expect(r.issues.map((i) => i.codigo)).toEqual(['SIN_VALORES'])
    expect(r.diseno).toEqual({ piezas: ['1', '2'], operadores: ['Ana', 'Luis'], ensayos: [1, 2, 3] })
  })

  it('una plantilla rellena da un estudio válido', async () => {
    const filas = await leerHoja(await generarPlantilla({ ...diseno, piezas: ['1', '2', '3', '4', '5'] }), 'Datos')
    const llenas = filas.map((f, i) => (i === 0 ? f : [f[0], f[1], f[2], 2.5 + i / 1000]))
    expect(parseGrid(llenas).ok).toBe(true)
  })
})

describe('Excel del estudio', () => {
  it('trae datos, resumen, ANOVA y componentes', async () => {
    const wb = await construirLibro(resultado, parsed.diseno, parsed.lecturas, META)
    expect(wb.worksheets.map((h) => h.name)).toEqual(['Datos', 'Resumen', 'ANOVA', 'Componentes'])
  })

  it('los datos exportados se pueden volver a cargar con el mismo resultado', async () => {
    const wb = await construirLibro(resultado, parsed.diseno, parsed.lecturas, META)
    const buffer = await wb.xlsx.writeBuffer() as unknown as ArrayBuffer
    const r = parseGrid(await leerHoja(buffer, 'Datos'))
    expect(r.ok).toBe(true)
    const otra = calcularEstudio(aMatriz(r.lecturas, r.diseno), { lsl: 2.4, usl: 2.6 })
    expect(otra.pctGrrTolerancia).toBeCloseTo(resultado.pctGrrTolerancia ?? 0, 8)
  })
})
