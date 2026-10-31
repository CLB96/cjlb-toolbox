import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEffect, useRef, useState } from 'react'
import { Circle, Group, Image as KImage, Layer, Line, Path, Stage, Text } from 'react-konva'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { buildPath } from '../../logic/contourPath'
import { pxToMm } from '../../logic/scale'
import type { ImagePoint } from '../../types'
import { fitZoom } from '../fit'

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onPointMove: (id: string, x: number, y: number) => void
  onAddPoint: (x: number, y: number) => void
  onDeletePoint: (id: string) => void
  onToggleSegmentType: (id: string) => void
  /** Al incrementarse ajusta y centra la imagen */
  centerTrigger: number
}

const ZOOM_MIN = 0.1
const ZOOM_MAX = 10
const FIT_PADDING = 40

/** Deshace la rotación del Group alrededor del centro de la imagen (:46-60). */
export function stageToImageCoords(sx: number, sy: number, imgW: number, imgH: number, rotDeg: number): ImagePoint {
  const cx = imgW / 2
  const cy = imgH / 2
  const dx = sx - cx
  const dy = sy - cy
  switch (((rotDeg % 360) + 360) % 360) {
    case 90:
      return { x: cx + dy, y: cy - dx }
    case 180:
      return { x: cx - dx, y: cy - dy }
    case 270:
      return { x: cx - dy, y: cy + dx }
    default:
      return { x: sx, y: sy }
  }
}

const CURSORS: Partial<Record<string, string>> = {
  'add-point': 'crosshair',
  'delete-point': 'cell',
  'segment-type': 'pointer',
  measure: 'crosshair',
  zoom: 'zoom-in',
}

export function EditorCanvas({ selectedId, onSelect, onPointMove, onAddPoint, onDeletePoint, onToggleSegmentType, centerTrigger }: Props) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const image = useVectorizr((s) => s.image)
  const imageWidth = useVectorizr((s) => s.imageWidth)
  const imageHeight = useVectorizr((s) => s.imageHeight)
  const contourPoints = useVectorizr((s) => s.contourPoints)
  const paths = useVectorizr((s) => s.paths)
  const activeToolId = useVectorizr((s) => s.activeToolId)
  const zoom = useVectorizr((s) => s.zoom)
  const stagePos = useVectorizr((s) => s.stagePos)
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const imageRotation = useVectorizr((s) => s.imageRotation)

  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [measurePts, setMeasurePts] = useState<ImagePoint[]>([])
  const onAddPointRef = useRef(onAddPoint)
  onAddPointRef.current = onAddPoint
  const blockClickRef = useRef(false)
  const fittedRef = useRef(false)

  // Medidas del contenedor (ResizeObserver si existe)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setStageSize({ width: el.clientWidth, height: el.clientHeight })
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Ajuste y centrado: al entrar al paso (M16, bug #25) y con "⊡ Fit"
  useEffect(() => {
    const { width, height } = stageSize
    const z = fitZoom(width, height, imageWidth, imageHeight, FIT_PADDING)
    if (!z) return
    if (fittedRef.current && centerTrigger === 0) return
    fittedRef.current = true
    const newZoom = Math.min(ZOOM_MAX, Math.max(0.05, z))
    const s = api.getState()
    s.setZoom(newZoom)
    s.setStagePos({ x: (width - imageWidth * newZoom) / 2, y: (height - imageHeight * newZoom) / 2 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerTrigger, stageSize.width > 0 && stageSize.height > 0, imageWidth, imageHeight, api])

  useEffect(() => {
    if (activeToolId !== 'measure') setMeasurePts([])
  }, [activeToolId])

  // Rueda no pasiva: zoom hacia el cursor
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (ev: WheelEvent) => {
      ev.preventDefault()
      const stage = stageRef.current
      if (!stage) return
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const oldScale = stage.scaleX()
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * (ev.deltaY < 0 ? 1.12 : 0.9)))
      const to = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
      api.getState().setZoom(newScale)
      api.getState().setStagePos({ x: pointer.x - to.x * newScale, y: pointer.y - to.y * newScale })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [api])

  // Clic nativo: agregar punto y medir en cualquier zona del lienzo
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handler = (ev: MouseEvent) => {
      if (blockClickRef.current) {
        blockClickRef.current = false
        return
      }
      const s = api.getState()
      const tool = s.activeToolId
      if (tool !== 'add-point' && tool !== 'measure') return
      const rect = container.getBoundingClientRect()
      const stageX = (ev.clientX - rect.left - s.stagePos.x) / s.zoom
      const stageY = (ev.clientY - rect.top - s.stagePos.y) / s.zoom
      const p = stageToImageCoords(stageX, stageY, s.imageWidth, s.imageHeight, s.imageRotation)
      if (tool === 'add-point') onAddPointRef.current(p.x, p.y)
      else setMeasurePts((prev) => (prev.length >= 2 ? [p] : [...prev, p]))
    }
    container.addEventListener('click', handler)
    return () => container.removeEventListener('click', handler)
  }, [api])

  function handleStageClick(e: KonvaEventObject<MouseEvent>) {
    if (e.target !== e.target.getStage()) return
    if (activeToolId === 'select' || activeToolId === 'edit-point') onSelect(null)
  }

  const m0 = measurePts[0]
  const m1 = measurePts[1]
  const distPx = m0 && m1 ? Math.hypot(m1.x - m0.x, m1.y - m0.y) : 0
  const distMm = pxToMm(distPx, scaleFactor)

  const groupProps =
    imageRotation !== 0
      ? { rotation: imageRotation, x: imageWidth / 2, y: imageHeight / 2, offsetX: imageWidth / 2, offsetY: imageHeight / 2 }
      : {}
  const draggablePoints = activeToolId === 'select' || activeToolId === 'edit-point'

  return (
    <div ref={containerRef} className="vz-canvas vz-editor-canvas" style={{ cursor: CURSORS[activeToolId] ?? 'grab' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={activeToolId === 'select' || activeToolId === 'zoom'}
        onClick={handleStageClick}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) api.getState().setStagePos({ x: e.target.x(), y: e.target.y() })
        }}
      >
        <Layer>
          <Group {...groupProps}>
            {image && <KImage image={image.image} width={imageWidth} height={imageHeight} listening={false} />}
            {paths.map((path, pi) => (
              <Path
                key={`path-${pi}`}
                data={buildPath(path)}
                stroke="rgba(74,158,255,0.5)"
                strokeWidth={1.5 / zoom}
                fill="transparent"
                dash={[6 / zoom, 3 / zoom]}
                listening={false}
              />
            ))}
            {contourPoints.length >= 2 && (
              <Path data={buildPath(contourPoints)} stroke="#4a7eff" strokeWidth={2 / zoom} fill="transparent" listening={false} />
            )}
            {contourPoints.map((pt) => {
              const sel = selectedId === pt.id
              const bez = pt.type === 'bezier'
              return (
                <Circle
                  key={pt.id}
                  x={pt.x}
                  y={pt.y}
                  radius={(sel ? 7 : 5) / zoom}
                  fill={bez ? (sel ? '#a855f7' : 'rgba(168,85,247,0.7)') : sel ? '#ea580c' : 'white'}
                  stroke={sel ? (bez ? '#a855f7' : '#ea580c') : '#4a7eff'}
                  strokeWidth={2 / zoom}
                  draggable={draggablePoints}
                  onMouseDown={() => {
                    if (activeToolId === 'add-point') blockClickRef.current = true
                  }}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (activeToolId === 'delete-point') return onDeletePoint(pt.id)
                    if (activeToolId === 'segment-type') return onToggleSegmentType(pt.id)
                    onSelect(pt.id)
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true
                    onPointMove(pt.id, e.target.x(), e.target.y())
                  }}
                />
              )
            })}
            {m0 && <Circle x={m0.x} y={m0.y} radius={4 / zoom} fill="#fbbf24" listening={false} />}
            {m0 && m1 && (
              <>
                <Line points={[m0.x, m0.y, m1.x, m1.y]} stroke="#fbbf24" strokeWidth={1.5 / zoom} dash={[5 / zoom, 3 / zoom]} listening={false} />
                <Circle x={m1.x} y={m1.y} radius={4 / zoom} fill="#fbbf24" listening={false} />
                <Text
                  x={(m0.x + m1.x) / 2}
                  y={(m0.y + m1.y) / 2 - 14 / zoom}
                  text={`${distMm.toFixed(2)} mm`}
                  fontSize={11 / zoom}
                  fill="#fbbf24"
                  fontStyle="bold"
                  listening={false}
                />
              </>
            )}
          </Group>
        </Layer>
      </Stage>

      <div className="vz-overlay vz-overlay--zoom">{t('zoomHint', Math.round(zoom * 100))}</div>
      {activeToolId === 'measure' && (
        <div className="vz-overlay vz-overlay--measure">
          {measurePts.length === 0 && t('measureStart')}
          {measurePts.length === 1 && t('measureEnd')}
          {measurePts.length === 2 && t('measureDist', distMm.toFixed(2))}
        </div>
      )}
      <div className="vz-overlay vz-overlay--keys">{t('keysHint')}</div>
    </div>
  )
}
