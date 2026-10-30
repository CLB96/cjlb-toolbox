import { useCallback, useEffect, useState } from 'react'
import type { ToolId } from '../app/routes'
import { useRoute } from '../app/useRoute'
import { useAuth } from '../auth/useAuth'
import { greetingName } from '../auth/greeting'
import { useI18n } from '../i18n/useI18n'
import { latestPerTool, markFreshStart, type SnapshotMeta } from '../persistence/snapshotStore'
import { useUid } from '../persistence/uidContext'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'
import { toast } from '../ui/toastStore'
import { ResumeSection } from './ResumeSection'
import { ToolCard } from './ToolCard'
import { buildResumeItems } from './resume'
import './home.css'

export function HomePage({ tools = TOOLS }: { tools?: ToolDef[] }) {
  const { t, lang } = useI18n()
  const { navigate } = useRoute()
  const { user } = useAuth()
  const uid = useUid()
  const [metas, setMetas] = useState<SnapshotMeta[]>([])

  useEffect(() => {
    let cancelled = false
    latestPerTool(uid)
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

  const fresh = useCallback(
    async (toolId: ToolId) => {
      try {
        await markFreshStart(uid, toolId)
      } catch {
        toast('error', t('home.resume.freshFailed'))
        return
      }
      navigate(toolId)
    },
    [uid, navigate, t],
  )

  const items = buildResumeItems(metas, Date.now(), lang, tools)
  const name = user ? greetingName(user) : ''

  return (
    <div className="home">
      <header className="home__hero">
        <h1 className="home__greeting">{t('home.greeting', { name })}</h1>
        <p className="home__subtitle">{t('home.subtitle')}</p>
      </header>
      <ResumeSection items={items} onContinue={navigate} onFresh={fresh} />
      <section className="home__grid" aria-label={t('shell.tab.home')}>
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onOpen={(d) => navigate(d.id)} />
        ))}
      </section>
    </div>
  )
}
