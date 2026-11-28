import { useRef, useState, type PointerEvent } from 'react'
import { pointerToImage } from '../../logic/canvasCoords'
import { dragCrop, EMPTY_PREP, hitHandle, normalizeCrop, type Crop, type Handle, type ImagePrep } from '../../logic/prepImage'

export type PrepTool = 'none' | 'crop' | 'erase'

const GRAB_PX = 14
const HANDLE_CURSOR: Record<Handle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', move: 'move',
}

type Drag = { kind: 'crop'; handle: Handle; start: Crop; x0: number; y0: number } | { kind: 'erase' }

/** Recorte y borrado de la foto: estado, deshacer y manejo del puntero sobre el canvas. */
export function useImagePrep(imageWidth: number, imageHeight: number, rotation = 0) {
  const [prep, setPrep] = useState<ImagePrep>(EMPTY_PREP)
  const [history, setHistory] = useState<ImagePrep[]>([])
  const [tool, setTool] = useState<PrepTool>('none')
  const [brush, setBrush] = useState(8)
  const [tick, setTick] = useState(0)
  const [cursor, setCursor] = useState('default')
  const [showMask, setShowMask] = useState(false)
  const adjustBase = useRef<ImagePrep | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number; d: number } | null>(null)
  const drag = useRef<Drag | null>(null)
  const brushSize = Math.max(1, (imageWidth * brush) / 400)

  const full: Crop = { x: 0, y: 0, w: imageWidth, h: imageHeight }
  const remember = () => setHistory((h) => [...h, prep])

  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (tool === 'none' || e.button !== 0) return
    const { point, scaleRatio } = pointerToImage(e, e.currentTarget, imageWidth, imageHeight, rotation)
    if (tool === 'crop') {
      const start = prep.crop ?? full
      const handle = hitHandle(start, point.x, point.y, GRAB_PX / scaleRatio)
      if (!handle) return
      drag.current = { kind: 'crop', handle, start, x0: point.x, y0: point.y }
    } else {
      drag.current = { kind: 'erase' }
      setPrep({ ...prep, strokes: [...prep.strokes, { points: [point], size: brushSize }] })
    }
    remember()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    const { point, scaleRatio } = pointerToImage(e, e.currentTarget, imageWidth, imageHeight, rotation)
    const d = drag.current
    if (tool === 'erase') {
      const frame = e.currentTarget.parentElement?.getBoundingClientRect()
      if (frame) setHover({ x: e.clientX - frame.left, y: e.clientY - frame.top, d: brushSize * scaleRatio })
    } else if (hover) setHover(null)
    if (!d) {
      if (tool === 'crop') {
        const h = hitHandle(prep.crop ?? full, point.x, point.y, GRAB_PX / scaleRatio)
        setCursor(h ? HANDLE_CURSOR[h] : 'default')
      } else setCursor(tool === 'erase' ? 'crosshair' : 'default')
      return
    }
    if (d.kind === 'crop') {
      setPrep((p) => ({ ...p, crop: dragCrop(d.start, d.handle, point.x - d.x0, point.y - d.y0, imageWidth, imageHeight) }))
    } else {
      setPrep((p) => {
        const strokes = p.strokes.slice()
        const last = strokes[strokes.length - 1]
        if (last) strokes[strokes.length - 1] = { ...last, points: [...last.points, point] }
        return { ...p, strokes }
      })
    }
  }

  function up() {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (d.kind === 'crop') setPrep((p) => ({ ...p, crop: p.crop ? normalizeCrop(p.crop, imageWidth, imageHeight) : null }))
    setTick((t) => t + 1)
  }

  /** Brillo o contraste en vivo; el deshacer y la nueva detección se registran al soltar (commitAdjust). */
  const setAdjust = (key: 'brightness' | 'contrast', value: number) => {
    if (!adjustBase.current) adjustBase.current = prep
    setPrep((p) => ({ ...p, [key]: value }))
  }
  const commitAdjust = () => {
    const base = adjustBase.current
    if (!base) return
    adjustBase.current = null
    setHistory((h) => [...h, base])
    setTick((t) => t + 1)
  }

  const apply = (next: ImagePrep) => {
    remember()
    setPrep(next)
    setTick((t) => t + 1)
  }
  const undo = () => {
    const prev = history[history.length - 1]
    if (!prev) return
    setHistory((h) => h.slice(0, -1))
    setPrep(prev)
    setTick((t) => t + 1)
  }

  return {
    prep,
    tool,
    setTool,
    brush,
    setBrush,
    brushSize,
    tick,
    showMask,
    setShowMask,
    setAdjust,
    commitAdjust,
    cursor: tool === 'none' ? 'default' : cursor,
    hover: tool === 'erase' ? hover : null,
    canUndo: history.length > 0,
    undo,
    fullPhoto: () => apply(EMPTY_PREP),
    handlers: { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up, onPointerLeave: () => setHover(null) },
  }
}
