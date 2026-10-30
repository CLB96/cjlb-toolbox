import type { ReactNode } from 'react'
import { Tabs, type TabItem } from '../ui/Tabs'
import { Button } from '../ui/Button'
import { useTheme } from '../theme/useTheme'
import { useI18n } from '../i18n/useI18n'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'
import type { Route } from './routes'

type Props = {
  route: Route
  onNavigate: (r: Route) => void
  isAdmin?: boolean
  avatar?: ReactNode
  tools?: ToolDef[]
}

export function TopBar({ route, onNavigate, isAdmin = false, avatar, tools = TOOLS }: Props) {
  const { t, lang, setLang } = useI18n()
  const { resolved, setMode } = useTheme()

  const items: TabItem[] = [
    { id: 'home', label: t('shell.tab.home') },
    ...tools.map((d) => {
      const hold = d.status === 'hold'
      const name = lang === 'en' ? d.nameEn : d.nameEs
      const holdLabel = lang === 'en' ? d.holdLabelEn : d.holdLabelEs
      return { id: d.id, label: hold ? `${name} · ${holdLabel}` : name, disabled: hold }
    }),
    ...(isAdmin ? [{ id: 'usage', label: t('shell.tab.usage') }] : []),
  ]

  return (
    <header className="topbar glass">
      <img
        className="topbar__logo"
        src={resolved === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
        alt="CJLB"
        height={32}
      />
      <Tabs items={items} value={route} onChange={(id) => onNavigate(id as Route)} />
      <div className="topbar__actions">
        <Button
          variant="ghost"
          aria-label={t('shell.lang.toggle')}
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </Button>
        <Button
          variant="ghost"
          aria-label={t('shell.theme.toggle')}
          onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
        >
          {resolved === 'dark' ? '☀' : '☾'}
        </Button>
        {avatar}
      </div>
    </header>
  )
}
