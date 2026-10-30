import type { ToolId } from '../app/routes'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'
import { useI18n } from '../i18n/useI18n'
import type { ResumeItem } from './resume'

type Props = {
  items: ResumeItem[]
  onContinue: (toolId: ToolId) => void
  onFresh: (toolId: ToolId) => void
}

export function ResumeSection({ items, onContinue, onFresh }: Props) {
  const { t } = useI18n()
  if (items.length === 0) return null
  return (
    <GlassPanel as="section" className="resume" aria-labelledby="resume-title">
      <h2 id="resume-title" className="resume__title">
        {t('home.resume.title')}
      </h2>
      <ul className="resume__list">
        {items.map((item) => (
          <li key={item.toolId} className="resume__item">
            <span className="resume__label">{item.label}</span>
            <span className="resume__ago">{item.ago}</span>
            <Button onClick={() => onContinue(item.toolId)}>
              {t('home.resume.continue')}
            </Button>
            <Button variant="ghost" onClick={() => onFresh(item.toolId)}>
              {t('home.resume.fresh')}
            </Button>
          </li>
        ))}
      </ul>
    </GlassPanel>
  )
}
