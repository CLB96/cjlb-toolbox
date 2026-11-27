import { useState } from 'react'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { toast } from '../../../../ui/toastStore'
import { useActionStatus } from '../../../../ui/useActionStatus'
import { useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { exportAllInOne, exportIndividual, type ExportFormat } from '../../logic/exportPieces'
import { pieceLabel } from '../../logic/pieces'
import { piecesNow } from '../../store'
import { Icon } from '../icons'

interface Props {
  open: boolean
  onClose: () => void
  /** Se llama tras exportar bien, con el formato. */
  onDone: (format: ExportFormat) => void
}

const FORMATS: ExportFormat[] = ['DXF', 'SVG', 'PDF']
/** La palomita se ve este rato antes de cerrar el diálogo. */
const DONE_VISIBLE_MS = 600

/** Diálogo de exportar: todo en un archivo (como siempre) o descarga individual por pieza. */
export function ExportDialog({ open, onClose, onDone }: Props) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const [view, setView] = useState<'all' | 'individual'>('all')
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(new Set())
  const [withNotches, setWithNotches] = useState(false)
  const action = useActionStatus()

  const pieces = open ? piecesNow(api.getState()) : []
  const totalPaths = pieces.reduce((n, p) => n + p.paths.length + (p.contourPoints.length > 1 ? 1 : 0), 0)
  const selected = pieces.filter((p) => !unchecked.has(p.id))
  const hasNotches = pieces.some((p) => p.notches.length > 0)

  function close() {
    action.reset()
    setView('all')
    setUnchecked(new Set())
    setWithNotches(false)
    onClose()
  }

  async function run(format: ExportFormat, individual: boolean) {
    const { scaleFactor } = api.getState()
    try {
      const ok = await action.run(`${individual ? 'ind' : 'all'}:${format}`, async () => {
        if (individual) await exportIndividual(format, selected, scaleFactor, withNotches)
        else await exportAllInOne(format, pieces, scaleFactor, withNotches)
        return true
      })
      if (!ok) return
    } catch {
      toast('error', t('errExport'))
      return
    }
    await new Promise((resolve) => setTimeout(resolve, DONE_VISIBLE_MS))
    close()
    onDone(format)
  }

  const toggle = (id: string) => setUnchecked((u) => new Set(u.has(id) ? [...u].filter((x) => x !== id) : [...u, id]))
  const allOn = selected.length === pieces.length

  const notchOption = hasNotches && (
    <>
      <label className="vz-opt">
        <input type="checkbox" checked={withNotches} onChange={(e) => setWithNotches(e.target.checked)} />
        {t('notchLayer')}
      </label>
      {withNotches && <p className="vz-muted vz-small">{t('notchLayerHint')}</p>}
    </>
  )

  return (
    <Dialog open={open} onClose={close} title={t('exportTitle', totalPaths)}>
      {view === 'all' ? (
        <div className="vz-dialog-col">
          <p className="vz-muted vz-small">{t('exportDesc', totalPaths)}</p>
          {notchOption}
          <Button status={action.statusOf('all:DXF')} onClick={() => void run('DXF', false)}>
            {t('exportDxf')}
          </Button>
          <Button variant="ghost" status={action.statusOf('all:SVG')} onClick={() => void run('SVG', false)}>
            {t('exportSvg')}
          </Button>
          <Button variant="ghost" status={action.statusOf('all:PDF')} onClick={() => void run('PDF', false)}>
            {t('exportPdf')}
          </Button>
          {pieces.length > 1 && (
            <Button variant="ghost" onClick={() => setView('individual')}>
              {t('exportIndividual')}
            </Button>
          )}
        </div>
      ) : (
        <div className="vz-dialog-col">
          <p className="vz-muted vz-small">{t('individualDesc')}</p>
          {notchOption}
          <label className="vz-opt">
            <input type="checkbox" checked={allOn} onChange={() => setUnchecked(allOn ? new Set(pieces.map((p) => p.id)) : new Set())} />
            {t('selectAll')}
          </label>
          {pieces.map((p, i) => (
            <label className="vz-opt" key={p.id}>
              <input type="checkbox" checked={!unchecked.has(p.id)} onChange={() => toggle(p.id)} />
              {pieceLabel(p, i)}
            </label>
          ))}
          <div className="vz-dialog-row">
            {FORMATS.map((f, i) => (
              <Button
                key={f}
                variant={i === 0 ? 'primary' : 'ghost'}
                status={action.statusOf(`ind:${f}`)}
                disabled={selected.length === 0}
                onClick={() => void run(f, true)}
              >
                {t('formatCount', f, selected.length)}
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setView('all')}>
            <Icon name="back" inline />
            {t('back')}
          </Button>
        </div>
      )}
    </Dialog>
  )
}
