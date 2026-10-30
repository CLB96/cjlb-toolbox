import { fireEvent, renderHook } from '@testing-library/react'
import type { Chart } from 'chart.js'
import type { ActiveEvent } from '../logic/events'
import type { EffectiveRange } from '../logic/range'
import { useEventDrag } from './useEventDrag'

const PX = 10 // 1 segundo = 10 px en la escala falsa

function fakeChart() {
  const canvas = document.createElement('canvas')
  document.body.appendChild(canvas)
  const chart = {
    canvas,
    scales: {
      x: {
        getPixelForValue: (v: number) => v * PX,
        getValueForPixel: (p: number) => p / PX,
      },
    },
  }
  return { canvas, ref: { current: chart as unknown as Chart<'line'> } }
}

const press: ActiveEvent = { x: 30, label: 'Inicia Prensa', color: '#4f8cff', id: 'eventPressStart' }
const manip: ActiveEvent = { x: 31, label: 'Inicia Manipulación', color: '#43b36b', id: 'eventManipStart' }
const RANGE: EffectiveRange = { start: 20, end: 120, rows: 100 }
const NO_RANGE: EffectiveRange = { start: 0, end: 120, rows: 120 }
const tip = () => document.querySelector<HTMLElement>('#dragEventTooltip')!

function drag(canvas: HTMLCanvasElement, fromPx: number, toPx: number) {
  fireEvent.click(canvas, { clientX: fromPx })
  fireEvent.mouseDown(canvas, { clientX: fromPx })
  fireEvent.mouseMove(canvas, { clientX: toPx, clientY: 100 })
}

afterEach(() => {
  document.body.innerHTML = ''
})

test('con rango {20, null}: arrastrar Inicia Prensa (x=30) a la posición relativa 15 escribe 35 (R3)', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  renderHook(() => useEventDrag(ref, [press], RANGE, 120, setEvent))
  drag(canvas, (30 - 20) * PX, 15 * PX)
  expect(setEvent).toHaveBeenLastCalledWith('eventPressStart', '35')
  expect(tip().style.display).toBe('block')
  expect(tip().innerHTML).toBe('<span style="color: var(--ok);">+5s</span> — t=35s')
  expect(canvas.style.cursor).toBe('grabbing')
  fireEvent.mouseUp(canvas)
  expect(tip().style.display).toBe('none')
  expect(canvas.style.cursor).toBe('grab')
})

test('delta +N, -N y ±0 con sus tonos', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  renderHook(() => useEventDrag(ref, [press], NO_RANGE, 120, setEvent))
  drag(canvas, 300, 270)
  expect(tip().innerHTML).toBe('<span style="color: var(--error);">-3s</span> — t=27s')
  fireEvent.mouseMove(canvas, { clientX: 300 })
  expect(tip().innerHTML).toBe('<span style="color: var(--fg-muted);">±0s</span> — t=30s')
  expect(setEvent).toHaveBeenLastCalledWith('eventPressStart', '30')
})

test('clic a >= 10 px no selecciona; el último suceso que coincide gana', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  renderHook(() => useEventDrag(ref, [press, manip], NO_RANGE, 120, setEvent))
  drag(canvas, 300 + 30, 500)
  expect(setEvent).toHaveBeenCalledTimes(0)
  expect(canvas.style.cursor).toBe('default')
  drag(canvas, 305, 400)
  expect(setEvent).toHaveBeenLastCalledWith('eventManipStart', '40')
})

test('fuera de [0, totalRows-1] no escribe', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  renderHook(() => useEventDrag(ref, [press], RANGE, 120, setEvent))
  drag(canvas, 100, 100 * PX) // relativo 100 -> absoluto 120
  expect(setEvent).not.toHaveBeenCalled()
})

test('mouseleave termina el arrastre y oculta el tooltip', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  renderHook(() => useEventDrag(ref, [press], NO_RANGE, 120, setEvent))
  drag(canvas, 300, 320)
  fireEvent.mouseLeave(canvas)
  expect(tip().style.display).toBe('none')
  expect(canvas.style.cursor).toBe('default')
  fireEvent.mouseMove(canvas, { clientX: 350 })
  expect(setEvent).toHaveBeenCalledTimes(1)
})

test('re-renders no duplican listeners ni tooltips; desmontar los retira', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  const add = vi.spyOn(canvas, 'addEventListener')
  const { rerender, unmount } = renderHook(
    ({ events }) => useEventDrag(ref, events, NO_RANGE, 120, setEvent),
    { initialProps: { events: [press] } },
  )
  const calls = add.mock.calls.length
  rerender({ events: [{ ...press, x: 50 }] })
  rerender({ events: [{ ...press, x: 60 }] })
  expect(add.mock.calls.length).toBe(calls)
  expect(document.querySelectorAll('#dragEventTooltip')).toHaveLength(1)
  // usa los sucesos más recientes
  drag(canvas, 600, 650)
  expect(setEvent).toHaveBeenCalledTimes(1)
  expect(setEvent).toHaveBeenLastCalledWith('eventPressStart', '65')
  unmount()
  expect(document.querySelectorAll('#dragEventTooltip')).toHaveLength(0)
  fireEvent.click(canvas, { clientX: 600 })
  fireEvent.mouseDown(canvas, { clientX: 600 })
  fireEvent.mouseMove(canvas, { clientX: 700 })
  expect(setEvent).toHaveBeenCalledTimes(1)
})

test('deshabilitado: no escribe ni muestra el tooltip', () => {
  const { canvas, ref } = fakeChart()
  const setEvent = vi.fn()
  renderHook(() => useEventDrag(ref, [press], NO_RANGE, 120, setEvent, false))
  drag(canvas, 300, 320)
  expect(setEvent).not.toHaveBeenCalled()
  expect(tip().style.display).toBe('none')
  expect(canvas.style.cursor).not.toBe('grabbing')
})
