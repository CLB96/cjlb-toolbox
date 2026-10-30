import { useShallow } from 'zustand/react/shallow'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGapcheck, useGapcheckApi } from '../GapcheckStoreProvider'
import { useGapcheckT, type GapcheckKey } from '../i18n'
import { statusOf, type GapStatus } from '../logic/status'

const STATUS_VIEW: Record<GapStatus, { text: GapcheckKey; cls: string }> = {
  met: { text: 'statusMet', cls: 'gc-status--good' },
  warning: { text: 'statusWarning', cls: 'gc-status--warning' },
  notMet: { text: 'statusNotMet', cls: 'gc-status--danger' },
}

/** Tabla de datos colapsable (inventario §7): objetivo aplicado, puntos e iteraciones visibles. */
export function DataTable() {
  const t = useGapcheckT()
  const api = useGapcheckApi()
  const { points, visiblePoints, visibleIters, appliedTarget, tableOpen } = useGapcheck(
    useShallow((s) => ({
      points: s.points,
      visiblePoints: s.visiblePoints,
      visibleIters: s.visibleIters,
      appliedTarget: s.appliedTarget,
      tableOpen: s.tableOpen,
    })),
  )

  const pointSet = new Set(visiblePoints)
  const iterSet = new Set(visibleIters)
  const targetText = `${appliedTarget.toFixed(2)} mm`

  return (
    <GlassPanel as="section" className="gc-card gc-table-card" aria-labelledby="gc-table-title">
      <h2 id="gc-table-title" className="gc-card__title">
        <button
          type="button"
          className="gc-table-toggle"
          aria-expanded={tableOpen}
          aria-controls="gc-table-body"
          onClick={() => api.getState().setTableOpen(!tableOpen)}
        >
          <span aria-hidden="true">{tableOpen ? '▾' : '▸'}</span> 📋 {t('table')}
        </button>
      </h2>
      {tableOpen && (
        <div id="gc-table-body" className="gc-table-scroll" tabIndex={0}>
          <table className="gc-table">
            <thead>
              <tr>
                <th>{t('thPoint')}</th>
                <th>{t('thIteration')}</th>
                <th>{t('thValue')}</th>
                <th>{t('thTarget')}</th>
                <th>{t('thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {points.flatMap((point, i) =>
                !pointSet.has(i)
                  ? []
                  : point.values.flatMap((value, iter) => {
                      if (!iterSet.has(iter) || value === undefined || value === null) return []
                      const view = STATUS_VIEW[statusOf(value, appliedTarget)]
                      return [
                        <tr key={`${i}-${iter}`}>
                          <td className="gc-table__name">{point.name}</td>
                          <td>{iter + 1}</td>
                          <td className="gc-table__value">{`${value}`}</td>
                          <td>{targetText}</td>
                          <td>
                            <span className={`gc-status ${view.cls}`}>{t(view.text)}</span>
                          </td>
                        </tr>,
                      ]
                    }),
              )}
            </tbody>
          </table>
        </div>
      )}
    </GlassPanel>
  )
}
