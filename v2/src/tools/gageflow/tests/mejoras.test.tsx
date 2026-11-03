import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import GageflowTool from '../GageflowTool'
import { construirLibro } from '../export/exportExcel'
import { ajustarLamina } from '../export/exportPdf'
import { construirModeloPng } from '../export/pngModel'
import { calcularEstudio } from '../logic/estudio'
import { aMatriz, parseGrid, type Cell } from '../logic/parse'
import { textoSesgo } from '../logic/unidades'
import { crearGageflowStore } from '../store'

vi.mock('../useGageflowPersistence', () => ({
  useGageflowPersistence: () => ({
    restored: true, lastSavedAt: null, restoreVersion: vi.fn(), markDirty: vi.fn(),
  }),
}))
vi.mock('../components/charts', () => ({
  ComponentesChart: () => null,
  InteraccionChart: () => null,
}))

const grid = (): Cell[][] => csv.trim().split(/\r?\n/).map((l) => l.split(',')
  .map((c, i) => (i < 2 || Number.isNaN(Number(c)) ? c : Number(c))))

let archivoDePrueba: Cell[][] = []
vi.mock('../components/Dropzone', () => ({
  Dropzone: ({ onArchivo }: { onArchivo: (g: Cell[][], n: string, h: string) => void }) => (
    <button onClick={() => onArchivo(archivoDePrueba, 'datos.xlsx', 'Datos')}>subir</button>
  ),
}))

async function llenar(u: ReturnType<typeof userEvent.setup>) {
  await u.type(screen.getByLabelText('Pieza / conjunto'), 'A-12')
  await u.type(screen.getByLabelText('Característica'), 'Espesor')
}

describe('pantalla de GageFlow', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
    archivoDePrueba = grid()
  })

  it('no ofrece un selector de método que no cambia el cálculo', () => {
    render(<GageflowTool toolId="gageflow" active />)
    expect(screen.queryByLabelText('Método')).toBeNull()
  })

  it('muestra en resultados que el archivo no coincide con el formulario', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await llenar(u)
    await u.clear(screen.getByLabelText('Piezas'))
    await u.type(screen.getByLabelText('Piezas'), '12')
    await u.click(screen.getByText('subir'))
    expect(screen.getByText('Descargar PNG')).toBeTruthy()
    expect(screen.getByText('El archivo tiene 10 piezas y el formulario 12.')).toBeTruthy()
  })

  it('sin avisos no añade ese panel a los resultados', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await llenar(u)
    await u.click(screen.getByText('subir'))
    expect(document.querySelector('.gf-issue')).toBeNull()
  })

  it('respeta la unidad del formulario', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await llenar(u)
    await u.clear(screen.getByLabelText('Unidad'))
    await u.type(screen.getByLabelText('Unidad'), 'in')
    await u.click(screen.getByText('subir'))
    expect(screen.getByText('0.0383 in (6σ)')).toBeTruthy()
    expect(screen.queryByText(/\bmm\b/)).toBeNull()
  })

  it('con el formulario incompleto dice qué falta, no que hay resultados', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await u.click(screen.getByText('subir'))
    expect(screen.getByText('Completa los datos del estudio')).toBeTruthy()
    expect(screen.queryByText('Resultados del estudio')).toBeNull()
  })

  it('cuenta las filas reales de un archivo con errores', async () => {
    const u = userEvent.setup()
    archivoDePrueba[3][3] = 'abc'
    render(<GageflowTool toolId="gageflow" active />)
    await u.click(screen.getByText('subir'))
    expect(screen.getByText('«Datos» · 90 filas')).toBeTruthy()
  })
})

describe('lector', () => {
  it('un valor no numérico no añade además una lectura faltante', () => {
    const g = grid()
    g[3][3] = 'abc'
    expect(parseGrid(g).issues.map((i) => i.codigo)).toEqual(['VALOR_NO_NUMERICO'])
  })

  it('informa filas y resumen aunque haya errores', () => {
    const g = grid()
    g[3][3] = 'abc'
    const r = parseGrid(g)
    expect(r.filas).toBe(90)
    expect(r.resumen).toMatchObject({ piezas: 10, ensayos: 3, lecturas: 89 })
  })

  it('el store conserva esas cifras con el archivo', () => {
    const g = grid()
    g[3][3] = 'abc'
    const api = crearGageflowStore()
    api.getState().cargarArchivo(g, 'a.xlsx', 'Datos')
    expect(api.getState().archivo).toMatchObject({ filas: 90, layout: 'long', resumen: { lecturas: 89 } })
  })
})

describe('exportaciones', () => {
  const parsed = parseGrid(grid())
  const resultado = calcularEstudio(aMatriz(parsed.lecturas, parsed.diseno), { lsl: 2.4, usl: 2.6 })

  it('el Excel no pierde lecturas de un operador escrito con otra caja', async () => {
    const g = grid()
    g[1][1] = 'OPERADOR 1'
    g[1][0] = '1'
    const r = parseGrid(g)
    const wb = await construirLibro(resultado, r.diseno, r.lecturas, {
      pieza: 'A', caracteristica: 'B', especificacion: 'C', lang: 'es',
    })
    const valores: unknown[] = []
    wb.getWorksheet('Datos')?.eachRow((f, n) => { if (n > 1) valores.push(f.getCell(4).value) })
    expect(valores).toHaveLength(90)
    expect(valores.every((v) => typeof v === 'number')).toBe(true)
  })

  it('el modelo del PNG usa la unidad del estudio', () => {
    const m = construirModeloPng(resultado, parsed.diseno, aMatriz(parsed.lecturas, parsed.diseno) as number[][][], {
      pieza: 'A', caracteristica: 'B', especificacion: 'C', lang: 'es', unidad: 'in', nominal: 2.5,
    })
    expect(JSON.stringify(m)).not.toMatch(/\d mm/)
    expect(m.operadores[0].sesgo).toBe('+0.0019 in')
  })

  it('la lámina del PDF no se deforma cuando es muy alta', () => {
    const a = ajustarLamina(1600, 3200)
    expect(a.alto).toBe(277)
    expect(a.ancho / a.alto).toBeCloseTo(0.5, 5)
    expect(a.x).toBeCloseTo((210 - a.ancho) / 2, 5)
  })

  it('la lámina del PDF usa el ancho útil cuando cabe', () => {
    expect(ajustarLamina(1600, 800)).toEqual({ x: 10, ancho: 190, alto: 95 })
  })
})

describe('sesgo', () => {
  it.each([
    [0.0019, 'mm', '+1.9 µm'], [-0.0042, 'mm', '-4.2 µm'], [0.0019, 'MM', '+1.9 µm'],
    [0.0019, 'in', '+0.0019 in'], [-0.5, 'µm', '-0.5000 µm'],
  ])('%s en %s se escribe %s', (diferencia, unidad, esperado) => {
    expect(textoSesgo(diferencia, unidad)).toBe(esperado)
  })
})
