import { useTheme } from '../../../theme/useTheme'
import { useBondline } from '../BondlineStoreProvider'
import { useBondlineT } from '../i18n'
import { useBondlineDefaultsCtx, type BondlineView } from '../useBondlineView'
import { TC_COLORS } from '../logic/types'

interface Props {
  view: BondlineView
  disabled: boolean
}

/**
 * Colores literales de las anotaciones (R7) para que la leyenda coincida con lo dibujado;
 * el original usaba --amber/--cyan/--purple, que no existen en los tokens del toolbox.
 */
function legendColors(hotmelt: boolean, dark: boolean) {
  const lc = hotmelt
    ? dark ? 'rgba(248,184,79,1)' : 'rgba(245,158,11,1)'
    : dark ? 'rgba(34,211,238,1)' : 'rgba(6,182,212,1)'
  const gc = dark ? 'rgba(89,201,127,' : 'rgba(67,179,107,'
  const purple = dark ? 'rgba(167,139,250,1)' : 'rgba(139,92,246,1)'
  return { lc, windowBg: gc + '0.08)', windowBorder: gc + '0.45)', purple }
}

/** Leyenda propia del original (inventario §5D) con Ocultar/Mostrar por TC. */
export function Legend({ view, disabled }: Props) {
  const t = useBondlineT()
  const { resolved } = useTheme()
  const tcVisibility = useBondline((s) => s.config.tcVisibility)
  const adhesive = useBondline((s) => s.config.adhesive)
  const toggleTC = useBondline((s) => s.toggleTC)
  const { defaults } = useBondlineDefaultsCtx()
  const colors = legendColors(adhesive === 'hotmelt', resolved === 'dark')
  const reset = tcVisibility.length !== view.trimmed.length

  return (
    <div className="bl-legend" data-testid="bl-legend">
      {view.trimmed.map((_, i) => {
        const visible = reset || tcVisibility[i]
        return (
          <div key={i} className={`bl-legend__item bl-legend__tc${visible ? '' : ' bl-legend__item--hidden'}`} data-tc={i}>
            <span className="bl-legend__line" style={{ background: TC_COLORS[i % TC_COLORS.length] }} />
            TC-{i + 1}
            <button
              type="button"
              className={`bl-legend__toggle${visible ? '' : ' bl-legend__toggle--hidden'}`}
              disabled={disabled}
              onClick={() => toggleTC(i)}
            >
              {visible ? t('hideTC') : t('showTC')}
            </button>
          </div>
        )
      })}
      <div className="bl-legend__item">
        <span className="bl-legend__dash" style={{ borderColor: colors.lc }} />
        {t('legendLimits')}
      </div>
      <div className="bl-legend__item">
        <span className="bl-legend__box" style={{ background: colors.windowBg, borderColor: colors.windowBorder }} />
        {t('legendWindow')}
      </div>
      {view.cooling.hasCoolingEvents && (
        <div className="bl-legend__item">
          <span className="bl-legend__dash" style={{ borderColor: colors.purple }} />
          🎯 Cooling {defaults.coolingTarget}°C
        </div>
      )}
    </div>
  )
}
