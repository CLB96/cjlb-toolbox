import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Tabs, type TabItem } from '../ui/Tabs'
import { Button } from '../ui/Button'
import { useTheme } from '../theme/useTheme'
import { useI18n } from '../i18n/useI18n'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'
import type { Route } from './routes'
import type { BarMode } from './useHeaderMode'
import { useElasticMenu } from './useElasticMenu'
import './header.css'

type Props = {
  route: Route
  onNavigate: (r: Route) => void
  isAdmin?: boolean
  avatar?: ReactNode
  tools?: ToolDef[]
  mode?: BarMode
}

export function TopBar({ route, onNavigate, isAdmin = false, avatar, tools = TOOLS, mode = 'full' }: Props) {
  const { t, lang, setLang } = useI18n()
  const { resolved, setMode } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const barRef = useRef<HTMLElement>(null)
  const shapeRef = useRef<SVGSVGElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isCircle = mode === 'col'
  const open = menuOpen && isCircle
  useElasticMenu(open, isCircle, { shape: shapeRef, content: contentRef })

  // el menú del círculo se cierra con Escape, al tocar fuera o al elegir una herramienta
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

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
    <header
      ref={barRef}
      className={`topbar glass topbar--${mode}${open ? ' topbar--open' : ''}`}
      data-mode={mode}
    >
      <svg ref={shapeRef} className="topbar__shape" aria-hidden="true">
        <defs>
          <linearGradient id="topbar-shape-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent-1)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <g transform="translate(-1 -1)">
          <path className="topbar__shape-grad" fill="url(#topbar-shape-gradient)" />
          <path className="topbar__shape-solid" />
        </g>
      </svg>
      <button
        type="button"
        className="topbar__orb"
        aria-label={t('shell.menu')}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={!isCircle}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <img src={resolved === 'dark' ? '/logo-dark.png' : '/logo-light.png'} alt="CJLB" height={32} />
      </button>
      <div ref={contentRef} className="topbar__full">
        <Tabs
          items={items}
          value={route}
          onChange={(id) => {
            setMenuOpen(false)
            onNavigate(id as Route)
          }}
        />
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
      </div>
    </header>
  )
}
