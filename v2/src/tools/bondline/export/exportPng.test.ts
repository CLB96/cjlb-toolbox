import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { useToasts } from '../../../ui/toastStore'
import { translate } from '../i18n'
import { createBondlineStore } from '../store'
import { FACTORY_DEFAULTS } from '../logic/types'
import { drawExport } from './drawExport'
import { renderExportChart } from './exportChart'
import { exportBondlinePng } from './exportPng'

// jsdom no dibuja canvas: se simulan la gráfica y el dibujo
vi.mock('./exportChart', () => ({ renderExportChart: vi.fn() }))
vi.mock('./drawExport', () => ({ drawExport: vi.fn() }))

const destroy = vi.fn()
const revoke = vi.fn()
const messages = () => useToasts.getState().toasts.map((t) => t.message)

beforeEach(() => {
  useToasts.setState({ toasts: [] })
  destroy.mockClear()
  revoke.mockClear()
  vi.mocked(renderExportChart).mockReturnValue({ canvas: document.createElement('canvas'), destroy } as never)
  URL.createObjectURL = vi.fn(() => 'blob:layout')
  URL.revokeObjectURL = revoke
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      set src(_v: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

const loadedState = () => {
  const api = createBondlineStore()
  api.getState().loadWorkbook('a.xlsx', Object.entries(FIXTURES).map(([name, raw]) => ({ name, raw })))
  api.getState().setLayoutImage(new Blob(['x'], { type: 'image/png' }), 'l.png')
  return api.getState()
}

test('sin datos avisa "Por favor carga datos primero" / "Please load data first"', async () => {
  const empty = createBondlineStore().getState()
  await exportBondlinePng(empty, FACTORY_DEFAULTS, 'es')
  await exportBondlinePng(empty, FACTORY_DEFAULTS, 'en')
  expect(messages()).toEqual(['Por favor carga datos primero', 'Please load data first'])
})

test('éxito: dibuja, descarga y destruye la gráfica temporal', async () => {
  vi.mocked(drawExport).mockReturnValue({ toDataURL: () => 'data:image/png;base64,AA' } as never)
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  await exportBondlinePng(loadedState(), FACTORY_DEFAULTS, 'es')
  expect(click).toHaveBeenCalledTimes(1)
  expect(destroy).toHaveBeenCalledTimes(1)
  expect(messages()).toEqual([])
  click.mockRestore()
})

test('si el dibujo falla: toast de error, gráfica destruida y URL del layout revocada', async () => {
  vi.mocked(drawExport).mockImplementation(() => {
    throw new Error('boom')
  })
  await exportBondlinePng(loadedState(), FACTORY_DEFAULTS, 'es')
  expect(messages()).toEqual([translate('es', 'exportFailed')])
  expect(messages()[0]).toBe('Error al generar la imagen. Por favor intenta de nuevo.')
  expect(destroy).toHaveBeenCalledTimes(1)
  expect(revoke).toHaveBeenCalledWith('blob:layout')
})
