import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAnalysis, SAMPLE_INPUT, type AnalysisResult } from '../logic'
import type { CapaPoint } from '../store'
import { recordingCtx, type RecordingCtx } from '../testCanvas'
import { buildSummaryPages, splitPages } from './comparativeSummary'
import { drawExecutivePng } from './executivePng'
import { makeExportEnv, type ProjectExportData } from './exportEnv'
import { drawGuide } from './guide/drawGuide'
import { convertMwxFiles, mwxToXlsx, xlsxName } from './mwxConverter'
import { drawPlanPng } from './planPng'
import { buildProjectZip, summaryEntryName, zipEntryName, zipFolderName } from './projectZip'

const readBlob = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as ArrayBuffer)
    fr.onerror = () => reject(fr.error)
    fr.readAsArrayBuffer(blob)
  })

const es = makeExportEnv('es', true)
const en = makeExportEnv('en', false)

function result(over: Partial<typeof SAMPLE_INPUT> = {}): AnalysisResult {
  const o = runAnalysis({ ...SAMPLE_INPUT, ...over })
  if (!o.ok) throw new Error(o.error)
  return o.result
}
const point = (id: number, pointName = ''): CapaPoint => ({ id, result: result({ pointName }), ccType: 'auto', at: 0 })

// jsdom no trae canvas: cada <canvas> usa un contexto de registro y toDataURL devuelve un PNG falso.
interface Made { canvas: HTMLCanvasElement; rec: RecordingCtx; readonly width: number; readonly height: number }
let made: Made[] = []
beforeEach(() => {
  made = []
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    const rec = recordingCtx()
    made.push({ canvas: this, rec, get width() { return this.canvas.width }, get height() { return this.canvas.height } })
    return rec.ctx as never
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,QUJD')
})
afterEach(() => vi.restoreAllMocks())
const texts = (m: Made): unknown[] => m.rec.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])

describe('Resumen Ejecutivo PNG', () => {
  it('mide 1600 px de ancho, calcula el alto y escribe los textos del idioma activo', () => {
    expect(drawExecutivePng(point(0).result, 'auto', es)).toBe('data:image/png;base64,QUJD')
    const main = made.find((m) => m.width === 1600)!
    expect(main.height).toBeGreaterThan(3000)
    expect(texts(main)).toContain('RESUMEN EJECUTIVO')
    made = []
    drawExecutivePng(point(0).result, 'xs', en)
    expect(texts(made.find((m) => m.width === 1600)!)).toContain('EXECUTIVE SUMMARY')
  })
})

describe('Resumen comparativo', () => {
  it('reparte en páginas equilibradas de máximo 24 análisis', () => {
    expect(splitPages(Array.from({ length: 24 }, (_, i) => i)).map((p) => p.length)).toEqual([24])
    expect(splitPages(Array.from({ length: 25 }, (_, i) => i)).map((p) => p.length)).toEqual([13, 12])
    expect(splitPages(Array.from({ length: 49 }, (_, i) => i)).map((p) => p.length)).toEqual([17, 16, 16])
  })

  it('genera páginas de 2400x1440 con el nombre del proyecto y la paginación', async () => {
    const data: ProjectExportData = { points: Array.from({ length: 25 }, (_, i) => point(i, `P${i + 1}`)), markers: {}, photo: null, projectName: ' Línea 4 ' }
    const urls = await buildSummaryPages(data, es)
    expect(urls).toHaveLength(2)
    const pages = made.filter((m) => m.width === 2400)
    expect(pages).toHaveLength(2)
    expect(pages[0]!.height).toBe(1440)
    expect(texts(pages[0]!)).toEqual(expect.arrayContaining(['Proyecto: Línea 4', 'Página 1 de 2', 'Sin fotografía cargada']))
    expect(texts(pages[1]!)).toContain('Página 2 de 2')
    expect(await buildSummaryPages({ ...data, points: [] }, es)).toEqual([])
  })

  it('conserva el quirk del nombre: en inglés un punto sin nombre lleva "…"', async () => {
    await buildSummaryPages({ points: [point(0)], markers: {}, photo: null, projectName: '' }, en)
    expect(texts(made.find((m) => m.width === 2400)!)).toContain('Point 1…')
  })
})

describe('Descargar Proyecto (ZIP)', () => {
  it('nombres de carpeta y de archivos como el original', () => {
    expect(zipFolderName('')).toBe('CapaFlow_Proyecto')
    expect(zipFolderName('  Línea 4/A  ')).toBe('L_nea 4_A')
    expect(zipEntryName(0, 'Eje A/1', true)).toBe('01_Eje A_1.png')
    expect(zipEntryName(1, '', true)).toBe('02_Analisis_2.png')
    expect(zipEntryName(1, '', false)).toBe('02_Analysis_2.png')
    expect(summaryEntryName(0, 1)).toBe('00_Resumen_Comparativo.png')
    expect(summaryEntryName(1, 2)).toBe('00_Resumen_Comparativo_Pag2.png')
  })

  it('el ZIP trae un PNG por análisis más el resumen, dentro de la carpeta', async () => {
    const data: ProjectExportData = { points: [point(0, 'Eje A/1'), point(1, '')], markers: {}, photo: null, projectName: 'Mi Proyecto' }
    const { blob, folderName } = await buildProjectZip(data, es)
    expect(folderName).toBe('Mi Proyecto')
    const zip = await JSZip.loadAsync(await readBlob(blob))
    const names = Object.keys(zip.files).filter((n) => !zip.files[n]!.dir).sort()
    expect(names).toEqual(['Mi Proyecto/00_Resumen_Comparativo.png', 'Mi Proyecto/01_Eje A_1.png', 'Mi Proyecto/02_Analisis_2.png'])
    expect(await zip.file(names[1]!)!.async('string')).toBe('ABC')
  })
})

describe('Guía de Lectura', () => {
  it('es un PNG de 1600 px recortado a la altura real (máximo 6000)', () => {
    const out = drawGuide(es)
    expect(out.height).toBeGreaterThan(2000)
    expect(out.height).toBeLessThanOrEqual(6000)
    const final = made[made.length - 1]!
    expect(final.width).toBe(1600)
    expect(final.height).toBe(out.height)
    expect(texts(made[0]!)).toContain('GUÍA RÁPIDA DE LECTURA')
    made = []
    drawGuide(en)
    expect(texts(made[0]!)).toContain('QUICK READING GUIDE')
  })
})

describe('Exportar Plano PNG', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined }))
    vi.stubGlobal('Image', class {
      naturalWidth = 800
      naturalHeight = 600
      onload: (() => void) | null = null
      set src(_v: string) { queueMicrotask(() => this.onload?.()) }
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sin foto sale en silencio', async () => {
    expect(await drawPlanPng({ points: [point(0)], markers: {}, photo: null, projectName: '' })).toBeNull()
  })

  it('usa el tamaño natural de la imagen y dibuja solo los marcadores colocados', async () => {
    const data: ProjectExportData = { points: [point(0, 'A'), point(1, 'B')], markers: { 1: { x: 50, y: 40 } }, photo: new Blob(['x']), projectName: '' }
    expect(await drawPlanPng(data)).toBe('data:image/png;base64,QUJD')
    const m = made[0]!
    expect(m.width).toBe(800)
    expect(m.height).toBe(600)
    expect(m.rec.count('arc')).toBe(2)
    expect(texts(m)).toEqual(['2', 'B'])
  })
})

describe('Conversor MWX/MWP/MPX', () => {
  async function mwx(sheet: unknown, path = 'sheets/s1/sheet.json'): Promise<ArrayBuffer> {
    const zip = new JSZip()
    zip.file(path, JSON.stringify(sheet))
    return zip.generateAsync({ type: 'arraybuffer' })
  }
  const col = (Name: string, NumericData: number[], TextData: string[] = []) => ({ WorksheetVarBody: { Name, VarData: { VarDataBody: { NumericData, TextData } } } })

  it('lee la primera hoja: cabeceras, números antes que texto, columnas cortas rellenas y título a 31 caracteres', async () => {
    const log = vi.fn()
    const buf = await mwx({ Data: { PrivateTitle: 'T'.repeat(40), Columns: [col('Largo', [1.5, 2.5, 3.5]), col('Corto', [], ['a', 'b'])], Charts: [{}] } })
    const wb = XLSX.read(await mwxToXlsx(buf, log), { type: 'array' })
    expect(wb.SheetNames).toEqual(['T'.repeat(31)])
    expect(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]!]!, { header: 1, blankrows: true })).toEqual([['Largo', 'Corto'], [1.5, 'a'], [2.5, 'b'], [3.5, '']])
    expect(log.mock.calls.map((c) => c[0])).toEqual(['  └─ Encontradas 2 columna(s) de datos', '  └─ Total de 3 filas de datos', '  ⚠ Archivo contiene gráficas/análisis no convertibles'])
    expect(xlsxName('Datos.MPX')).toBe('Datos.xlsx')
  })

  it('errores del original: sin sheet.json y sin columnas', async () => {
    await expect(mwxToXlsx(await mwx({}, 'otra/cosa.json'), vi.fn())).rejects.toThrow('No se encontró sheet.json en el archivo (verifica que sea un MWX/MWP/MPX válido)')
    await expect(mwxToXlsx(await mwx({ Data: { Columns: [] } }), vi.fn())).rejects.toThrow('No se encontraron columnas de datos')
  })

  it('convertMwxFiles registra el error de cada archivo y el resumen N/M', async () => {
    const bad = { name: 'roto.mwx', arrayBuffer: async () => new ArrayBuffer(4) } as unknown as File
    const log = vi.fn()
    expect(await convertMwxFiles([bad], log)).toBe(0)
    const lines = log.mock.calls.map((c) => c[0] as string)
    expect(lines[0]).toBe('📂 Iniciando conversión de 1 archivo(s)...')
    expect(lines[1]).toBe('🔄 Procesando: roto.mwx')
    expect(lines[2]).toMatch(/^❌ Error en roto\.mwx: /)
    expect(lines[3]).toBe('✅ Conversión completada: 0/1 exitosos')
  })
})
