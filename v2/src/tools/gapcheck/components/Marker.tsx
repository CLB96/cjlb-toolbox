import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

const KEY_STEP = 1
const KEY_STEP_FAST = 5

const clamp = (v: number): number => Math.min(100, Math.max(0, v))

interface Pos {
  x: number
  y: number
}

interface Props {
  index: number
  name: string
  color: string
  x: number
  y: number
  size: number
  disabled?: boolean
  /** Rectángulo de la imagen mostrada (las posiciones son % de él, Ruling R4). */
  getImageRect: () => DOMRect | null
  onMove: (x: number, y: number) => void
}

/** Estilo del original (slider 2804-2811): tamaño, fuente y radio proporcionales. */
export const markerBoxStyle = (size: number) => ({
  width: `${size}px`,
  height: `${size}px`,
  fontSize: `${Math.max(9, size * 0.27)}px`,
  borderRadius: `${size / 4.4}px`,
})

/**
 * Marcador arrastrable centrado en su punto (translate(-50%,-50%) igual que las cuentas),
 * así no salta al agarrarlo (bug (a) del inventario §8).
 */
export function Marker({ index, name, color, x, y, size, disabled = false, getImageRect, onMove }: Props) {
  const [drag, setDrag] = useState<Pos | null>(null)
  const grab = useRef<Pos>({ x: 0, y: 0 })
  const last = useRef<Pos | null>(null)

  const posFrom = (clientX: number, clientY: number): Pos | null => {
    const r = getImageRect()
    if (!r || r.width === 0 || r.height === 0) return null
    return {
      x: clamp(((clientX - grab.current.x - r.left) / r.width) * 100),
      y: clamp(((clientY - grab.current.y - r.top) / r.height) * 100),
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
    const r = getImageRect()
    if (!r) return
    e.preventDefault()
    // distancia entre el puntero y el centro del marcador: se conserva durante el arrastre
    grab.current = {
      x: e.clientX - (r.left + (x / 100) * r.width),
      y: e.clientY - (r.top + (y / 100) * r.height),
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    last.current = { x, y }
    setDrag({ x, y })
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!last.current) return
    const p = posFrom(e.clientX, e.clientY)
    if (!p) return
    last.current = p
    setDrag(p)
  }

  const finish = (e: PointerEvent<HTMLDivElement>) => {
    if (!last.current) return
    const p = posFrom(e.clientX, e.clientY) ?? last.current
    last.current = null
    setDrag(null)
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    onMove(p.x, p.y)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const step = e.shiftKey ? KEY_STEP_FAST : KEY_STEP
    const delta: Record<string, Pos> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const d = delta[e.key]
    if (!d) return
    e.preventDefault()
    onMove(clamp(x + d.x), clamp(y + d.y))
  }

  const pos = drag ?? { x, y }
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={name}
      data-testid={`gc-marker-${index}`}
      className={`gc-marker${drag ? ' gc-marker--dragging' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, backgroundColor: color, ...markerBoxStyle(size) }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={onKeyDown}
    >
      {name}
    </div>
  )
}
