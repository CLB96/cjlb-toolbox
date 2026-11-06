import { GlassPanel } from '../../../ui/GlassPanel'
import { useQn } from '../QnStoreProvider'
import { useQnT } from '../i18n'
import type { QnKey } from '../i18n'
import { completionMessage, planSummary, rotatePoints, selectedAngle, selectedLayout } from '../logic/plans'
import { formRequest } from '../useQnActions'
import { useQnFormat } from './common'
import { Drawing } from './Drawing'
import { PlanBox } from './PlanBox'

function Preview() {
  const t = useQnT()
  const result = useQn((s) => s.result)
  const viewGroup = useQn((s) => s.viewGroup)
  const form = useQn((s) => s.form)
  const imported = useQn((s) => s.imported)
  const selected = useQn((s) => s.selected)
  const previewId = useQn((s) => s.previewId)
  const revision = useQn((s) => s.revision)
  const empty = (key: QnKey) => <p className="qn-empty">{t(key)}</p>

  if (result) {
    const layout = selectedLayout(result, viewGroup)
    const request = formRequest(form)
    const width = layout?.width ?? request.width
    const length = layout?.length ?? request.length ?? NaN
    const margin = layout?.margin ?? 0
    if (!layout || !(width > 2 * margin) || !(length > 2 * margin)) return empty('status_no_fit')
    // La clave reinicia el zoom con cada resultado o grupo mostrado.
    const key = `r${revision}-${'key' in layout ? layout.key : ''}`
    return <Drawing key={key} pieces={layout.placements} width={width} length={Math.max(length, 1)} margin={margin} title={t('previewAria')} />
  }
  const contours = imported?.contours ?? []
  const pieces = previewId ? contours.filter((c) => c.id === previewId) : contours.filter((c) => selected.includes(c.id))
  if (!pieces.length) return empty('previewEmpty')
  const angle = form.rotation === 'fixed' ? selectedAngle(form.anglePreset, form.customAngle) : 0
  let offset = 0
  let height = 0
  const placed = pieces.map((p) => {
    const points = rotatePoints(p.points, Number.isFinite(angle) ? angle : 0)
    const w = Math.max(...points.map((q) => q[0]))
    height = Math.max(height, ...points.map((q) => q[1]))
    const shifted = points.map(([x, y]) => [x + offset, y])
    offset += w + Math.max(w * 0.05, 1)
    return { id: p.id, points: shifted }
  })
  return <Drawing key={`p${revision}`} pieces={placed} width={Math.max(offset, 1)} length={Math.max(height, 1)} title={t('previewAria')} />
}

export function LayoutPanel() {
  const t = useQnT()
  const format = useQnFormat()
  const result = useQn((s) => s.result)
  const layout = useQn((s) => selectedLayout(s.result, s.viewGroup))
  const hasPieces = useQn((s) => Boolean(s.previewId || s.selected.length))
  const status = result ? completionMessage(result) : null
  const viewTitle = result ? t('previewResult') : hasPieces ? t('previewPattern') : ''

  return (
    <GlassPanel as="section" className="qn-panel" aria-labelledby="qn-preview">
      <div className="qn-cab">
        <h3 id="qn-preview" className="qn-h">{t('preview')}</h3>
        <span className="qn-help">{viewTitle}</span>
      </div>
      {planSummary(result) && <PlanBox />}
      <div className="qn-drawing"><Preview /></div>
      <div className="qn-metrics">
        <div><b>{layout ? format(layout.count, 0) : '—'}</b><span>{t('perPly')}</span></div>
        <div><b>{layout ? `${format(layout.utilization)} %` : '— %'}</b><span>{t('utilization')}</span></div>
        <div><b>{layout ? `${format(layout.unusedArea / 1e6, 4)} m²` : '— m²'}</b><span>{t('unused')}</span></div>
      </div>
      {layout && (
        <p className="qn-help">{t('resultDetails', { gap: format(layout.gap), elapsed: format(layout.elapsed), missing: format(layout.missing || 0, 0) })}</p>
      )}
      {layout && (layout.margin ?? 0) > 0 && (
        <p className="qn-help">{t('marginDetails', { margin: format(layout.margin!), width: format(layout.usableWidth!), length: format(layout.usableLength!) })}</p>
      )}
      {status && <p className="qn-status">{t(status.key as QnKey, status.values)}</p>}
    </GlassPanel>
  )
}
