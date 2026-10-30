import { GlassPanel } from '../../../ui/GlassPanel'
import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import { STATIC_TEXTS, useBondlineT } from '../i18n'
import type { AdhesiveCfg } from '../logic/activation'

interface SegProps<V extends string> {
  labelId: string
  value: V
  options: readonly V[]
  disabled: boolean
  onPick: (v: V) => void
}

function Seg<V extends 'waterbase' | 'hotmelt' | 'pcabs' | 'pp'>({ labelId, value, options, disabled, onPick }: SegProps<V>) {
  return (
    <div className="bl-seg" role="group" aria-labelledby={labelId}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`bl-seg__btn${value === o ? ' bl-seg__btn--on' : ''}`}
          aria-pressed={value === o}
          disabled={disabled}
          onClick={() => onPick(o)}
        >
          {STATIC_TEXTS[o]}
        </button>
      ))}
    </div>
  )
}

/** Materia Prima: adhesivo (cambia el cálculo) y sustrato (solo la flama). */
export function RawMaterial({ cfg, disabled }: { cfg: AdhesiveCfg; disabled: boolean }) {
  const t = useBondlineT()
  const api = useBondlineApi()
  const adhesive = useBondline((s) => s.config.adhesive)
  const substrate = useBondline((s) => s.config.substrate)
  const { setAdhesive, setSubstrate } = api.getState()

  return (
    <GlassPanel as="section" className="bl-card" aria-labelledby="bl-raw-title">
      <h2 id="bl-raw-title" className="bl-card__title">
        {t('rawMaterialTitle')}
      </h2>
      <div className="bl-group">
        <div className="bl-sub" id="bl-adhesive">
          {t('adhesiveSection')}
        </div>
        <Seg
          labelId="bl-adhesive"
          value={adhesive}
          options={['waterbase', 'hotmelt'] as const}
          disabled={disabled}
          onPick={setAdhesive}
        />
      </div>
      <div className="bl-info" data-testid="tempInfo">
        {t('adhesiveMin')}: <b>{cfg.min}°C</b> | {t('adhesiveMax')}: <b>{cfg.max}°C</b>
      </div>
      <div className="bl-group">
        <div className="bl-sub" id="bl-substrate">
          {t('substrateSection')}
        </div>
        <Seg
          labelId="bl-substrate"
          value={substrate}
          options={['pcabs', 'pp'] as const}
          disabled={disabled}
          onPick={setSubstrate}
        />
      </div>
      <div className="bl-info" data-testid="substrateInfo">
        {t('needsFlame')}: <b>{substrate === 'pp' ? t('flameYes') : t('flameNo')}</b>
      </div>
    </GlassPanel>
  )
}
