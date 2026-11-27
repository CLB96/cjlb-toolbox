import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import { Blob as NodeBlob } from 'node:buffer'
import { createElement, forwardRef, type ReactNode } from 'react'
import { __resetI18nForTests, useI18n } from '../../i18n/useI18n'
import { saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import VectorizrTool from './VectorizrTool'
import { initialData, snapshotOf, type VectorizrSnapshot } from './store'
import type { ContourPoint } from './types'

const detect = vi.fn()
const detectAll = vi.fn()
vi.mock('./worker/useOpencv', () => ({
  useOpencv: () => ({ status: 'ready', error: null, detect, detectAll }),
}))
vi.mock('./worker/opencvClient', () => ({ preloadOpencv: vi.fn(), disposeOpencvClient: vi.fn() }))
vi.mock('./logic/imageNormalize', () => ({
  normalizeImage: vi.fn(async () => ({ image: new Image(), blob: new Blob(['j']), width: 400, height: 300 })),
  loadImageFromBlob: vi.fn(async () => new Image()),
}))
vi.mock('./logic/exportPdf', () => ({ downloadPdf: vi.fn(async () => {}) }))
vi.mock('react-konva', () => {
  const Box = ({ children }: { children?: ReactNode }) => createElement('div', null, children)
  const Stage = forwardRef<HTMLDivElement, { children?: ReactNode }>(({ children }, ref) => createElement('div', { ref }, children))
  const Leaf = () => null
  return { Stage, Layer: Box, Group: Box, Image: Leaf, Path: Leaf, Circle: Leaf, Line: Leaf, Text: Leaf }
})

const { downloadPdf } = await import('./logic/exportPdf')
const { preloadOpencv, disposeOpencvClient } = await import('./worker/opencvClient')

let setLangRef: ((l: 'es' | 'en') => void) | null = null
function LangGrab() {
  setLangRef = useI18n().setLang
  return null
}

const fakeCtx = new Proxy({} as Record<string, unknown>, {
  get: (target, prop) => {
    if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })
    if (!(prop in target)) target[prop as string] = vi.fn()
    return target[prop as string]
  },
  set: () => true,
})

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
  detect.mockReset()
  detectAll.mockReset()
  detect.mockResolvedValue([
    { x: 10, y: 10 },
    { x: 100, y: 10 },
    { x: 100, y: 100 },
    { x: 10, y: 100 },
  ])
  vi.mocked(downloadPdf).mockClear()
  URL.createObjectURL = vi.fn(() => 'blob:x')
  URL.revokeObjectURL = vi.fn()
  // jsdom no carga imágenes ni tiene canvas: onload inmediato y contexto falso
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get() {
      return (this as HTMLImageElement).getAttribute('src') ?? ''
    },
    set(v: string) {
      ;(this as HTMLImageElement).setAttribute('src', v)
      setTimeout(() => (this as HTMLImageElement).onload?.(new Event('load')))
    },
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
})
afterEach(() => vi.restoreAllMocks())

/** Nombres de archivo de las descargas reales (jsdom no navega). */
let downloads: string[] = []
beforeEach(() => {
  downloads = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download)
  })
})

const renderTool = (active = true) =>
  render(
    <UidProvider uid="u1">
      <LangGrab />
      <VectorizrTool toolId="vectorizr" active={active} />
    </UidProvider>,
  )

const toasts = () => useToasts.getState().toasts.map((t) => t.message)
const fileInput = () => screen.getByLabelText('Cargar imagen') as HTMLInputElement
const ready = () => waitFor(() => expect(fileInput()).toBeEnabled())

const square: ContourPoint[] = [
  { id: '0', x: 10, y: 10, type: 'line' },
  { id: '1', x: 100, y: 10, type: 'line' },
  { id: '2', x: 100, y: 100, type: 'line' },
]

async function seedStep4(extra: Partial<VectorizrSnapshot> = {}) {
  const { contourPoints = square, paths = [], ...rest } = extra
  const base = snapshotOf(initialData())
  const piece = { ...base.pieces![0]!, contourPoints, paths }
  await saveSnapshot('u1', 'vectorizr', {
    ...base,
    step: 4,
    imageBlob: new NodeBlob(['j']) as unknown as Blob,
    imageWidth: 400,
    imageHeight: 300,
    scaleFactor: 0.5,
    pieces: [piece],
    activePieceId: piece.id,
    ...rest,
  })
}
const inEditor = () => waitFor(() => expect(screen.getByText('Herramienta: Seleccionar')).toBeInTheDocument())

async function toStep2() {
  renderTool()
  await ready()
  fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'pieza.png', { type: 'image/png' })] } })
  await screen.findByText('① Clic en el primer punto de la referencia')
}
function markPoints(a: [number, number], b: [number, number]) {
  const img = screen.getByAltText('referencia')
  fireEvent.click(img, { clientX: a[0], clientY: a[1] })
  fireEvent.click(img, { clientX: b[0], clientY: b[1] })
}

describe('VectorizrTool', () => {
  it('flujo completo 1 → 4 con detección automática', async () => {
    await toStep2()
    markPoints([0, 0], [200, 0])
    fireEvent.change(screen.getByPlaceholderText('Ej: 30'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar escala' }))
    fireEvent.click(await screen.findByRole('button', { name: /Detección automática/ }))
    const confirm = await screen.findByRole('button', { name: 'Confirmar (4 pts)' })
    expect(detect).toHaveBeenCalledWith(expect.anything(), { method: 0, threshold1: 50, threshold2: 150 })
    fireEvent.click(confirm)
    await inEditor()
    expect(screen.getByText('Puntos: 4')).toBeInTheDocument()
    // 10 cm sobre 200 px → 0.5 mm/px
    expect(screen.getByText('Escala: 1px = 0.5000 mm')).toBeInTheDocument()
    expect(screen.getByText('Trazos: 1 (4 pts)')).toBeInTheDocument()
  })

  it('el paso 1 queda deshabilitado hasta terminar la restauración', async () => {
    renderTool()
    expect(fileInput()).toBeDisabled()
    await ready()
  })

  it('stepper con las cuatro etiquetas visibles y el paso actual marcado', async () => {
    renderTool()
    await ready()
    const steps = within(screen.getByRole('list', { name: 'Pasos' })).getAllByRole('listitem')
    expect(steps.map((s) => s.textContent)).toEqual(['1Cargar', '2Escala', '3Vectorizar', '4Editar'])
    expect(steps[0]).toHaveAttribute('aria-current', 'step')
  })

  it('cambia a inglés con el selector del toolbox', async () => {
    renderTool()
    await ready()
    act(() => setLangRef!('en'))
    expect(screen.getByRole('heading', { name: 'Upload image' })).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG, WebP')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '📖 User manual' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Steps' })).getByText('Vectorize')).toBeInTheDocument()
  })

  it('rechaza un PDF (M11) y el input ya no lo acepta', async () => {
    renderTool()
    await ready()
    expect(fileInput().accept).toBe('image/jpeg,image/png,image/webp')
    fireEvent.change(fileInput(), { target: { files: [new File(['%PDF'], 'plano.pdf', { type: 'application/pdf' })] } })
    expect(toasts()).toEqual(['Formato no válido. Usa JPG, PNG o WebP.'])
    expect(screen.getByRole('heading', { name: 'Cargar imagen' })).toBeInTheDocument()
  })

  it('escala: avisa si los dos puntos coinciden (M15)', async () => {
    await toStep2()
    markPoints([50, 50], [50, 50])
    fireEvent.change(screen.getByPlaceholderText('Ej: 30'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar escala' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Los dos puntos coinciden. Marca dos puntos distintos.')
    expect(screen.getByText('③ Ingresa la medida real')).toBeInTheDocument()
  })

  it('escala: avisa si la medida no es un número positivo (M15)', async () => {
    await toStep2()
    markPoints([0, 0], [100, 0])
    fireEvent.change(screen.getByPlaceholderText('Ej: 30'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar escala' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa una medida mayor que cero.')
  })

  it('umbrales: el bajo no supera al alto y soltar el slider vuelve a detectar (M19)', async () => {
    await seedStep4({ step: 3 })
    renderTool()
    fireEvent.click(await screen.findByRole('button', { name: /Detección automática/ }))
    await screen.findByRole('button', { name: 'Confirmar (4 pts)' })
    fireEvent.click(screen.getByRole('button', { name: 'Semi automático' }))
    const [low] = screen.getAllByRole('slider')
    fireEvent.change(low!, { target: { value: '190' } })
    expect(screen.getByText('149')).toBeInTheDocument()
    detect.mockClear()
    fireEvent.keyUp(low!, { key: 'ArrowRight' })
    await waitFor(() => expect(detect).toHaveBeenCalledWith(expect.anything(), { method: 1, threshold1: 149, threshold2: 150 }))
  })

  it('un error de detección se muestra y el spinner termina (M12)', async () => {
    detect.mockRejectedValue(new Error('boom'))
    await seedStep4({ step: 3 })
    renderTool()
    fireEvent.click(await screen.findByRole('button', { name: /Detección automática/ }))
    expect(await screen.findByText('No se pudo detectar el contorno. Vuelve a intentarlo o usa el trazado manual.')).toBeInTheDocument()
    expect(screen.queryByText('Detectando bordes con OpenCV…')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a detectar' })).toBeEnabled()
  })

  it('las teclas eligen herramienta y la barra de estado muestra su nombre (M17)', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    fireEvent.keyDown(window, { key: 'm' })
    expect(screen.getByText('Herramienta: Medir distancia')).toBeInTheDocument()
    expect(screen.getByText('Haz click en el punto inicial')).toBeInTheDocument()
  })

  it('Ctrl+Z deshace pero no activa Zoom (M13)', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar punto (D)' }))
    fireEvent.keyDown(window, { key: 's' })
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(screen.getByText('Herramienta: Seleccionar')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'a', metaKey: true })
    expect(screen.getByText('Herramienta: Seleccionar')).toBeInTheDocument()
  })

  it('con la pestaña oculta (keep-alive) ignora las teclas', async () => {
    await seedStep4()
    renderTool(false)
    await inEditor()
    fireEvent.keyDown(window, { key: 'm' })
    expect(screen.getByText('Herramienta: Seleccionar')).toBeInTheDocument()
  })

  it('las teclas no cambian de herramienta mientras se escribe en un campo', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'd' })
    expect(screen.getByText('Herramienta: Seleccionar')).toBeInTheDocument()
    input.remove()
  })

  it('exporta DXF, SVG (módulos reales) y PDF con sus nombres y muestra el éxito', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    const exportAs = async (label: string, fmt: string) => {
      fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
      const dlg = screen.getByRole('dialog', { name: 'Exportar — 1 trazo(s)' })
      fireEvent.click(within(dlg).getByRole('button', { name: label }))
      const ok = await screen.findByRole('dialog', { name: '¡Exportación exitosa!' })
      expect(ok).toHaveTextContent(`Tu vectorización fue exportada como ${fmt} correctamente.`)
      fireEvent.click(within(ok).getByRole('button', { name: 'Continuar editando' }))
    }
    await exportAs('📐 DXF (AutoCAD / CNC)', 'DXF')
    await exportAs('🖼 SVG', 'SVG')
    expect(downloads).toEqual(['vectorizr.dxf', 'vectorizr.svg'])
    await exportAs('📄 PDF', 'PDF')
    expect(downloadPdf).toHaveBeenCalledWith(square, 0.5, [], 'vectorizr.pdf')
    expect(within(screen.getByRole('list', { name: 'Pasos' })).getAllByText('✓')).toHaveLength(4)
  })

  it('Escape cierra el diálogo de exportación (M18)', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"Ir al inicio" pide confirmación (M18)', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
    fireEvent.click(screen.getByRole('button', { name: '🖼 SVG' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ir al inicio' }))
    const confirm = screen.getByRole('dialog', { name: 'Ir al inicio' })
    expect(confirm).toHaveTextContent('¿Iniciar una nueva vectorización? Se perderán los cambios no exportados.')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Herramienta: Seleccionar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
    fireEvent.click(screen.getByRole('button', { name: '🖼 SVG' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ir al inicio' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Ir al inicio' })).getByRole('button', { name: 'Aceptar' }))
    expect(screen.getByRole('heading', { name: 'Cargar imagen' })).toBeInTheDocument()
  })

  it('"+ Nuevo trazo" guarda el trazo y lo lista', async () => {
    await seedStep4()
    renderTool()
    await inEditor()
    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo trazo' }))
    expect(screen.getByText('Trazo 1')).toBeInTheDocument()
    expect(screen.getByText('· Trazo activo: 0 pts')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar trazo 1' }))
    expect(screen.queryByText('Trazo 1')).not.toBeInTheDocument()
  })

  it('el manual se abre en un diálogo con sus 4 pestañas', async () => {
    renderTool()
    await ready()
    fireEvent.click(screen.getByRole('button', { name: '📖 Manual de usuario' }))
    const dlg = screen.getByRole('dialog', { name: 'Manual de usuario' })
    expect(within(dlg).getAllByRole('tab').map((t) => t.textContent)).toEqual(['🚀 Flujo', '🛠 Herramientas', '⌨️ Atajos', '💡 Consejos'])
    expect(dlg).toHaveTextContent('Acepta JPG, PNG y WebP.')
    fireEvent.click(within(dlg).getByRole('tab', { name: '⌨️ Atajos' }))
    expect(dlg).toHaveTextContent('Teclas rápidas — herramientas')
  })

  it('precarga OpenCV al estar activa y libera el worker al desmontar (M9, M10)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const { unmount } = renderTool()
    await vi.waitFor(() => {
      vi.advanceTimersByTime(2000)
      expect(preloadOpencv).toHaveBeenCalled()
    })
    vi.useRealTimers()
    unmount()
    expect(disposeOpencvClient).toHaveBeenCalled()
  })

  describe('varias piezas (paso 3)', () => {
    const sq = (o: number) => [{ x: o, y: 10 }, { x: o + 50, y: 10 }, { x: o + 50, y: 60 }, { x: o, y: 60 }]
    async function openMulti() {
      await seedStep4({ step: 3 })
      renderTool()
      fireEvent.click(await screen.findByRole('button', { name: /Detección automática/ }))
      fireEvent.click(await screen.findByRole('checkbox', { name: 'Varias piezas' }))
    }

    it('lista una fila por contorno, deja quitar una y confirma como piezas', async () => {
      detectAll.mockResolvedValue([sq(10), sq(100), sq(200)])
      await openMulti()
      expect(await screen.findAllByLabelText('Nombre de la pieza')).toHaveLength(3)
      expect(screen.getAllByLabelText('Nombre de la pieza').map((i) => (i as HTMLInputElement).value)).toEqual(['Pieza 1', 'Pieza 2', 'Pieza 3'])
      fireEvent.click(screen.getByRole('button', { name: 'Quitar pieza 2' }))
      expect(screen.getAllByLabelText('Nombre de la pieza')).toHaveLength(2)
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar (2 piezas)' }))
      await inEditor()
      expect(screen.getByText('Puntos: 4')).toBeInTheDocument()
    })

    it('sin contornos avisa y no deja confirmar', async () => {
      detectAll.mockResolvedValue([])
      await openMulti()
      expect(await screen.findByText('No se detectó ninguna pieza.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirmar (0 piezas)' })).toBeDisabled()
    })

    it('la cantidad se corrige a un entero entre 1 y 999 al salir del campo', async () => {
      detectAll.mockResolvedValue([sq(10)])
      await openMulti()
      const qty = (await screen.findByLabelText('Cantidad')) as HTMLInputElement
      fireEvent.change(qty, { target: { value: '0' } })
      fireEvent.blur(qty)
      expect(qty.value).toBe('1')
    })
  })

  describe('piezas (paso 4)', () => {
    const mk = (id: string, name: string, contourPoints: typeof square) => ({ id, name, quantity: 1, contourPoints, paths: [], notches: [] })
    async function twoPieces() {
      await seedStep4({ pieces: [mk('a', 'Pieza 1', square), mk('b', 'Pieza 2', square.slice(0, 2))], activePieceId: 'a' })
      renderTool()
      await inEditor()
    }

    it('muestra la pieza en trabajo y al elegir otra cambia todo', async () => {
      await twoPieces()
      expect(screen.getByText('Editando: Pieza 1')).toBeInTheDocument()
      expect(screen.getByText('Puntos: 3')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Pieza 2' }))
      expect(screen.getByText('Editando: Pieza 2')).toBeInTheDocument()
      expect(screen.getByText('Puntos: 2')).toBeInTheDocument()
    })

    it('renombrar la activa actualiza la pestaña y el título', async () => {
      await twoPieces()
      fireEvent.change(screen.getByLabelText('Nombre de la pieza'), { target: { value: 'Frente' } })
      expect(screen.getByRole('button', { name: 'Frente' })).toBeInTheDocument()
      expect(screen.getByText('Editando: Frente')).toBeInTheDocument()
    })

    it('"+ Nueva pieza" añade una pieza vacía y la activa', async () => {
      await twoPieces()
      fireEvent.click(screen.getByRole('button', { name: '+ Nueva pieza' }))
      expect(screen.getByText('Editando: Pieza 3')).toBeInTheDocument()
      expect(screen.getByText('Puntos: 0')).toBeInTheDocument()
    })

    it('borrar la activa deja a la vecina; con una sola pieza no hay botón de borrar', async () => {
      await twoPieces()
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar pieza 1' }))
      expect(screen.getByText('Editando: Pieza 2')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Eliminar pieza/ })).not.toBeInTheDocument()
    })
  })

  describe('exportar con varias piezas', () => {
    const mk = (id: string, name: string) => ({ id, name, quantity: 1, contourPoints: square, paths: [], notches: [] })
    async function openExport() {
      await seedStep4({ pieces: [mk('a', 'Frente'), mk('b', 'Espalda'), mk('c', 'Manga')], activePieceId: 'a' })
      renderTool()
      await inEditor()
      fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
      return screen.getByRole('dialog')
    }

    it('todo en un archivo baja un solo vectorizr.dxf', async () => {
      const dlg = await openExport()
      fireEvent.click(within(dlg).getByRole('button', { name: '📐 DXF (AutoCAD / CNC)' }))
      await screen.findByRole('dialog', { name: '¡Exportación exitosa!' })
      expect(downloads).toEqual(['vectorizr.dxf'])
    })

    it('descarga individual: una pieza por archivo con su nombre', async () => {
      const dlg = await openExport()
      fireEvent.click(within(dlg).getByRole('button', { name: 'Descarga individual →' }))
      fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Manga' }))
      fireEvent.click(within(dlg).getByRole('button', { name: 'DXF (2)' }))
      await screen.findByRole('dialog', { name: '¡Exportación exitosa!' })
      expect(downloads).toEqual(['Frente.dxf', 'Espalda.dxf'])
    })

    it('sin selección los botones de formato están desactivados; Seleccionar todo los reactiva', async () => {
      const dlg = await openExport()
      fireEvent.click(within(dlg).getByRole('button', { name: 'Descarga individual →' }))
      fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Seleccionar todo' }))
      expect(within(dlg).getByRole('button', { name: 'SVG (0)' })).toBeDisabled()
      fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Seleccionar todo' }))
      expect(within(dlg).getByRole('button', { name: 'SVG (3)' })).toBeEnabled()
    })

    it('con una sola pieza no hay descarga individual', async () => {
      await seedStep4()
      renderTool()
      await inEditor()
      fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
      expect(screen.queryByRole('button', { name: 'Descarga individual →' })).not.toBeInTheDocument()
    })
  })

  describe('baja resolución (paso 3)', () => {
    const drawImage = () => (fakeCtx as unknown as { drawImage: ReturnType<typeof vi.fn> }).drawImage
    async function openAuto() {
      await seedStep4({ step: 3, imageWidth: 1280, imageHeight: 960 })
      renderTool()
      fireEvent.click(await screen.findByRole('button', { name: /Detección automática/ }))
      await screen.findByRole('button', { name: 'Confirmar (4 pts)' })
    }

    it('apagada detecta a tamaño completo; encendida detecta sobre una copia de 640 px de lado mayor', async () => {
      await openAuto()
      expect(drawImage()).not.toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480)
      drawImage().mockClear()
      fireEvent.click(screen.getByRole('checkbox', { name: 'Baja resolución' }))
      await waitFor(() => expect(drawImage()).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480))
      expect(detect).toHaveBeenCalledTimes(2)
    })
  })

  describe('notches (paso 4)', () => {
    const canvas = () => document.querySelector('.vz-editor-canvas') as HTMLElement
    const rightClick = (x: number, y: number) => fireEvent.contextMenu(canvas(), { clientX: x, clientY: y })
    async function open() {
      await seedStep4()
      renderTool()
      await inEditor()
    }
    async function addAtTop() {
      rightClick(55, 12)
      fireEvent.click(screen.getByRole('menuitem', { name: 'Añadir notch' }))
    }

    it('clic derecho sobre el contorno ofrece Añadir notch y deja el notch seleccionado en el panel', async () => {
      await open()
      await addAtTop()
      expect(screen.getByText('Notch seleccionado')).toBeInTheDocument()
      expect((screen.getByLabelText('Profundidad (mm)') as HTMLInputElement).value).toBe('5')
      expect(screen.getByText('Notches: 1')).toBeInTheDocument()
    })

    it('lejos del contorno no hay menú', async () => {
      await open()
      rightClick(300, 250)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('el menú de un notch permite voltear, cambiar el tipo y eliminar', async () => {
      await open()
      await addAtTop()
      rightClick(55, 10)
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'T-notch' }))
      expect((screen.getByLabelText('Tipo') as HTMLSelectElement).value).toBe('T')
      rightClick(55, 10)
      expect(screen.getByRole('menuitemradio', { name: /T-notch/ })).toHaveAttribute('aria-checked', 'true')
      fireEvent.click(screen.getByRole('menuitem', { name: 'Voltear' }))
      rightClick(55, 10)
      fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }))
      expect(screen.queryByText('Notch seleccionado')).not.toBeInTheDocument()
      expect(screen.getByText('Notches: 0')).toBeInTheDocument()
    })

    it('Supr o Retroceso borran el notch seleccionado', async () => {
      await open()
      await addAtTop()
      expect(screen.getByText('Notches: 1')).toBeInTheDocument()
      fireEvent.keyDown(document.body, { key: 'Delete' })
      expect(screen.getByText('Notches: 0')).toBeInTheDocument()
      expect(screen.queryByText('Notch seleccionado')).not.toBeInTheDocument()
    })

    it('Supr dentro del campo de profundidad no borra el notch', async () => {
      await open()
      await addAtTop()
      fireEvent.keyDown(screen.getByLabelText('Profundidad (mm)'), { key: 'Delete' })
      expect(screen.getByText('Notches: 1')).toBeInTheDocument()
    })

    it('el clic derecho sobre el propio menú no lo cierra', async () => {
      await open()
      rightClick(55, 12)
      fireEvent.contextMenu(screen.getByRole('menuitem', { name: 'Añadir notch' }), { clientX: 300, clientY: 250 })
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('cambiar de pieza con un menú abierto lo cierra', async () => {
      const mk = (id: string, name: string) => ({ id, name, quantity: 1, contourPoints: square, paths: [], notches: [] })
      await seedStep4({ pieces: [mk('a', 'Pieza 1'), mk('b', 'Pieza 2')], activePieceId: 'a' })
      renderTool()
      await inEditor()
      rightClick(55, 12)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Pieza 2' }))
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('la profundidad del panel se corrige a un valor válido y Escape cierra el menú', async () => {
      await open()
      await addAtTop()
      const depth = screen.getByLabelText('Profundidad (mm)') as HTMLInputElement
      fireEvent.change(depth, { target: { value: '8' } })
      fireEvent.blur(depth)
      expect(depth.value).toBe('8')
      fireEvent.change(depth, { target: { value: '' } })
      fireEvent.blur(depth)
      expect(depth.value).toBe('5')
      rightClick(55, 10)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('capa de notches al exportar', () => {
    const withNotch = () => ({
      id: 'a', name: 'Frente', quantity: 1, contourPoints: square, paths: [],
      notches: [{ id: 'n1', x: 55, y: 10, type: 'V' as const, depth: 5, flipped: false }],
    })
    const lastBlob = async () => {
      const blob = vi.mocked(URL.createObjectURL).mock.calls.slice(-1)[0]![0] as Blob
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsText(blob)
      })
    }

    it('sin notches no aparece la opción', async () => {
      await seedStep4()
      renderTool()
      await inEditor()
      fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
      expect(screen.queryByRole('checkbox', { name: /Notches en otra capa/ })).not.toBeInTheDocument()
    })

    it('apagada (por defecto) el DXF sale sin la capa; encendida la incluye', async () => {
      await seedStep4({ pieces: [withNotch()], activePieceId: 'a' })
      renderTool()
      await inEditor()
      fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
      const box = screen.getByRole('checkbox', { name: /Notches en otra capa/ })
      expect(box).not.toBeChecked()
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '📐 DXF (AutoCAD / CNC)' }))
      await screen.findByRole('dialog', { name: '¡Exportación exitosa!' })
      const plain = await lastBlob()
      expect(plain).toContain('POLYLINE')
      expect(plain).not.toContain('NOTCHES')
      fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }))
      fireEvent.click(screen.getByRole('button', { name: '↓ Exportar' }))
      fireEvent.click(screen.getByRole('checkbox', { name: /Notches en otra capa/ }))
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '📐 DXF (AutoCAD / CNC)' }))
      await waitFor(async () => expect(await lastBlob()).toContain('NOTCHES'))
    })
  })
})
