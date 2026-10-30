import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { useToasts } from '../../../ui/toastStore'
import { GapcheckStoreProvider, useGapcheckApi } from '../GapcheckStoreProvider'
import { POINT_COLORS } from '../logic/chartStyle'
import { defaultMarkerPositions } from '../logic/markers'
import type { GapcheckApi } from '../store'
import { Layout } from './Layout'

let api: GapcheckApi
function Grab() {
  api = useGapcheckApi()
  return null
}

function setup(disabled = false) {
  return render(
    <GapcheckStoreProvider>
      <Grab />
      <Layout disabled={disabled} />
    </GapcheckStoreProvider>,
  )
}

const NAMES = ['P1', 'P2', 'P3', 'P4', 'P5']
function loadPoints() {
  act(() => {
    api.getState().loadRows('a.xlsx', [NAMES, [1, 2, 3, 4, 5]] as never)
  })
}

const imageFile = (name = 'diagrama.png', type = 'image/png') =>
  new File(['x'], name, { type })

function pick(file: File, input = screen.getByTestId('gc-layout-input')) {
  fireEvent.change(input, { target: { files: [file] } })
}

const toastMessages = () => useToasts.getState().toasts.map((t) => t.message)

// jsdom no implementa PointerEvent: sin esto clientX/pointerId se pierden en fireEvent
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 0
      }
    }
    window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent
  }
})

const created: Blob[] = []
const revoked: string[] = []

beforeEach(() => {
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
  created.length = 0
  revoked.length = 0
  URL.createObjectURL = vi.fn((b: Blob) => {
    created.push(b)
    return `blob:test/${created.length}`
  })
  URL.revokeObjectURL = vi.fn((u: string) => {
    revoked.push(u)
  })
})

test('sin imagen se ve la zona de carga con el texto original', () => {
  setup()
  expect(screen.getByRole('heading', { name: /Gapcheck Layout/ })).toBeInTheDocument()
  expect(
    screen.getByText('Carga una imagen del diagrama y posiciona cada punto de medición'),
  ).toBeInTheDocument()
  expect(screen.getByText('haz clic para seleccionar').tagName).toBe('STRONG')
  expect(screen.getByTestId('gc-layout-input')).toHaveAttribute('accept', 'image/*')
  expect(screen.queryByRole('slider')).toBeNull()
})

test('abierta por defecto y colapsable', () => {
  setup()
  const toggle = screen.getByRole('button', { name: /Gapcheck Layout/ })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByTestId('gc-layout-input')).toBeNull()
})

test('archivo que no es imagen → toast con el texto original y no se carga', () => {
  setup()
  pick(new File(['x'], 'datos.xlsx', { type: 'application/vnd.ms-excel' }))
  expect(toastMessages()).toEqual(['Por favor selecciona una imagen'])
  expect(api.getState().layout.image).toBeNull()
})

test('texto del aviso en inglés', () => {
  localStorage.setItem('cjlb.lang', 'en')
  __resetI18nForTests()
  setup()
  pick(new File(['x'], 'a.txt', { type: 'text/plain' }))
  expect(toastMessages()).toEqual(['Please select an image'])
})

test('al cargar imagen con datos: un marcador por punto en la posición por defecto, color y nombre', () => {
  setup()
  loadPoints()
  const file = imageFile()
  pick(file)
  expect(api.getState().layout.image).toBe(file)
  expect(api.getState().layout.imageName).toBe('diagrama.png')
  const img = screen.getByRole('img', { name: 'Gapcheck Layout' })
  expect(img).toHaveAttribute('src', 'blob:test/1')
  const pos = defaultMarkerPositions(NAMES.length)
  NAMES.forEach((name, i) => {
    const m = screen.getByTestId(`gc-marker-${i}`)
    expect(m).toHaveTextContent(name)
    expect(m.style.left).toBe(`${pos[i].x}%`)
    expect(m.style.top).toBe(`${pos[i].y}%`)
    expect(m.style.backgroundColor).toBe(hexToRgb(POINT_COLORS[i % 15]))
  })
  expect(screen.getByText('Arrastra los puntos de medición para ubicarlos en el diagrama')).toBeInTheDocument()
})

test('los puntos ocultos por filtro siguen en el layout (original)', () => {
  setup()
  loadPoints()
  act(() => api.getState().togglePoint(1))
  pick(imageFile())
  expect(screen.getByTestId('gc-marker-1')).toHaveTextContent('P2')
})

test('slider 20–60 paso 2 cambia tamaño, fuente y radio', () => {
  setup()
  loadPoints()
  pick(imageFile())
  const slider = screen.getByRole('slider', { name: 'Tamaño de Puntos:' })
  expect(slider).toHaveAttribute('min', '20')
  expect(slider).toHaveAttribute('max', '60')
  expect(slider).toHaveAttribute('step', '2')
  expect(slider).toHaveValue('44')
  expect(screen.getByText('44px')).toBeInTheDocument()
  fireEvent.change(slider, { target: { value: '20' } })
  expect(api.getState().layout.markerSize).toBe(20)
  expect(screen.getByText('20px')).toBeInTheDocument()
  const m = screen.getByTestId('gc-marker-0')
  expect(m.style.width).toBe('20px')
  expect(m.style.height).toBe('20px')
  expect(m.style.fontSize).toBe('9px') // Math.max(9, 20 * 0.27)
  expect(m.style.borderRadius).toBe(`${20 / 4.4}px`)
  fireEvent.change(slider, { target: { value: '60' } })
  expect(m.style.fontSize).toBe(`${60 * 0.27}px`)
})

function mockRect(el: Element, rect: { left: number; top: number; width: number; height: number }) {
  el.getBoundingClientRect = () =>
    ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top }) as DOMRect
}

test('arrastre con pointer events: % relativos a la imagen, sin salto y limitados a [0,100]', () => {
  setup()
  loadPoints()
  pick(imageFile())
  const overlay = screen.getByTestId('gc-layout-overlay')
  mockRect(overlay, { left: 100, top: 50, width: 400, height: 200 })
  const m = screen.getByTestId('gc-marker-0')
  const start = defaultMarkerPositions(NAMES.length)[0]
  // centro del marcador en pantalla
  const cx = 100 + (start.x / 100) * 400
  const cy = 50 + (start.y / 100) * 200
  // agarrar 5px a la derecha del centro: no debe saltar
  fireEvent.pointerDown(m, { pointerId: 1, clientX: cx + 5, clientY: cy, button: 0 })
  fireEvent.pointerMove(m, { pointerId: 1, clientX: cx + 5, clientY: cy })
  expect(m.style.left).toBe(`${start.x}%`)
  fireEvent.pointerMove(m, { pointerId: 1, clientX: 100 + 200 + 5, clientY: 50 + 150 })
  expect(m.style.left).toBe('50%')
  expect(m.style.top).toBe('75%')
  fireEvent.pointerUp(m, { pointerId: 1, clientX: 100 + 200 + 5, clientY: 50 + 150 })
  expect(api.getState().layout.markers[0]).toEqual({ pointIndex: 0, x: 50, y: 75 })

  fireEvent.pointerDown(m, { pointerId: 2, clientX: 300, clientY: 200, button: 0 })
  fireEvent.pointerMove(m, { pointerId: 2, clientX: 9999, clientY: -9999 })
  fireEvent.pointerUp(m, { pointerId: 2, clientX: 9999, clientY: -9999 })
  expect(api.getState().layout.markers[0]).toEqual({ pointIndex: 0, x: 100, y: 0 })
})

test('la imagen que no se puede decodificar avisa y se quita', () => {
  setup()
  loadPoints()
  pick(imageFile())
  fireEvent.error(screen.getByRole('img', { name: 'Gapcheck Layout' }))
  expect(toastMessages()).toEqual(['No se pudo mostrar la imagen'])
  expect(api.getState().layout.image).toBeNull()
  expect(api.getState().layout.imageName).toBeNull()
  expect(screen.getByTestId('gc-layout-input')).toBeInTheDocument()
})

test('aviso de imagen no decodificable en inglés', () => {
  localStorage.setItem('cjlb.lang', 'en')
  __resetI18nForTests()
  setup()
  loadPoints()
  pick(imageFile())
  fireEvent.error(screen.getByRole('img', { name: 'Gapcheck Layout' }))
  expect(toastMessages()).toEqual(['The image could not be displayed'])
})

test('perder la captura del puntero cierra el arrastre y guarda la posición', () => {
  setup()
  loadPoints()
  pick(imageFile())
  mockRect(screen.getByTestId('gc-layout-overlay'), { left: 0, top: 0, width: 400, height: 200 })
  const m = screen.getByTestId('gc-marker-0')
  fireEvent.pointerDown(m, { pointerId: 1, clientX: 200, clientY: 100, button: 0 })
  fireEvent.pointerMove(m, { pointerId: 1, clientX: 340, clientY: 140 })
  fireEvent(m, new Event('lostpointercapture', { bubbles: true }))
  expect(m.className).not.toContain('gc-marker--dragging')
  expect(api.getState().layout.markers[0]).toMatchObject({ x: 50, y: 50 })
})

test('accesibilidad: marcadores descritos por las instrucciones; emoji del título oculto', () => {
  setup()
  loadPoints()
  pick(imageFile())
  const hint = screen.getByText('Arrastra los puntos de medición para ubicarlos en el diagrama')
  expect(hint.id).toBeTruthy()
  expect(screen.getByTestId('gc-marker-0')).toHaveAttribute('aria-describedby', hint.id)
  expect(screen.getByRole('button', { name: /Gapcheck Layout/ }).textContent).toContain('📐')
  expect(document.querySelector('#gc-layout-title [aria-hidden="true"]:not(:first-child)')).not.toBeNull()
})

test('teclado: flechas mueven el marcador 1% (Shift 5%)', () => {
  setup()
  loadPoints()
  pick(imageFile())
  act(() => api.getState().moveMarker(0, 50, 50))
  const m = screen.getByTestId('gc-marker-0')
  fireEvent.keyDown(m, { key: 'ArrowRight' })
  fireEvent.keyDown(m, { key: 'ArrowUp', shiftKey: true })
  expect(api.getState().layout.markers[0]).toEqual({ pointIndex: 0, x: 51, y: 45 })
})

test('"Cambiar imagen" reemplaza la imagen, recoloca marcadores y revoca la URL anterior', () => {
  setup()
  loadPoints()
  pick(imageFile('a.png'))
  act(() => api.getState().moveMarker(0, 90, 90))
  const second = imageFile('b.jpg', 'image/jpeg')
  pick(second, screen.getByTestId('gc-layout-change'))
  expect(screen.getByText('Cambiar imagen')).toBeInTheDocument()
  expect(api.getState().layout.image).toBe(second)
  expect(api.getState().layout.markers[0].x).toBe(defaultMarkerPositions(NAMES.length)[0].x)
  expect(screen.getByRole('img', { name: 'Gapcheck Layout' })).toHaveAttribute('src', 'blob:test/2')
  expect(revoked).toContain('blob:test/1')
})

test('revoca la URL al desmontar', () => {
  const { unmount } = setup()
  loadPoints()
  pick(imageFile())
  unmount()
  expect(revoked).toContain('blob:test/1')
})

test('imagen > 20 MB: se usa en pantalla; el aviso lo da la persistencia, no el Layout', () => {
  setup()
  loadPoints()
  const big = imageFile('grande.png')
  Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 })
  pick(big)
  expect(api.getState().layout.image).toBe(big)
  expect(toastMessages()).toEqual([])
})

test('deshabilitado hasta restaurar: no acepta archivos', () => {
  setup(true)
  expect(screen.getByTestId('gc-layout-input')).toBeDisabled()
})

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

test('deshabilitado: los marcadores no se mueven con el teclado', () => {
  setup()
  loadPoints()
  pick(imageFile())
  const before = api.getState().layout.markers[0]
  cleanup()
  setup(true)
  act(() => {
    api.getState().loadRows('a.xlsx', [NAMES, [1, 2, 3, 4, 5]] as never)
    api.getState().setLayoutImage(imageFile(), 'd.png')
  })
  const marker = screen.getByTestId('gc-marker-0')
  expect(marker).toHaveAttribute('aria-disabled', 'true')
  fireEvent.keyDown(marker, { key: 'ArrowRight' })
  expect(api.getState().layout.markers[0].x).toBe(before.x)
})
