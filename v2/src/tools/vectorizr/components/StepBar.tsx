import { useVectorizr } from '../VectorizrStoreProvider'
import { useVzT } from '../i18n'

/** Indicador de los 4 pasos; las etiquetas ahora sí se ven (M17, bug #26). */
export function StepBar() {
  const { t } = useVzT()
  const step = useVectorizr((s) => s.step)
  const exported = useVectorizr((s) => s.exported)
  const labels = t('steps').split('|')
  return (
    <ol className="vz-stepper" aria-label={t('stepsLabel')}>
      {labels.map((label, i) => {
        const n = i + 1
        const isActive = n === step && !(n === 4 && exported)
        const isDone = n < step || (n === 4 && exported)
        const cls = ['vz-stp', isActive ? 'is-on' : '', isDone ? 'is-done' : ''].filter(Boolean).join(' ')
        return (
          <li key={n} className={cls} aria-current={isActive ? 'step' : undefined}>
            <b>{isDone ? '✓' : n}</b>
            <span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
