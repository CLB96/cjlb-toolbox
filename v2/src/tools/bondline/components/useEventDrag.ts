import { useEffect, useRef, type RefObject } from 'react'
import type { Chart } from 'chart.js'
import { dragDelta, dragToAbsolute, visibleEventX, type ActiveEvent } from '../logic/events'
import type { EffectiveRange } from '../logic/range'
import type { EventInputId } from '../logic/types'

/** Distancia máxima en px entre el clic y la línea del suceso (original: `< 10`). */
const HIT_PX = 10

const TONE_COLOR = { pos: 'var(--ok)', neg: 'var(--error)', zero: 'var(--fg-muted)' } as const

type SetEvent = (id: EventInputId, value: string) => void

interface Latest {
  events: ActiveEvent[]
  range: Pick<EffectiveRange, 'start' | 'rows'>
  totalRows: number
  setEvent: SetEvent
}

function createTooltip(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = 'dragEventTooltip'
  el.className = 'bl-drag-tip'
  el.style.display = 'none'
  document.body.appendChild(el)
  return el
}

function showTooltip(el: HTMLDivElement, e: MouseEvent, abs: number, originalX: number) {
  const delta = dragDelta(abs, originalX)
  const span = document.createElement('span')
  span.style.color = TONE_COLOR[delta.tone]
  span.textContent = `${delta.text}s`
  el.replaceChildren(span, ` — t=${abs}s`)
  el.style.display = 'block'
  el.style.left = `${e.clientX + 12}px`
  el.style.top = `${e.clientY - 35}px`
}

/**
 * Clic + arrastre de las líneas de suceso (inventario §5E). R3: el hit-test usa la posición
 * en el eje (`x - inicio del rango`) y se escribe el segundo absoluto. Un solo juego de
 * listeners y un solo tooltip por gráfica; `chartRef` debe tener la gráfica creada al montar.
 */
export function useEventDrag(
  chartRef: RefObject<Chart<'line'> | null>,
  events: ActiveEvent[],
  range: Pick<EffectiveRange, 'start' | 'rows'>,
  totalRows: number,
  setEvent: SetEvent,
): void {
  const latest = useRef<Latest>({ events, range, totalRows, setEvent })
  useEffect(() => {
    latest.current = { events, range, totalRows, setEvent }
  })

  useEffect(() => {
    const chart = chartRef.current
    const canvas = chart?.canvas
    if (!chart || !canvas) return
    const tooltip = createTooltip()
    let selected: ActiveEvent | null = null
    let dragging = false
    let originalX = 0
    const localX = (e: MouseEvent) => e.clientX - canvas.getBoundingClientRect().left

    const onClick = (e: MouseEvent) => {
      const x = localX(e)
      const { events: evts, range: r } = latest.current
      let hit: ActiveEvent | null = null
      for (const evt of evts) {
        const rel = visibleEventX(evt, r)
        if (rel !== null && Math.abs(x - chart.scales.x.getPixelForValue(rel)) < HIT_PX) hit = evt
      }
      selected = hit
      if (hit) originalX = hit.x
      canvas.style.cursor = hit ? 'grab' : 'default'
    }
    const onDown = () => {
      if (!selected) return
      dragging = true
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e: MouseEvent) => {
      if (!dragging || !selected) return
      const { range: r, totalRows: rows, setEvent: write } = latest.current
      const rel = Math.round(chart.scales.x.getValueForPixel(localX(e)) ?? NaN)
      const abs = dragToAbsolute(rel, r, rows)
      if (abs === null) return
      showTooltip(tooltip, e, abs, originalX)
      write(selected.id as EventInputId, String(abs))
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      tooltip.style.display = 'none'
      canvas.style.cursor = selected ? 'grab' : 'default'
    }
    const onLeave = () => {
      dragging = false
      tooltip.style.display = 'none'
      canvas.style.cursor = 'default'
    }

    canvas.addEventListener('click', onClick)
    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onLeave)
    return () => {
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onLeave)
      tooltip.remove()
    }
  }, [chartRef])
}
