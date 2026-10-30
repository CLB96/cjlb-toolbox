import { FIXTURES } from '../../../../legacy-fixtures/gapcheck/fixtures'
import { useToasts } from '../../../ui/toastStore'
import { GAPCHECK_TEXTS } from '../i18n'
import { createGapcheckStore } from '../store'
import { drawExport } from './drawExport'
import { renderExportChart } from './exportChart'
import { exportGapcheckPng } from './exportPng'

// jsdom no dibuja canvas: aquí solo se prueban las salidas tempranas (sin datos)
vi.mock('./exportChart', () => ({ renderExportChart: vi.fn() }))
vi.mock('./drawExport', () => ({ drawExport: vi.fn() }))

beforeEach(() => useToasts.setState({ toasts: [] }))

const messages = () => useToasts.getState().toasts.map((t) => t.message)

test('sin datos avisa "No hay datos para exportar." (ES)', async () => {
  await exportGapcheckPng(createGapcheckStore().getState(), 'es', document.createElement('canvas'))
  expect(messages()).toEqual(['No hay datos para exportar.'])
})

test('sin gráfica montada avisa "No data to export." (EN), como el guard `if (!chart)`', async () => {
  const api = createGapcheckStore()
  api.getState().loadRows('a.xlsx', FIXTURES.header)
  await exportGapcheckPng(api.getState(), 'en', null)
  expect(messages()).toEqual(['No data to export.'])
})

describe('flujo completo (canvas y dibujo simulados)', () => {
  const destroy = vi.fn()
  const toDataURL = vi.fn(() => 'data:image/png;base64,AA')
  const loaded: string[] = []
  let failBlobImage = false
  const revoke = vi.fn()
  let click: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    destroy.mockClear()
    revoke.mockClear()
    loaded.length = 0
    failBlobImage = false
    vi.mocked(renderExportChart).mockReturnValue({
      canvas: document.createElement('canvas'),
      destroy,
    } as never)
    vi.mocked(drawExport).mockReset()
    vi.mocked(drawExport).mockReturnValue({ toDataURL } as never)
    URL.createObjectURL = vi.fn(() => 'blob:layout')
    URL.revokeObjectURL = revoke
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    // jsdom no carga imágenes: onload/onerror inmediatos según la URL
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(v: string) {
          loaded.push(v)
          queueMicrotask(() => (v.startsWith('blob:') && failBlobImage ? this.onerror : this.onload)?.())
        }
      },
    )
  })
  afterEach(() => {
    click.mockRestore()
    vi.unstubAllGlobals()
  })

  const stateWithLayout = () => {
    const api = createGapcheckStore()
    api.getState().loadRows('a.xlsx', FIXTURES.header)
    api.getState().setLayoutImage(new Blob(['x'], { type: 'image/png' }), 'd.png')
    return api.getState()
  }

  test('éxito: dibuja, descarga y destruye la gráfica fuera de pantalla', async () => {
    await exportGapcheckPng(stateWithLayout(), 'es', document.createElement('canvas'))
    expect(drawExport).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(messages()).toEqual([])
  })

  test('si drawExport falla: toast exportFailed, gráfica destruida y URL del layout revocada', async () => {
    vi.mocked(drawExport).mockImplementation(() => {
      throw new Error('boom')
    })
    await exportGapcheckPng(stateWithLayout(), 'es', document.createElement('canvas'))
    expect(messages()).toEqual([GAPCHECK_TEXTS.es.exportFailed])
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:layout')
    expect(click).not.toHaveBeenCalled()
  })

  test('si la imagen del layout no carga, el export sigue sin la caja del layout', async () => {
    failBlobImage = true
    await exportGapcheckPng(stateWithLayout(), 'es', document.createElement('canvas'))
    expect(vi.mocked(drawExport).mock.calls[0][2]).toBeNull()
    expect(click).toHaveBeenCalledTimes(1)
    expect(messages()).toEqual([])
    expect(revoke).toHaveBeenCalledWith('blob:layout')
  })

  test('precarga también Inter 900 (peso del texto de los marcadores)', async () => {
    const load = vi.fn((_font: string) => Promise.resolve([]))
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load, ready: Promise.resolve() } })
    try {
      await exportGapcheckPng(stateWithLayout(), 'es', document.createElement('canvas'))
      expect(load.mock.calls.map((c) => c[0])).toContain('900 16px Inter')
    } finally {
      Reflect.deleteProperty(document, 'fonts')
    }
  })
})
