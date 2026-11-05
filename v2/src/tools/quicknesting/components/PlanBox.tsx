import { useQn } from '../QnStoreProvider'
import { useQnT } from '../i18n'
import { planSummary, selectedLayout, validGroupKey } from '../logic/plans'
import type { PlyGroup } from '../logic/types'
import { useQnFormat } from './common'

export function PlanBox() {
  const t = useQnT()
  const format = useQnFormat()
  const result = useQn((s) => s.result)
  const layout = useQn((s) => selectedLayout(s.result, s.viewGroup)) as PlyGroup | null
  const setViewGroup = useQn((s) => s.setViewGroup)
  const summary = planSummary(result)
  if (!summary || !result?.plyPlan) return null
  const groups = result.plyPlan.groups
  const completion = summary.inconsistent ? 'planInconsistent' : summary.complete ? 'planComplete' : 'planMissing'

  return (
    <div className="qn-plan">
      <h4 className="qn-h qn-h--sub">{t('planTitle')}</h4>
      <p>{t('planTotals', {
        pieces: format(summary.pieces, 0), requested: format(summary.requested, 0), layers: format(summary.layers, 0),
        full: format(summary.full, 0), partial: format(summary.partial, 0), length: format(summary.length / 1000, 3),
      })}</p>
      <p data-kind={summary.complete ? 'ok' : 'error'}>{t(completion, { missing: format(summary.missing, 0) })}</p>
      {summary.separatePatterns && <p className="qn-help">{t('separatePatterns')}</p>}
      <p className="qn-help">{t('separatePartial')}</p>
      {groups.length > 0 && (
        <label className="qn-field">
          <span>{t('planGroup')}</span>
          <select value={layout?.key ?? ''} onChange={(e) => setViewGroup(validGroupKey(result, e.target.value))}>
            {groups.map((g) => (
              <option key={g.key} value={g.key}>
                {t(g.kind === 'partial' ? 'partialGroup' : 'fullGroup', { layers: g.layers, patterns: g.patternIds.join(', ') })}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
