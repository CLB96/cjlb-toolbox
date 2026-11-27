import { useState } from 'react'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT, type VzKey } from '../../i18n'
import { pieceLabel } from '../../logic/pieces'
import type { ToolId } from '../../types'
import { Icon, type IconName } from '../icons'

const TOOLS: { id: ToolId; icon: IconName; label: VzKey }[] = [
  { id: 'select', icon: 'select', label: 'toolSelect' },
  { id: 'edit-point', icon: 'edit', label: 'toolEdit' },
  { id: 'segment-type', icon: 'segment', label: 'toolSegment' },
  { id: 'add-point', icon: 'add', label: 'toolAdd' },
  { id: 'delete-point', icon: 'eraser', label: 'toolDelete' },
  { id: 'measure', icon: 'measure', label: 'toolMeasure' },
]

/** Teclas de herramienta (EditorCanvas.tsx:130-143). */
export const TOOL_KEYS: Record<string, ToolId> = {
  s: 'select',
  e: 'edit-point',
  a: 'add-point',
  d: 'delete-point',
  m: 'measure',
}

export function Toolbar() {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const activeToolId = useVectorizr((s) => s.activeToolId)
  const pieces = useVectorizr((s) => s.pieces)
  const activePieceId = useVectorizr((s) => s.activePieceId)
  const [confirmClear, setConfirmClear] = useState(false)
  const index = Math.max(0, pieces.findIndex((p) => p.id === activePieceId))
  const name = pieces[index] ? pieceLabel(pieces[index]!, index) : ''

  return (
    <div className="vz-tools glass" role="toolbar" aria-label={t('toolsLabel')} aria-orientation="vertical">
      {TOOLS.map(({ id, icon, label }) => (
        <button
          key={id}
          type="button"
          title={t(label)}
          aria-label={t(label)}
          aria-pressed={activeToolId === id}
          className={`vz-ib${activeToolId === id ? ' is-on' : ''}`}
          onClick={() => api.getState().setActiveTool(id)}
        >
          <Icon name={icon} />
        </button>
      ))}
      <span className="vz-spacer" />
      <button type="button" className="vz-ib" title={t('undo')} aria-label={t('undo')} onClick={() => api.getState().undo()}>
        <Icon name="undo" />
      </button>
      <button type="button" className="vz-ib" title={t('redo')} aria-label={t('redo')} onClick={() => api.getState().redo()}>
        <Icon name="redo" />
      </button>
      <span className="vz-tools__line" />
      <button type="button" className="vz-ib vz-ib--danger" title={t('clearDrawing')} aria-label={t('clearDrawing')} onClick={() => setConfirmClear(true)}>
        <Icon name="trash" />
      </button>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title={t('clearTitle')}>
        <p className="vz-muted">{t('clearAsk', name)}</p>
        <div className="vz-dialog-row">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              api.getState().clearActivePiece()
              setConfirmClear(false)
            }}
          >
            {t('clearConfirm')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
