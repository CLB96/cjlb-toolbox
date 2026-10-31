import { useState } from 'react'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { toast } from '../../../../ui/toastStore'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { downloadDxf } from '../../logic/exportDxf'
import { downloadPdf } from '../../logic/exportPdf'
import { downloadSvg } from '../../logic/exportSvg'
import type { ContourPoint, SegmentType } from '../../types'
import { EditorCanvas } from '../editor/EditorCanvas'
import { PropertiesPanel } from '../editor/PropertiesPanel'
import { StatusBar } from '../editor/StatusBar'
import { Toolbar } from '../editor/Toolbar'
import { useEditorShortcuts } from '../editor/useEditorShortcuts'

type Format = 'DXF' | 'SVG' | 'PDF'

export const EXPORT_FILENAMES: Record<Format, string> = {
  DXF: 'vectorizr.dxf',
  SVG: 'vectorizr.svg',
  PDF: 'vectorizr.pdf',
}

export function Step4Editor({ active }: { active: boolean }) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const contourPoints = useVectorizr((s) => s.contourPoints)
  const paths = useVectorizr((s) => s.paths)
  const zoom = useVectorizr((s) => s.zoom)
  const imageRotation = useVectorizr((s) => s.imageRotation)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [confirmStart, setConfirmStart] = useState(false)
  const [exportedFormat, setExportedFormat] = useState('')
  const [centerTrigger, setCenterTrigger] = useState(0)

  useEditorShortcuts(active)

  const allPaths = [...paths, ...(contourPoints.length > 1 ? [contourPoints] : [])]
  const totalPts = allPaths.reduce((a, p) => a + p.length, 0)

  /** Cambia el trazo activo y guarda la instantánea para deshacer. */
  function edit(next: ContourPoint[]) {
    api.getState().setContourPoints(next)
    api.getState().pushHistory()
  }
  const current = () => api.getState().contourPoints

  const updatePoint = (id: string, x: number, y: number) => edit(current().map((p) => (p.id === id ? { ...p, x, y } : p)))
  const addPoint = (x: number, y: number) => edit([...current(), { id: Date.now().toString(), x, y, type: 'line' }])
  const changeSegmentType = (id: string, type: SegmentType) => edit(current().map((p) => (p.id === id ? { ...p, type } : p)))
  const toggleSegmentType = (id: string) =>
    edit(current().map((p) => (p.id === id ? { ...p, type: p.type === 'line' ? 'bezier' : 'line' } : p)))
  function deletePoint(id: string) {
    edit(current().filter((p) => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }
  function handleAddNewPath() {
    if (current().length < 2) return
    api.getState().addNewPath()
    setSelectedId(null)
  }

  async function doExport(format: Format) {
    const { contourPoints: active, scaleFactor, paths: extra } = api.getState()
    const filename = EXPORT_FILENAMES[format]
    try {
      if (format === 'DXF') downloadDxf(active, scaleFactor, extra, filename)
      else if (format === 'SVG') downloadSvg(active, scaleFactor, extra, filename)
      else await downloadPdf(active, scaleFactor, extra, filename)
    } catch {
      toast('error', t('errExport'))
      return
    }
    setShowExport(false)
    setExportedFormat(format)
    api.getState().setExported(true)
    setShowSuccess(true)
  }

  const setZoom = (z: number) => api.getState().setZoom(z)
  const rot = (r: number) => api.getState().setImageRotation(r)

  return (
    <div className="vz-step">
      <div className="vz-bar glass">
        <Button variant="ghost" onClick={() => api.getState().setStep(3)}>
          {t('backStep3')}
        </Button>
        <span className="vz-pill">{t('pathsCount', allPaths.length, totalPts)}</span>
        <Button variant="ghost" onClick={handleAddNewPath} disabled={contourPoints.length < 2} title={t('newPathTitle')}>
          {t('newPath')}
        </Button>
        <span className="vz-spacer" />
        <Button variant="ghost" onClick={() => setCenterTrigger((c) => c + 1)} title={t('fitTitle')}>
          {t('fit')}
        </Button>
        <span className="vz-sep" />
        <button type="button" className="vz-ib" title={t('zoomOut')} aria-label={t('zoomOut')} onClick={() => setZoom(Math.max(0.1, zoom * 0.8))}>
          −
        </button>
        <span className="vz-pill">{Math.round(zoom * 100)}%</span>
        <button type="button" className="vz-ib" title={t('zoomIn')} aria-label={t('zoomIn')} onClick={() => setZoom(Math.min(10, zoom * 1.2))}>
          +
        </button>
        <button type="button" className="vz-ib vz-ib--txt" title={t('oneToOne')} onClick={() => setZoom(1)}>
          1:1
        </button>
        <span className="vz-sep" />
        <button
          type="button"
          className="vz-ib"
          title={t('rotateLeft')}
          aria-label={t('rotateLeft')}
          onClick={() => rot((((imageRotation - 90) % 360) + 360) % 360)}
        >
          ↺
        </button>
        <button type="button" className="vz-ib" title={t('rotateRight')} aria-label={t('rotateRight')} onClick={() => rot((imageRotation + 90) % 360)}>
          ↻
        </button>
        {imageRotation !== 0 && <span className="vz-pill">{imageRotation}°</span>}
        <Button onClick={() => setShowExport(true)}>{t('exportBtn')}</Button>
      </div>

      <div className="vz-ed">
        <Toolbar />
        <EditorCanvas
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPointMove={updatePoint}
          onAddPoint={addPoint}
          onDeletePoint={deletePoint}
          onToggleSegmentType={toggleSegmentType}
          centerTrigger={centerTrigger}
        />
        <PropertiesPanel selectedId={selectedId} onSegmentTypeChange={changeSegmentType} />
      </div>

      <StatusBar />

      {paths.length > 0 && (
        <div className="vz-paths glass">
          <span className="vz-muted vz-small">{t('savedPaths')}</span>
          {paths.map((path, i) => (
            <span key={i} className="vz-path-chip">
              <span className="vz-accent">{t('pathN', i + 1)}</span>
              <span className="vz-muted">({path.length} pts)</span>
              <button type="button" title={t('deletePath')} aria-label={`${t('deletePath')} ${i + 1}`} onClick={() => api.getState().removePathAt(i)}>
                ✕
              </button>
            </span>
          ))}
          <span className="vz-muted vz-small">{t('activePath', contourPoints.length)}</span>
        </div>
      )}

      <Dialog open={showExport} onClose={() => setShowExport(false)} title={t('exportTitle', allPaths.length)}>
        <div className="vz-dialog-col">
          <p className="vz-muted vz-small">{t('exportDesc', allPaths.length)}</p>
          <Button onClick={() => void doExport('DXF')}>{t('exportDxf')}</Button>
          <Button variant="ghost" onClick={() => void doExport('SVG')}>
            {t('exportSvg')}
          </Button>
          <Button variant="ghost" onClick={() => void doExport('PDF')}>
            {t('exportPdf')}
          </Button>
        </div>
      </Dialog>

      <Dialog open={showSuccess} onClose={() => setShowSuccess(false)} title={t('successTitle')}>
        <div className="vz-success">
          <div className="vz-success__check" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="vz-muted">
            {t('successA')}
            <strong className="vz-accent">{exportedFormat}</strong>
            {t('successB')}
          </p>
          <div className="vz-dialog-row">
            <Button onClick={() => setShowSuccess(false)}>{t('keepEditing')}</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowSuccess(false)
                setConfirmStart(true)
              }}
            >
              {t('goStart')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* M18: "Ir al inicio" pide confirmación */}
      <Dialog open={confirmStart} onClose={() => setConfirmStart(false)} title={t('goStart')}>
        <p className="vz-muted">{t('confirmNew')}</p>
        <div className="vz-dialog-row">
          <Button variant="ghost" onClick={() => setConfirmStart(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmStart(false)
              api.getState().reset()
            }}
          >
            {t('accept')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
