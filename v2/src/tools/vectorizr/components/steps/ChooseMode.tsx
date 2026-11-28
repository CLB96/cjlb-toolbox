import { Button } from '../../../../ui/Button'
import { useVzT } from '../../i18n'
import { Icon } from '../icons'

interface Props {
  onAuto: () => void
  onManual: () => void
  onBack: () => void
}

/** Primera pantalla del paso Vectorizar: detección automática o trazado manual. */
export function ChooseMode({ onAuto, onManual, onBack }: Props) {
  const { t } = useVzT()
  return (
    <div className="vz-choose">
      <h2>{t('chooseTitle')}</h2>
      <div className="vz-cards">
        {[
          { icon: '🤖', title: t('autoTitle'), desc: t('autoDesc'), action: onAuto },
          { icon: '✏️', title: t('manualTitle'), desc: t('manualDesc'), action: onManual },
        ].map((opt) => (
          <button key={opt.icon} type="button" className="vz-card glass" onClick={opt.action}>
            <span className="vz-card__icon">{opt.icon}</span>
            <h3>{opt.title}</h3>
            <span className="vz-muted">{opt.desc}</span>
          </button>
        ))}
      </div>
      <Button variant="ghost" onClick={onBack}>
        <Icon name="back" inline />
        {t('back')}
      </Button>
    </div>
  )
}
