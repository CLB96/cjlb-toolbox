import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ToolId } from '../app/routes'
import { useRoute } from '../app/useRoute'
import { useSession } from '../auth/session'
import { greetingName } from '../auth/greeting'
import { useI18n } from '../i18n/useI18n'
import { flushAll } from '../persistence/flushRegistry'
import { startFresh } from '../persistence/freshStart'
import { latestPerTool, type SnapshotMeta } from '../persistence/snapshotStore'
import { useUid } from '../persistence/uidContext'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'
import { Button } from '../ui/Button'
import { toast } from '../ui/toastStore'
import { saveBadge, useToolBadges } from './badgeService'
import type { CardEdit } from './CardEditor'
import { applyBadges, type Badge } from './customize'
import { ResumeSection } from './ResumeSection'
import { ToolCard } from './ToolCard'
import { buildResumeItems } from './resume'
import { useCardDrag } from './useCardDrag'
import { useHomeOrder } from './useHomeOrder'
import './home.css'

type PendingFocus = { id: string; delta: number }

/** Tras mover con flechas, el foco vuelve a la flecha de la misma tarjeta (o a la otra si quedó deshabilitada). */
function focusArrow(grid: HTMLElement | null, { id, delta }: PendingFocus) {
  const card = grid?.querySelector(`[data-tool-id="${id}"]`)
  const arrow =
    card?.querySelector<HTMLButtonElement>(`[data-move="${delta}"]:not(:disabled)`) ??
    card?.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)')
  arrow?.focus()
}

export function HomePage({ tools = TOOLS }: { tools?: ToolDef[] }) {
  const { t, lang } = useI18n()
  const { navigate } = useRoute()
  const session = useSession()
  const uid = useUid()
  const [metas, setMetas] = useState<SnapshotMeta[]>([])
  const [editing, setEditing] = useState(false)
  const isAdmin = session?.isAdmin ?? false
  const badges = useToolBadges(session !== null)
  const withBadges = useMemo(() => applyBadges(tools, badges), [tools, badges])
  const { ordered, move, drop, reset } = useHomeOrder(uid, withBadges)
  const drag = useCardDrag(drop)
  const gridRef = useRef<HTMLElement>(null)
  const pendingFocus = useRef<PendingFocus | null>(null)

  useEffect(() => {
    let cancelled = false
    // los efectos de los hijos corren antes: se espera a que la herramienta saliente guarde
    flushAll()
      .then(() => latestPerTool(uid))
      .then((list) => {
        if (!cancelled) setMetas(list)
      })
      .catch(() => {
        if (!cancelled) toast('error', t('home.resume.loadFailed'))
      })
    return () => {
      cancelled = true
    }
    // t cambia con el idioma; la lista solo depende del usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    pendingFocus.current = null
    focusArrow(gridRef.current, pending)
  }, [ordered])

  const fresh = useCallback(
    async (toolId: ToolId) => {
      try {
        await startFresh(uid, toolId)
      } catch {
        toast('error', t('home.resume.freshFailed'))
        return
      }
      navigate(toolId)
    },
    [uid, navigate, t],
  )

  const changeBadge = (toolId: string, badge: Badge) => {
    saveBadge(toolId, badge).catch(() => toast('error', t('home.customize.badgeSaveFailed')))
  }

  const editFor = (tool: ToolDef, index: number): CardEdit => ({
    index,
    total: ordered.length,
    onMove: (delta) => {
      pendingFocus.current = { id: tool.id, delta }
      move(tool.id, delta)
    },
    onBadge: isAdmin ? (badge) => changeBadge(tool.id, badge) : undefined,
    drag: drag.propsFor(tool.id),
    isDragging: drag.dragId === tool.id,
    isTarget: drag.targetId === tool.id,
  })

  const items = buildResumeItems(metas, Date.now(), lang, tools)
  const name = session ? greetingName(session.user) : ''

  return (
    <div className="home">
      <header className="home__hero">
        <h1 className="home__greeting">{t('home.greeting', { name })}</h1>
        <p className="home__subtitle">{t('home.subtitle')}</p>
      </header>
      <ResumeSection items={items} onContinue={navigate} onFresh={fresh} />
      <div className="home__bar">
        {editing && (
          <p className="home__hint">
            {t('home.customize.hint')}
            {isAdmin && ` ${t('home.customize.hintAdmin')}`}
          </p>
        )}
        {editing && (
          <Button variant="ghost" onClick={reset}>
            {t('home.customize.reset')}
          </Button>
        )}
        <Button variant={editing ? 'primary' : 'ghost'} onClick={() => setEditing((v) => !v)}>
          {t(editing ? 'home.customize.done' : 'home.customize.open')}
        </Button>
      </div>
      <section ref={gridRef} className="home__grid" aria-label={t('shell.tab.home')}>
        {ordered.map((tool, index) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onOpen={(d) => navigate(d.id)}
            edit={editing ? editFor(tool, index) : undefined}
          />
        ))}
      </section>
    </div>
  )
}
