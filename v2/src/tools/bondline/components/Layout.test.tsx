import { act, fireEvent, render, screen } from '@testing-library/react'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { useToasts } from '../../../ui/toastStore'
import { BondlineStoreProvider, useBondlineApi } from '../BondlineStoreProvider'
import { defaultMarkerPositions } from '../logic/markers'
import { TC_COLORS } from '../logic/types'
import type { BondlineApi } from '../store'
import { Layout } from './Layout'

let api: BondlineApi
function Grab() {
  api = useBondlineApi()
  return null
}

function setup(disabled = false) {
  return render(
    <BondlineStoreProvider>
      <Grab />
      <Layout disabled={disabled} />
    </BondlineStoreProvider>,
  )
}

const load = () => act(() => void api.getState().loadWorkbook('b.xlsx', [{ name: 'H1', raw: FIXTURES.plain }]))
const open = () => fireEvent.click(screen.getByRole('button', { name: /Bondline Layout/ }))
const imageFile = (name = 'guante.png', type = 'image/png') => new File(['x'], name, { type })
const pick = (file: File, input = screen.getByTestId('bl-layout-input')) =>
  fireEvent.change(input, { target: { files: [file] } })
const toastMessages = () => useToasts.getState().toasts.map((t) => t.message)
const layout = () => api.getState().config.layout

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

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

function mockRect(el: Element, r: { left: number; top: number; width: number; height: number }) {
  el.getBoundingClientRect = () =>
    ({ ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top }) as DOMRect
}

test('sin imagen, plegable cerrado por defecto; abierto muestra la zona de carga con el texto original', () => {
  setup()
  load()
  expect(screen.getByRole('heading', { name: /Bondline Layout/ })).toBeInTheDocument()
  expect(screen.getByText('Diagrama visual de ubicación de termopares')).toBeInTheDocument()
  expect(screen.queryByTestId('bl-layout-input')).toBeNull()
  open()
  expect(screen.getByText('haz clic para seleccionar').tagName).toBe('STRONG')
  expect(screen.getByTestId('bl-layout-input')).toHaveAttribute('accept', 'image/*')
})

test('archivo que no es imagen: aviso original y no se carga', () => {
  setup()
  load()
  open()
  pick(new File(['x'], 'datos.xlsx', { type: 'application/vnd.ms-excel' }))
  expect(toastMessages()).toEqual(['Por favor selecciona una imagen'])
  expect(layout().image).toBeNull()
})

test('con imagen: un marcador por TC visible, color, texto idx+1, etiqueta TC-n y posiciones por defecto', () => {
  setup()
  load()
  open()
  const file = imageFile()
  pick(file)
  expect(layout().image).toBe(file)
  expect(screen.getByRole('img', { name: 'Bondline Layout' })).toHaveAttribute('src', 'blob:test/1')
  const pos = defaultMarkerPositions(4)
  for (let i = 0; i < 4; i++) {
    const m = screen.getByTestId(`bl-marker-${i}`)
    expect(m).toHaveTextContent(String(i + 1))
    expect(m).toHaveAttribute('aria-label', `TC-${i + 1}`)
    expect(m).toHaveAttribute('data-label', `TC-${i + 1}`)
    expect(m.style.left).toBe(`${pos[i].x}%`)
    expect(m.style.top).toBe(`${pos[i].y}%`)
    expect(m.style.backgroundColor).toBe(hexToRgb(TC_COLORS[i % 20]))
  }
  expect(screen.getByText('Arrastra los termopares para ubicarlos en el diagrama')).toBeInTheDocument()
})

test('ocultar una TC deja solo las visibles y regenera posiciones por defecto; conserva el número original', () => {
  setup()
  load()
  open()
  pick(imageFile())
  act(() => api.getState().toggleTC(1))
  expect(screen.queryByTestId('bl-marker-1')).toBeNull()
  const pos = defaultMarkerPositions(3)
  const visible = [0, 2, 3]
  visible.forEach((tc, n) => {
    const m = screen.getByTestId(`bl-marker-${tc}`)
    expect(m).toHaveTextContent(String(tc + 1))
    expect(m.style.left).toBe(`${pos[n].x}%`)
  })
})

test('arrastre: % relativos a la imagen, sin salto y limitados a [0,100]', () => {
  setup()
  load()
  open()
  pick(imageFile())
  mockRect(screen.getByTestId('bl-layout-overlay'), { left: 100, top: 50, width: 400, height: 200 })
  const m = screen.getByTestId('bl-marker-0')
  const start = defaultMarkerPositions(4)[0]
  const cx = 100 + (start.x / 100) * 400
  const cy = 50 + (start.y / 100) * 200
  fireEvent.pointerDown(m, { pointerId: 1, clientX: cx + 5, clientY: cy, button: 0 })
  fireEvent.pointerMove(m, { pointerId: 1, clientX: cx + 5, clientY: cy })
  expect(m.style.left).toBe(`${start.x}%`)
  fireEvent.pointerMove(m, { pointerId: 1, clientX: 305, clientY: 200 })
  expect(m.style.left).toBe('50%')
  expect(m.style.top).toBe('75%')
  fireEvent.pointerUp(m, { pointerId: 1, clientX: 305, clientY: 200 })
  expect(layout().markers[0]).toEqual({ tcIndex: 0, x: 50, y: 75 })
  fireEvent.pointerDown(m, { pointerId: 2, clientX: 300, clientY: 200, button: 0 })
  fireEvent.pointerMove(m, { pointerId: 2, clientX: 9999, clientY: -9999 })
  fireEvent.pointerUp(m, { pointerId: 2, clientX: 9999, clientY: -9999 })
  expect(layout().markers[0]).toEqual({ tcIndex: 0, x: 100, y: 0 })
})

test('teclado: flechas mueven 1% (Shift 5%), limitado a [0,100]; descritos por las instrucciones', () => {
  setup()
  load()
  open()
  pick(imageFile())
  act(() => api.getState().moveMarker(0, 50, 0))
  const m = screen.getByTestId('bl-marker-0')
  fireEvent.keyDown(m, { key: 'ArrowRight' })
  fireEvent.keyDown(m, { key: 'ArrowUp', shiftKey: true })
  expect(layout().markers[0]).toEqual({ tcIndex: 0, x: 51, y: 0 })
  const hint = screen.getByText('Arrastra los termopares para ubicarlos en el diagrama')
  expect(m).toHaveAttribute('aria-describedby', hint.id)
})

test('"Tamaño real" alterna ajuste y tamaño natural, y se guarda en el store', () => {
  setup()
  load()
  open()
  pick(imageFile())
  const scroll = document.querySelector('.bl-layout__scroll')!
  expect(scroll).toHaveClass('bl-layout__scroll--fit')
  const toggle = screen.getByRole('button', { name: 'Tamaño real' })
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(toggle)
  expect(scroll).not.toHaveClass('bl-layout__scroll--fit')
  expect(api.getState().layoutFit).toBe(false)
  expect(screen.getByRole('button', { name: 'Tamaño real' })).toHaveAttribute('aria-pressed', 'true')
})

test('"Cambiar imagen" reemplaza la imagen, recoloca marcadores y revoca la URL anterior', () => {
  setup()
  load()
  open()
  pick(imageFile('a.png'))
  act(() => api.getState().moveMarker(0, 90, 90))
  const second = imageFile('b.jpg', 'image/jpeg')
  pick(second, screen.getByTestId('bl-layout-change'))
  expect(screen.getByText('Cambiar imagen')).toBeInTheDocument()
  expect(layout().image).toBe(second)
  expect(layout().markers[0].x).toBe(defaultMarkerPositions(4)[0].x)
  expect(screen.getByRole('img', { name: 'Bondline Layout' })).toHaveAttribute('src', 'blob:test/2')
  expect(revoked).toContain('blob:test/1')
})

test('imagen que no decodifica: aviso, se quita y vuelve la zona de carga', () => {
  setup()
  load()
  open()
  pick(imageFile())
  fireEvent.error(screen.getByRole('img', { name: 'Bondline Layout' }))
  expect(toastMessages()).toEqual(['No se pudo mostrar la imagen'])
  expect(layout().image).toBeNull()
  expect(layout().markers).toEqual([])
  expect(screen.getByTestId('bl-layout-input')).toBeInTheDocument()
})

test('imagen > 20 MB: se usa y el Layout no avisa (lo hace la persistencia)', () => {
  setup()
  load()
  open()
  const big = imageFile('grande.png')
  Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 })
  pick(big)
  expect(layout().image).toBe(big)
  expect(toastMessages()).toEqual([])
})
