import { Circle, Group, Line } from 'react-konva'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { nearestOnContour, notchGeometry } from '../../logic/notches'
import { activeNotches } from '../../store'

interface Props {
  selectedNotchId: string | null
  onSelect: (id: string | null) => void
}

const GHOST = '#e0a400'
const SELECTED = '#d16bff'

/** Notches como línea fantasma punteada (solo visual, no se exportan); arrastrables, pegados al contorno. */
export function NotchLayer({ selectedNotchId, onSelect }: Props) {
  const api = useVectorizrApi()
  const notches = useVectorizr((s) => activeNotches(s))
  const contour = useVectorizr((s) => s.contourPoints)
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const zoom = useVectorizr((s) => s.zoom)

  return (
    <>
      {notches.map((n) => {
        const g = notchGeometry(n, contour, scaleFactor)
        if (!g) return null
        const color = n.id === selectedNotchId ? SELECTED : GHOST
        const common = { stroke: color, strokeWidth: 2 / zoom, dash: [4 / zoom, 3 / zoom], listening: false }
        return (
          <Group key={n.id}>
            {g.type === 'V' && g.a && g.b && (
              <Line points={[g.a.x, g.a.y, g.b.x, g.b.y, g.tip.x, g.tip.y]} closed fill="rgba(255,209,102,0.6)" {...common} />
            )}
            {g.type === 'I' && <Line points={[g.base.x, g.base.y, g.tip.x, g.tip.y]} {...common} />}
            {g.type === 'T' && g.a && g.b && (
              <>
                <Line points={[g.base.x, g.base.y, g.tip.x, g.tip.y]} {...common} />
                <Line points={[g.a.x, g.a.y, g.b.x, g.b.y]} {...common} />
              </>
            )}
            <Circle
              x={g.base.x}
              y={g.base.y}
              radius={5 / zoom}
              fill="rgba(0,0,0,0.01)"
              stroke={color}
              strokeWidth={n.id === selectedNotchId ? 1.5 / zoom : 0}
              draggable
              onClick={(e) => {
                e.cancelBubble = true
                onSelect(n.id)
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true
                const hit = nearestOnContour(api.getState().contourPoints, e.target.x(), e.target.y())
                if (hit) api.getState().updateNotch(n.id, { x: hit.x, y: hit.y })
                onSelect(n.id)
              }}
            />
          </Group>
        )
      })}
    </>
  )
}
