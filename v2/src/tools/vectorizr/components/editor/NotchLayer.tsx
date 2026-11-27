import type { KonvaEventObject } from 'konva/lib/Node'
import { Circle, Group, Line } from 'react-konva'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { nearestOnContour, notchAngleToward, notchGeometry, notchOwnerPoints } from '../../logic/notches'
import { activeNotches } from '../../store'

interface Props {
  selectedNotchId: string | null
  onSelect: (id: string | null) => void
}

const GHOST = '#e0a400'
const SELECTED = '#d16bff'
/** Zona de agarre y de clic, en píxeles de pantalla (se divide entre el zoom). */
const GRAB_PX = 12
const HIT_STROKE_PX = 14

const setCursor = (e: KonvaEventObject<MouseEvent>, cursor: string) => {
  const container = e.target.getStage()?.container()
  if (container) container.style.cursor = cursor
}

/**
 * Notches como línea fantasma punteada (solo visual, no se exportan). Un clic sobre el dibujo o su base los
 * selecciona; arrastrando la base se deslizan por el contorno en vivo; Supr los borra (ver Step4Editor).
 */
export function NotchLayer({ selectedNotchId, onSelect }: Props) {
  const api = useVectorizrApi()
  const notches = useVectorizr((s) => activeNotches(s))
  const contour = useVectorizr((s) => s.contourPoints)
  const paths = useVectorizr((s) => s.paths)
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const zoom = useVectorizr((s) => s.zoom)

  return (
    <>
      {notches.map((n) => {
        const g = notchGeometry(n, notchOwnerPoints(n, contour, paths), scaleFactor)
        if (!g) return null
        const owner = () => notchOwnerPoints(n, api.getState().contourPoints, api.getState().paths)
        const selected = n.id === selectedNotchId
        const color = selected ? SELECTED : GHOST
        const select = (e: KonvaEventObject<MouseEvent>) => {
          e.cancelBubble = true
          onSelect(n.id)
        }
        const common = {
          stroke: color,
          strokeWidth: (selected ? 2.5 : 2) / zoom,
          dash: [4 / zoom, 3 / zoom],
          hitStrokeWidth: HIT_STROKE_PX / zoom,
          onClick: select,
          onMouseEnter: (e: KonvaEventObject<MouseEvent>) => setCursor(e, 'pointer'),
          onMouseLeave: (e: KonvaEventObject<MouseEvent>) => setCursor(e, ''),
        }
        /** Desliza el notch al punto más cercano del contorno mientras se arrastra; con Ctrl se queda fijo y solo gira. */
        const follow = (e: KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true
          if (e.evt?.ctrlKey || e.evt?.metaKey) {
            // el puntero se mide en el sistema del grupo (el del dibujo), no en el del círculo que se arrastra
            const p = e.target.getParent()?.getRelativePointerPosition()
            const angle = p ? notchAngleToward(n, owner(), p.x, p.y) : null
            if (angle !== null) api.getState().updateNotch(n.id, { angle })
            e.target.position({ x: g.base.x, y: g.base.y })
            return
          }
          const hit = nearestOnContour(owner(), e.target.x(), e.target.y())
          if (!hit) return
          api.getState().updateNotch(n.id, { x: hit.x, y: hit.y })
          e.target.position({ x: hit.x, y: hit.y })
        }
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
            <Circle x={g.base.x} y={g.base.y} radius={3.5 / zoom} fill={color} listening={false} />
            <Circle
              x={g.base.x}
              y={g.base.y}
              radius={GRAB_PX / zoom}
              fill="rgba(0,0,0,0.01)"
              stroke={selected ? color : undefined}
              strokeWidth={selected ? 1.5 / zoom : 0}
              draggable
              onClick={select}
              onMouseEnter={(e) => setCursor(e, 'grab')}
              onMouseLeave={(e) => setCursor(e, '')}
              onDragStart={(e) => {
                e.cancelBubble = true
                onSelect(n.id)
              }}
              onDragMove={follow}
              onDragEnd={(e) => {
                follow(e)
                // si el punto no cambió, react-konva no mueve el nodo: se devuelve a la base dibujada
                const hit = nearestOnContour(owner(), e.target.x(), e.target.y())
                e.target.position({ x: hit?.x ?? g.base.x, y: hit?.y ?? g.base.y })
              }}
            />
          </Group>
        )
      })}
    </>
  )
}
