import { useState } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { useI18n } from '../i18n/useI18n'
import { getTool } from './registry'
import type { ToolProps } from './types'

const LEGACY_BASE_URL: string = import.meta.env.VITE_LEGACY_BASE_URL ?? ''

export default function Placeholder({ toolId }: ToolProps) {
  const { lang, t } = useI18n()
  const [count, setCount] = useState(0)
  const tool = getTool(toolId)
  const name = lang === 'en' ? tool.nameEn : tool.nameEs
  const legacyUrl = LEGACY_BASE_URL ? `${LEGACY_BASE_URL}${tool.url}` : ''

  return (
    <GlassPanel as="section" aria-label={name}>
      <h2>
        {tool.icon} {name}
      </h2>
      <p>{t('shell.migrating')}</p>
      <Button variant="ghost" onClick={() => setCount((c) => c + 1)}>
        {t('shell.counter')}: <span data-testid={`counter-${toolId}`}>{count}</span>
      </Button>
      {legacyUrl && (
        <p>
          <a href={legacyUrl}>{t('shell.openCurrent')}</a>
        </p>
      )}
    </GlassPanel>
  )
}
