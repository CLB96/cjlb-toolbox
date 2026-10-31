import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import { __resetI18nForTests, useI18n } from '../../i18n/useI18n'
import { saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import CapaflowTool from './CapaflowTool'
import { runAnalysis, SAMPLE_INPUT } from './logic'
import { initialData, type CapaState } from './store'
import { recordingCtx } from './testCanvas'

function LangGrab() {
  useI18n()
  return null
}

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
  const rec = recordingCtx()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => rec.ctx) as never)
  URL.createObjectURL = vi.fn(() => 'blob:test/1')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => vi.restoreAllMocks())

const renderTool = () =>
  render(
    <UidProvider uid="u1">
      <LangGrab />
      <CapaflowTool toolId="capaflow" active />
    </UidProvider>,
  )

const ready = async () => {
  await waitFor(() => expect(screen.getByTestId('capaflow').querySelector('textarea')).toBeEnabled())
}
const toasts = () => useToasts.getState().toasts.map((t) => t.message)
const calculate = () => fireEvent.click(screen.getByRole('button', { name: /^▶ (Calcular Capacidad|Calculate Capability)$/ }))
const loadSample = () => fireEvent.click(screen.getByRole('button', { name: /^↓ (Cargar datos de ejemplo|Load sample data)$/ }))

async function withSample(name = '') {
  renderTool()
  await ready()
  loadSample()
  if (name) fireEvent.change(screen.getByLabelText('Nombre del punto / característica'), { target: { value: name } })
  calculate()
}

describe('CapaflowTool', () => {
  it('sin análisis muestra la pista de estado vacío y el formulario con los textos del original', async () => {
    renderTool()
    await ready()
    expect(screen.getByTestId('cf-empty')).toHaveTextContent('Ingresa tus especificaciones y datos del proceso,')
    expect(screen.getByText('Análisis de Capacidad Six Sigma')).toBeInTheDocument()
    expect(screen.getByLabelText('LSL — Límite Inferior')).toBeInTheDocument()
    expect(screen.getByLabelText('Confianza (%)')).toHaveValue('95')
    expect(screen.queryByRole('button', { name: '✕ Limpiar Proyecto' })).toBeNull()
  })

  it('calcular con los datos de ejemplo muestra Cpk 1.629, Cp 1.668 y Ppk 1.596', async () => {
    await withSample()
    expect(within(screen.getByTestId('cf-kpi-cpk')).getByText('1.629')).toBeInTheDocument()
    expect(within(screen.getByTestId('cf-kpi-cp')).getByText('1.668')).toBeInTheDocument()
    expect(within(screen.getByTestId('cf-kpi-ppk')).getByText('1.596')).toBeInTheDocument()
    expect(within(screen.getByTestId('cf-kpi-cpk')).getByText('Capaz')).toBeInTheDocument()
    expect(within(screen.getByTestId('cf-kpi-cp')).getByText('Potencial')).toBeInTheDocument()
    expect(screen.getByTestId('cf-interpretation')).toHaveTextContent('Proceso Capaz. Cpk de 1.629 cumple el estándar Six Sigma (≥1.33)')
    expect(screen.getByTestId('cf-gauge-value')).toHaveTextContent('1.629')
    expect(screen.getByTestId('cf-normality')).toHaveTextContent(/^Anderson-Darling: p=0\.\d{4} · (Distribución Normal ✓|Posible No-Normalidad)$/)
  })

  it('las tablas de estadísticos e índices salen de la lógica de la fase 1', async () => {
    await withSample()
    const o = runAnalysis(SAMPLE_INPUT)
    if (!o.ok) throw new Error('sample')
    const stats = screen.getByRole('region', { name: 'Estadísticas del Proceso' })
    expect(within(stats).getByText('n (datos)').nextSibling).toHaveTextContent(String(o.result.N))
    expect(within(stats).getByText('Media (x̄)').nextSibling).toHaveTextContent(o.result.xBar.toFixed(4))
    expect(within(stats).getByText('Target').nextSibling).toHaveTextContent('74.000')
    const idx = screen.getByRole('region', { name: 'Todos los Índices' })
    expect(within(idx).getByText('Cpm (Taguchi)').nextSibling).toHaveTextContent(o.result.Cpm!.toFixed(3))
    expect(within(idx).getByText('Capacidad (Within σ)')).toBeInTheDocument()
    expect(screen.getByTestId('cf-ppm-cpk')).toHaveTextContent(Math.round(o.result.ppm!).toLocaleString())
  })

  it('valida con los mensajes del original', async () => {
    renderTool()
    await ready()
    calculate()
    expect(toasts()).toContain('Necesitas al menos 5 datos.')
    fireEvent.change(screen.getByPlaceholderText(/Ej: 9.8, 10.1/), { target: { value: '1 2 3 4 5 6' } })
    calculate()
    expect(toasts()).toContain('Ingresa al menos un límite de especificación.')
    expect(screen.getByTestId('cf-empty')).toBeInTheDocument()
  })

  it('cada cálculo agrega un punto a la barra del proyecto y se puede cambiar entre ellos', async () => {
    await withSample('Eje A')
    calculate()
    const bar = screen.getByRole('group', { name: '⬡ Proyecto CapaFlow' })
    expect(within(bar).getAllByRole('button').map((b) => b.textContent)).toEqual(['Eje A', 'Eje A', '+ Nuevo punto'])
    fireEvent.change(screen.getByLabelText('Nombre del punto / característica'), { target: { value: '' } })
    calculate()
    expect(within(bar).getByRole('button', { name: 'Punto de Medición 3' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(bar).getAllByRole('button', { name: 'Eje A' })[0]!)
    expect(screen.getByText('⬡ Eje A')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('eliminar el análisis activo pasa al siguiente y al vaciar vuelve la pista', async () => {
    await withSample('A')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar análisis' }))
    expect(screen.getByTestId('cf-empty')).toBeInTheDocument()
  })

  it('"Limpiar Proyecto" vacía los análisis y conserva el formulario', async () => {
    await withSample('A')
    fireEvent.click(screen.getByRole('button', { name: '✕ Limpiar Proyecto' }))
    expect(screen.getByTestId('cf-empty')).toBeInTheDocument()
    expect(screen.getByLabelText('LSL — Límite Inferior')).toHaveValue('73.95')
  })

  it('el selector de gráficas de control cambia entre auto, I-MR, X̄-R y X̄-S con sus notas', async () => {
    await withSample()
    expect(screen.getByTestId('cf-cc-top')).toHaveTextContent('X̄ — Medias (n=5)')
    expect(screen.getByTestId('cf-cc-note')).toHaveTextContent('Subgrupos de tamaño n=5. Constantes: A₂=0.577, D₃=0.000, D₄=2.114')
    fireEvent.click(screen.getByRole('button', { name: 'X̄-S' }))
    expect(screen.getByTestId('cf-cc-bot')).toHaveTextContent('S — Desv. Est. (n=5)')
    expect(screen.getByTestId('cf-cc-note')).toHaveTextContent('A₃=1.427, B₃=0.000, B₄=2.089')
    fireEvent.click(screen.getByRole('button', { name: 'I-MR' }))
    expect(screen.getByTestId('cf-cc-top')).toHaveTextContent('I — Individuales')
    expect(screen.getByTestId('cf-cc-note')).toHaveTextContent('Datos individuales (subgrupo=1)')
    expect(screen.getByRole('button', { name: 'I-MR / X̄-R / X̄-S' })).toBeInTheDocument()
  })

  it('las secciones plegables empiezan cerradas y se abren con su nota', async () => {
    await withSample()
    expect(screen.queryByTestId('cf-run-note')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Gráfica de Corrida \(Run Chart\)/ }))
    expect(screen.getByTestId('cf-run-note')).toHaveTextContent('Total de rachas:')
    fireEvent.click(screen.getByRole('button', { name: /Diagrama de Caja \(Box Plot\)/ }))
    expect(screen.getByText(/^Q1=.*Outliers=\d+$/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Probabilidad Normal \(Q-Q Plot\)/ }))
    expect(screen.getByText(/Si los puntos siguen la línea diagonal.*Anderson-Darling: p=0\.\d{4}$/)).toBeInTheDocument()
  })

  it('en inglés usa los textos EN del original', async () => {
    localStorage.setItem('cjlb.lang', 'en')
    await withSample()
    expect(screen.getByRole('button', { name: '▶ Calculate Capability' })).toBeInTheDocument()
    expect(within(screen.getByTestId('cf-kpi-cpk')).getByText('Capable')).toBeInTheDocument()
    expect(screen.getByTestId('cf-interpretation')).toHaveTextContent('Capable Process. Cpk of 1.629 meets the Six Sigma standard')
    expect(screen.getByRole('region', { name: 'Process Statistics' })).toBeInTheDocument()
    expect(screen.getByText('Measurement Point 1')).toBeInTheDocument()
  })

  it('fase 2b: el conversor abre su modal y el PNG ejecutivo se descarga con su nombre y avisos', async () => {
    const downloads: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,QUJD')
    await withSample()
    fireEvent.click(screen.getByRole('button', { name: '🔄 Conversor MWX/MWP/MPX → Excel' }))
    expect(screen.getByText('Arrastra archivos .MWX, .MWP o .MPX aquí')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Convertir a Excel' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })

    fireEvent.click(screen.getByRole('button', { name: '⬇ Resumen Ejecutivo PNG' }))
    expect(toasts()).toContain('Generando PNG...')
    await waitFor(() => expect(toasts()).toContain('¡PNG descargado!'))
    expect(downloads[0]).toMatch(/^CapaFlow_Resumen_\d{4}-\d{2}-\d{2}\.png$/)
  })

  it('plano: cargar foto, colocar un marcador desde la bandeja y quitarlo', async () => {
    await withSample('Eje A')
    fireEvent.click(screen.getByRole('button', { name: /Plano con marcadores/ }))
    const file = new File(['x'], 'pieza.png', { type: 'image/png' })
    fireEvent.change(screen.getByTestId('cf-photo-input'), { target: { files: [file] } })
    expect(await screen.findByText('pieza.png')).toBeInTheDocument()
    expect(screen.getByText('Arrastra al plano:')).toBeInTheDocument()
    fireEvent.click(within(screen.getByTestId('cf-tray')).getByTitle('Eje A'))
    expect(screen.getByTestId('cf-marker-0')).toBeInTheDocument()
    expect(screen.getByText('Colocados — click para quitar:')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Quitar'))
    expect(screen.queryByTestId('cf-marker-0')).toBeNull()
  })

  it('plano: rechaza archivos que no son imagen', async () => {
    await withSample()
    fireEvent.click(screen.getByRole('button', { name: /Plano con marcadores/ }))
    fireEvent.change(screen.getByTestId('cf-photo-input'), { target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } })
    expect(toasts()).toContain('Selecciona un archivo de imagen.')
  })

  it('restaura el proyecto guardado: puntos, resultados, foto y marcadores', async () => {
    const o = runAnalysis({ ...SAMPLE_INPUT, pointName: 'Guardado' })
    if (!o.ok) throw new Error('sample')
    const saved: CapaState = {
      ...initialData(),
      points: [{ id: 0, result: o.result, ccType: 'xs', at: Date.now() }],
      activeId: 0,
      counter: 1,
      photo: new Blob(['img'], { type: 'image/png' }),
      photoName: 'plano.png',
      markers: { 0: { x: 20, y: 30 } },
      panels: { run: false, qq: false, box: false, photo: true },
    }
    await saveSnapshot('u1', 'capaflow', saved)
    renderTool()
    expect(await screen.findByText('⬡ Guardado')).toBeInTheDocument()
    expect(within(screen.getByTestId('cf-kpi-cpk')).getByText('1.629')).toBeInTheDocument()
    expect(screen.getByTestId('cf-cc-bot')).toHaveTextContent('S — Desv. Est. (n=5)')
    expect(screen.getByTestId('cf-marker-0')).toBeInTheDocument()
    expect(screen.getByText('plano.png')).toBeInTheDocument()
  })

})
