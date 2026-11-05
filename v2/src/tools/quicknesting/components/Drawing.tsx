// Dibujo en SVG con elementos de React (sin innerHTML): rollo, margen discontinuo y piezas, Y hacia arriba.
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

export function Drawing({ pieces, width, length, margin = 0, title }: Props) {
  const valid = [width, length].every((v) => ok(v) && v > 0) && ok(margin) && margin >= 0 && margin * 2 < Math.min(width, length) &&
    pieces.every((p) => p.points.length >= 3 && p.points.every((q) => q.length === 2 && q.every((v) => ok(v) && Math.abs(v) <= 1e9)))
  if (!valid) return null
  const pad = Math.max(width, length) * 0.025
  return (
    <svg className="qn-svg" viewBox={`${-pad} ${-pad} ${width + 2 * pad} ${length + 2 * pad}`} role="img" aria-label={title}>
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
  )
}
