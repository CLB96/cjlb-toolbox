import { useShallow } from 'zustand/react/shallow'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGapcheck } from '../GapcheckStoreProvider'
import { useGapcheckT, STATIC_TEXTS, type GapcheckKey } from '../i18n'
import type { KpiTexts } from '../logic/types'
import { selectKpis } from '../store'

interface StatDef {
  id: string
  field: keyof KpiTexts
  chip: string
  label: GapcheckKey
}

/** Orden y chips del original (inventario §4); sin unidades en las tarjetas. */
const STATS: StatDef[] = [
  { id: 'totalRecords', field: 'totalRecords', chip: 'PTS', label: 'points' },
  { id: 'avg', field: 'avg', chip: 'AVG', label: 'avgValue' },
  { id: 'min', field: 'min', chip: 'MIN', label: 'minValue' },
  { id: 'max', field: 'max', chip: 'MAX', label: 'maxValue' },
  { id: 'meeting', field: 'meeting', chip: 'OK', label: 'meetingTarget' },
]

/** Fila de 6: bloque GapCheck objetivo (aplicado) + PTS/AVG/MIN/MAX/OK. */
export function Kpis() {
  const t = useGapcheckT()
  const kpis = useGapcheck(useShallow(selectKpis))
  const appliedTarget = useGapcheck((s) => s.appliedTarget)
  const appliedCovering = useGapcheck((s) => s.appliedCovering)

  return (
    <section className="gc-kpis" aria-label={t('overview')}>
      <GlassPanel className="gc-kpi gc-kpi--target">
        <span className="gc-kpi__eyebrow">{STATIC_TEXTS.eyebrow}</span>
        <span className="gc-kpi__num" data-testid="kpi-target">
          {appliedTarget.toFixed(2)} <small>{STATIC_TEXTS.mm}</small>
        </span>
        <span className="gc-kpi__label">
          {appliedCovering === 'hard' ? STATIC_TEXTS.hard : STATIC_TEXTS.soft}
        </span>
      </GlassPanel>
      {STATS.map((s) => (
        <GlassPanel key={s.id} className={`gc-kpi gc-kpi--${s.id}`}>
          <span className={`gc-chip gc-chip--${s.chip.toLowerCase()}`}>{s.chip}</span>
          <span className="gc-kpi__num" data-testid={`kpi-${s.id}`}>
            {kpis[s.field]}
          </span>
          <span className="gc-kpi__label">{t(s.label)}</span>
        </GlassPanel>
      ))}
    </section>
  )
}
