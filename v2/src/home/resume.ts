import type { ToolId } from '../app/routes'
import type { Lang } from '../i18n/useI18n'
import type { SnapshotMeta } from '../persistence/snapshotStore'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'

export type ResumeItem = { toolId: ToolId; label: string; ago: string }

const MAX_ITEMS = 3
const MIN_MS = 60_000
const HOUR_MS = 60 * MIN_MS
const DAY_MS = 24 * HOUR_MS

function relativeTime(elapsed: number, lang: Lang): string {
  const es = lang === 'es'
  if (elapsed < MIN_MS) return es ? 'hace un momento' : 'just now'
  if (elapsed < HOUR_MS) {
    const n = Math.floor(elapsed / MIN_MS)
    return es ? `hace ${n} min` : `${n} min ago`
  }
  if (elapsed < DAY_MS) {
    const n = Math.floor(elapsed / HOUR_MS)
    return es ? `hace ${n} h` : `${n} h ago`
  }
  const days = Math.floor(elapsed / DAY_MS)
  if (days < 2) return es ? 'ayer' : 'yesterday'
  return es ? `hace ${days} días` : `${days} days ago`
}

export function buildResumeItems(
  metas: SnapshotMeta[],
  now: number,
  lang: Lang,
  tools: ToolDef[] = TOOLS,
): ResumeItem[] {
  return [...metas]
    .sort((a, b) => b.savedAt - a.savedAt)
    .flatMap((m) => {
      const tool = tools.find((t) => t.id === m.toolId)
      if (!tool || tool.status === 'hold') return []
      return [
        {
          toolId: m.toolId,
          label: lang === 'es' ? tool.nameEs : tool.nameEn,
          ago: relativeTime(Math.max(0, now - m.savedAt), lang),
        },
      ]
    })
    .slice(0, MAX_ITEMS)
}
