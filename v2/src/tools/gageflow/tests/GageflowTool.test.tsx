import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import GageflowTool from '../GageflowTool'
import type { Cell } from '../logic/parse'

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

async function llenarIdentificacion(u: ReturnType<typeof userEvent.setup>) {
  await u.type(screen.getByLabelText('Pieza / conjunto'), 'A-12')
  await u.type(screen.getByLabelText('Característica'), 'Espesor')
}

describe('flujo de GageFlow', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
    archivoDePrueba = grid()
  })

  it('con el formulario incompleto deja completarlo y entonces calcula', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await u.click(screen.getByText('subir'))
    expect(screen.getByLabelText('Pieza / conjunto')).toBeTruthy()
    expect(screen.queryByText('Descargar PNG')).toBeNull()
    await llenarIdentificacion(u)
    expect(screen.getByText('Descargar PNG')).toBeTruthy()
  })

  it('con un archivo con errores muestra los errores y no el formulario', async () => {
    const u = userEvent.setup()
    archivoDePrueba[3][3] = 'abc'
    render(<GageflowTool toolId="gageflow" active />)
    await u.click(screen.getByText('subir'))
    expect(screen.getByText(/no es un número/)).toBeTruthy()
    expect(screen.queryByLabelText('Pieza / conjunto')).toBeNull()
  })

  it('sin nominal no inventa un sesgo', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await llenarIdentificacion(u)
    await u.click(screen.getByText('subir'))
    expect(screen.queryByText(/µm/)).toBeNull()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('con nominal calcula el sesgo contra él', async () => {
    const u = userEvent.setup()
    render(<GageflowTool toolId="gageflow" active />)
    await llenarIdentificacion(u)
    await u.type(screen.getByLabelText('Nominal'), '2.50')
    await u.click(screen.getByText('subir'))
    expect(screen.getByText('+1.9 µm')).toBeTruthy()
  })

  it('un archivo sin variación lo explica y deja empezar de nuevo', async () => {
    const u = userEvent.setup()
    archivoDePrueba = grid().map((f, i) => (i === 0 ? f : [f[0], f[1], f[2], 2.5]))
    render(<GageflowTool toolId="gageflow" active />)
    await llenarIdentificacion(u)
    await u.click(screen.getByText('subir'))
    expect(screen.getByText('Todas las lecturas son iguales: no hay variación que analizar.')).toBeTruthy()
    await u.click(screen.getByRole('button', { name: 'Nuevo estudio' }))
    expect(screen.getByLabelText('Pieza / conjunto')).toBeTruthy()
  })
})
