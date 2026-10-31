import { useEffect, useRef, useState, type DependencyList } from 'react'
import type { HitTest } from '../draw/canvas'

interface Props {
  /** Dibuja en el canvas y devuelve la función de tooltip (o null si no hay). */
  draw: (canvas: HTMLCanvasElement) => HitTest | null | void
  deps: DependencyList
  className?: string
  /** Atributos width/height del canvas (el original los fija en el HTML). */
  width?: number
  height?: number
  label: string
  /** Redibuja al cambiar el ancho (el original solo redibujaba al expandir). */
  responsive?: boolean
}

interface Tip {
  text: string
  x: number
  y: number
}

/** Canvas del original con su tooltip flotante (showTooltip/hideTooltip). */
export function CanvasChart({ draw, deps, className, width, height, label, responsive = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const hit = useRef<HitTest | null>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const run = () => {
      hit.current = drawRef.current(canvas) ?? null
    }
    run()
    if (!responsive || typeof ResizeObserver === 'undefined') return
    let lastW = canvas.offsetWidth
    const ro = new ResizeObserver(() => {
      if (canvas.offsetWidth === lastW) return
      lastW = canvas.offsetWidth
      run()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return (
    <>
      <canvas
        ref={ref}
        className={className}
        width={width}
        height={height}
        role="img"
        aria-label={label}
        onMouseMove={(e) => {
          const canvas = ref.current
          if (!canvas || !hit.current) return
          const rect = canvas.getBoundingClientRect()
          const text = hit.current(e.clientX - rect.left, e.clientY - rect.top)
          setTip(text ? { text, x: e.clientX, y: e.clientY } : null)
        }}
        onMouseLeave={() => setTip(null)}
      />
      {tip && (
        <div className="cf-tooltip" role="tooltip" style={{ left: tip.x + 15, top: tip.y - 10 }}>
          {tip.text}
        </div>
      )}
    </>
  )
}
