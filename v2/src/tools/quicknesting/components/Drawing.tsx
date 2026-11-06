// Dibujo en SVG con elementos de React (sin innerHTML): rollo, margen discontinuo y piezas, Y hacia arriba.
// Rueda: acercar o alejar hacia el cursor; arrastrar: mover; doble clic o «⤢»: ver todo.
import { useMemo } from 'react'
import { useQnT } from '../i18n'
import { usePanZoom } from './usePanZoom'

interface Shape {
  id: string
  points: number[][]
}

interface Props {
  pieces: Shape[]
  width: number
  length: number
  margin?: number
  title: string
}

const ok = (v: unknown) => typeof v === 'number' && Number.isFinite(v)

export function Drawing(props: Props) {
  const { pieces, width, length, margin = 0 } = props
  const valid = [width, length].every((v) => ok(v) && v > 0) && ok(margin) && margin >= 0 && margin * 2 < Math.min(width, length) &&
    pieces.every((p) => p.points.length >= 3 && p.points.every((q) => q.length === 2 && q.every((v) => ok(v) && Math.abs(v) <= 1e9)))
  return valid ? <ZoomableDrawing {...props} /> : null
}

function ZoomableDrawing({ pieces, width, length, margin = 0, title }: Props) {
  const t = useQnT()
  const base = useMemo(() => {
    const pad = Math.max(width, length) * 0.025
    return { x: -pad, y: -pad, w: width + 2 * pad, h: length + 2 * pad }
  }, [width, length])
  const { svgRef, view, zoomIn, zoomOut, reset, handlers } = usePanZoom(base)

  return (
    <div className="qn-zoom">
      <div className="qn-zoom__bar" role="toolbar" aria-label={t('zoomTools')}>
        <button type="button" onClick={zoomIn} aria-label={t('zoomIn')} title={t('zoomIn')}>+</button>
        <button type="button" onClick={zoomOut} aria-label={t('zoomOut')} title={t('zoomOut')}>−</button>
        <button type="button" onClick={reset} aria-label={t('zoomReset')} title={t('zoomReset')}>⤢</button>
      </div>
      <svg ref={svgRef} className="qn-svg" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} role="img" aria-label={title}
        tabIndex={0} {...handlers}>
        <title>{title}</title>
        <rect width={width} height={length} fill="none" stroke="var(--fg-muted)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {margin > 0 && (
          <rect x={margin} y={margin} width={width - 2 * margin} height={length - 2 * margin} fill="none" stroke="var(--warn)"
            strokeWidth={1} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
        )}
        <g transform={`translate(0 ${length}) scale(1 -1)`}>
          {pieces.map((p, i) => (
            <polygon key={`${p.id}-${i}`} points={p.points.map((q) => q.map((v) => Number(v.toFixed(5))).join(',')).join(' ')}
              fill="var(--accent-1)" fillOpacity={0.15} stroke="var(--accent-1)" strokeWidth={1} vectorEffect="non-scaling-stroke">
              <title>{p.id}</title>
            </polygon>
          ))}
        </g>
      </svg>
    </div>
  )
}
