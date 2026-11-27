import { Fragment } from 'react'
import { Circle, Line } from 'react-konva'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { contourSegments, withHandle } from '../../logic/contourPath'

const COLOR = '#a855f7'

/**
 * Asas de los tramos curvos (Bézier): dos puntos por tramo que se arrastran para que la curva quede más o menos
 * marcada. Se ven con las herramientas Seleccionar y Editar punto. Un arrastre es un solo paso del historial.
 */
export function HandleLayer() {
  const api = useVectorizrApi()
  const contour = useVectorizr((s) => s.contourPoints)
  const zoom = useVectorizr((s) => s.zoom)
  const tool = useVectorizr((s) => s.activeToolId)
  if (tool !== 'select' && tool !== 'edit-point') return null

  return (
    <>
      {contourSegments(contour).map((seg) => {
        if (!seg.controls) return null
        const anchors = [seg.from, seg.to]
        return (
          <Fragment key={`h-${seg.index}`}>
            {seg.controls.map((c, i) => (
              <Line key={`l-${i}`} points={[anchors[i]!.x, anchors[i]!.y, c.x, c.y]} stroke={COLOR} strokeWidth={1 / zoom} dash={[4 / zoom, 3 / zoom]} listening={false} />
            ))}
            {seg.controls.map((c, i) => (
              <Circle
                key={`c-${i}`}
                x={c.x}
                y={c.y}
                radius={5 / zoom}
                fill={COLOR}
                stroke="white"
                strokeWidth={1.5 / zoom}
                draggable
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'grab'
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = ''
                }}
                onDragStart={(e) => {
                  e.cancelBubble = true
                }}
                onDragMove={(e) => {
                  e.cancelBubble = true
                  api.getState().setContourPoints(withHandle(api.getState().contourPoints, seg.index, i === 0 ? 'cp1' : 'cp2', e.target.x(), e.target.y()))
                }}
                onDragEnd={(e) => {
                  e.cancelBubble = true
                  api.getState().pushHistory()
                }}
              />
            ))}
          </Fragment>
        )
      })}
    </>
  )
}
