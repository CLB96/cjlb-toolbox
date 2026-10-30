import { FIXTURES } from '../../../../legacy-fixtures/gapcheck/fixtures'
import { useToasts } from '../../../ui/toastStore'
import { createGapcheckStore } from '../store'
import { exportGapcheckPng } from './exportPng'

// jsdom no dibuja canvas: aquí solo se prueban las salidas tempranas (sin datos)
vi.mock('./exportChart', () => ({ renderExportChart: vi.fn() }))

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
