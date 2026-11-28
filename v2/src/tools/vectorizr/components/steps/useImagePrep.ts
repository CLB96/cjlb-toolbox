import { useRef, useState, type PointerEvent } from 'react'
import { pointerToImage } from '../../logic/canvasCoords'
import { dragCrop, EMPTY_PREP, hitHandle, normalizeCrop, type Crop, type Handle, type ImagePrep } from '../../logic/prepImage'

export type PrepTool = 'none' | 'crop' | 'erase'
export type EraseMode = 'brush' | 'lasso'

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
  const [eraseMode, setEraseMode] = useState<EraseMode>('brush')
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [cursor, setCursor] = useState('default')
  const [showMask, setShowMask] = useState(false)
  const [highlight, setHighlight] = useState<number | null>(null)
  const adjustBase = useRef<ImagePrep | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number; d: number } | null>(null)
  const drag = useRef<Drag | null>(null)
  const brushSize = Math.max(1, (imageWidth * brush) / 400)
  const lasso = tool === 'erase' && eraseMode === 'lasso'
  const lassoLine = Math.max(2, imageWidth / 500)

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
      setPrep({ ...prep, strokes: [...prep.strokes, lasso ? { points: [point], size: lassoLine, fill: true } : { points: [point], size: brushSize }] })
    }
    remember()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    const { point, scaleRatio } = pointerToImage(e, e.currentTarget, imageWidth, imageHeight, rotation)
    const d = drag.current
    if (tool === 'erase' && !lasso) {
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
        if (!last) return p
        // en el lazo solo se agrega un punto si se movió lo suficiente (unos 3 px de pantalla)
        const prev = last.points[last.points.length - 1]!
        if (last.fill && Math.hypot(point.x - prev.x, point.y - prev.y) < 3 / scaleRatio) return p
        strokes[strokes.length - 1] = { ...last, points: [...last.points, point] }
        return { ...p, strokes }
      })
    }
  }

  function up() {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (d.kind === 'crop') setPrep((p) => ({ ...p, crop: p.crop ? normalizeCrop(p.crop, imageWidth, imageHeight) : null }))
    const last = prep.strokes[prep.strokes.length - 1]
    if (d.kind === 'erase' && last?.fill && last.points.length < 3) {
      // un clic suelto no encierra nada: se descarta el lazo y su paso de deshacer
      setPrep((p) => ({ ...p, strokes: p.strokes.slice(0, -1) }))
      setHistory((h) => h.slice(0, -1))
      return
    }
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
  /** Quita una sola zona ignorada (se puede deshacer). */
  const removeStroke = (index: number) => {
    setHighlight(null)
    apply({ ...prep, strokes: prep.strokes.filter((_, k) => k !== index) })
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
    eraseMode,
    setEraseMode,
    open,
    setOpen,
    tick,
    showMask,
    setShowMask,
    highlight,
    setHighlight,
    removeStroke,
    setAdjust,
    commitAdjust,
    cursor: tool === 'none' ? 'default' : cursor,
    hover: tool === 'erase' && !lasso ? hover : null,
    canUndo: history.length > 0,
    undo,
    fullPhoto: () => apply(EMPTY_PREP),
    handlers: { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up, onPointerLeave: () => setHover(null) },
  }
}
