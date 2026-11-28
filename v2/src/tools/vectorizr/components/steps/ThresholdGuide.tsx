import { useVzT } from '../../i18n'

/** Guía de los umbrales de Canny (semi automático). */
export function ThresholdGuide() {
  const { t } = useVzT()
  return (
    <div className="vz-guide">
      <p className="vz-guide__title">{t('guideTitle')}</p>
      <p>
        <b>{t('guideLowLabel')}</b>
        {t('guideLow')}
      </p>
      <p>
        <b>{t('guideHighLabel')}</b>
        {t('guideHigh')}
      </p>
    </div>
  )
}
