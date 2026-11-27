import type { KonvaEventObject } from 'konva/lib/Node'
import { Circle, Group } from 'react-konva'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { drillRadiusPx } from '../../logic/drills'
import { activeDrills } from '../../store'

interface Props {
  /** Abre el diálogo de dimensión del drill. */
  onEdit: (id: string) => void
}

const COLOR = '#e0a400'
const HIT_STROKE_PX = 12

const setCursor = (e: KonvaEventObject<MouseEvent>, cursor: string) => {
  const container = e.target.getStage()?.container()
  if (container) container.style.cursor = cursor
}

/** Drills como círculos a escala real. Un clic abre su dimensión; arrastrarlos los mueve libremente. */
export function DrillLayer({ onEdit }: Props) {
  const api = useVectorizrApi()
  const drills = useVectorizr((s) => activeDrills(s))
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const zoom = useVectorizr((s) => s.zoom)

  return (
    <>
      {drills.map((d) => (
        <Group key={d.id}>
          <Circle
            x={d.x}
            y={d.y}
            radius={drillRadiusPx(d, scaleFactor)}
            stroke={COLOR}
            strokeWidth={2 / zoom}
            fill="rgba(224,164,0,0.25)"
            hitStrokeWidth={HIT_STROKE_PX / zoom}
            draggable
            onClick={(e) => {
              e.cancelBubble = true
              onEdit(d.id)
            }}
            onTap={() => onEdit(d.id)}
            onDragStart={(e) => {
              e.cancelBubble = true
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true
              api.getState().updateDrill(d.id, { x: e.target.x(), y: e.target.y() })
            }}
            onMouseEnter={(e) => setCursor(e, 'pointer')}
            onMouseLeave={(e) => setCursor(e, '')}
          />
          <Circle x={d.x} y={d.y} radius={2 / zoom} fill={COLOR} listening={false} />
        </Group>
      ))}
    </>
  )
}
