import { GlassPanel } from '../../../ui/GlassPanel'
import { useBondlineT, type BondlineKey } from '../i18n'
import type { KpiTexts } from '../logic/stats'

interface StatDef {
  id: string
  field: Exclude<keyof KpiTexts, 'activated'>
  chip: string
  tone: 'blue' | 'purple' | 'cyan' | 'red' | 'green'
  label: BondlineKey
}

/** #statsBar del original (inventario §4A): orden, chips y colores de chip. */
const STATS: StatDef[] = [
  { id: 'tc', field: 'tc', chip: 'TC', tone: 'blue', label: 'statThermocouples' },
  { id: 'duration', field: 'duration', chip: '⏱', tone: 'purple', label: 'statDuration' },
  { id: 'min', field: 'min', chip: '↓', tone: 'cyan', label: 'statMinTemp' },
  { id: 'max', field: 'max', chip: '↑', tone: 'red', label: 'statMaxTemp' },
  { id: 'activation', field: 'activation', chip: '⚡', tone: 'green', label: 'statActivation' },
]

export function Kpis({ kpis }: { kpis: KpiTexts }) {
  const t = useBondlineT()
  return (
    <>
      {STATS.map((s) => {
        const isActivation = s.id === 'activation'
        const tone = isActivation && !kpis.activated ? 'red' : s.tone
        const label = isActivation && !kpis.activated ? 'statNotReached' : s.label
        return (
          <GlassPanel key={s.id} className={`bl-kpi bl-kpi--${s.id}`}>
            <span className={`bl-kchip bl-kchip--${tone}`} aria-hidden="true">
              {s.chip}
            </span>
            <span className="bl-kpi__num" data-testid={`kpi-${s.id}`}>
              {kpis[s.field]}
            </span>
            <span className="bl-kpi__label">{t(label)}</span>
          </GlassPanel>
        )
      })}
    </>
  )
}
