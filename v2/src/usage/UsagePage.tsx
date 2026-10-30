import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'
import { useSession } from '../auth/session'
import { AccessRequestsPanel } from '../access/AccessRequestsPanel'
import { TOOLS } from '../tools/registry'
import { TOOL_IDS } from '../app/routes'
import { aggregateUsage, type UserUsage } from './aggregate'
import { fetchSessions, type SessionDoc } from './usageService'
import { UsageChart } from './UsageChart'

type Filter = 'week' | 'month' | 'range'
type Period = { from: number; to: number }

const DAY_MS = 86_400_000
const FILTERS: Filter[] = ['week', 'month', 'range']

const isoDay = (ms: number): string => {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const startOfDay = (iso: string): number => new Date(`${iso}T00:00:00`).getTime()

export function UsagePage() {
  const { t, lang } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const session = useSession()
  const [filter, setFilter] = useState<Filter>('week')
  const [fromDay, setFromDay] = useState(() => isoDay(Date.now() - 7 * DAY_MS))
  const [toDay, setToDay] = useState(() => isoDay(Date.now()))
  const [sessions, setSessions] = useState<SessionDoc[] | null>(null)
  const [failed, setFailed] = useState(false)

  const period = useMemo<Period | null>(() => {
    if (filter === 'range') {
      const from = startOfDay(fromDay)
      const to = startOfDay(toDay) + DAY_MS
      return Number.isNaN(from) || Number.isNaN(to) || to <= from ? null : { from, to }
    }
    const now = Date.now()
    return { from: now - (filter === 'week' ? 7 : 30) * DAY_MS, to: now + DAY_MS }
  }, [filter, fromDay, toDay])

  useEffect(() => {
    if (!period) return
    let stale = false
    setSessions(null)
    setFailed(false)
    fetchSessions(period.from, period.to).then(
      (rows) => {
        if (!stale) setSessions(rows)
      },
      () => {
        if (stale) return
        setFailed(true)
        toast('error', tRef.current('usage.loadFailed'))
      },
    )
    return () => {
      stale = true
    }
  }, [period])

  const summary = useMemo(() => aggregateUsage(sessions ?? []), [sessions])
  const toolName = useCallback(
    (id: string) => {
      const def = TOOLS.find((d) => d.id === id)
      return def ? (lang === 'es' ? def.nameEs : def.nameEn) : id
    },
    [lang],
  )
  const chartTools = useMemo(() => TOOL_IDS.filter((id) => summary.byTool[id] !== undefined), [summary])
  const labels = useMemo(() => chartTools.map(toolName), [chartTools, toolName])
  const hours = useMemo(() => chartTools.map((id) => summary.byTool[id] ?? 0), [chartTools, summary])

  const breakdown = (u: UserUsage): string =>
    TOOL_IDS.filter((id) => u.byTool[id] !== undefined)
      .map((id) => `${toolName(id)} ${u.byTool[id]}`)
      .join(' · ')
  const lastSeen = (ms: number): string => (ms ? new Date(ms).toLocaleString(lang) : '')

  async function exportExcel() {
    try {
      const XLSX = await import('xlsx')
      const header = (['name', 'email', 'hours', 'lastSeen', 'tools'] as const).map((k) => t(`usage.col.${k}`))
      const rows = summary.users.map((u) => [u.name, u.email, u.totalHours, lastSeen(u.lastSeen), breakdown(u)])
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([header, ...rows]), 'Uso')
      XLSX.writeFile(book, `cjlb-uso-${isoDay(Date.now())}.xlsx`)
    } catch {
      toast('error', t('usage.exportFailed'))
    }
  }

  return (
    <GlassPanel as="section" className="usage-page">
      <h2>{t('usage.title')}</h2>
      <div className="usage-filters">
        {FILTERS.map((f) => (
          <Button key={f} variant={filter === f ? 'primary' : 'ghost'} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {t(`usage.filter.${f}`)}
          </Button>
        ))}
        {filter === 'range' && (
          <>
            <label>
              {t('usage.from')} <input type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
            </label>
            <label>
              {t('usage.to')} <input type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
            </label>
          </>
        )}
        <Button variant="ghost" onClick={() => void exportExcel()} disabled={summary.users.length === 0}>
          {t('usage.export')}
        </Button>
      </div>

      {failed ? (
        <p role="alert">{t('usage.loadFailed')}</p>
      ) : sessions === null ? (
        <p>{t('usage.loading')}</p>
      ) : summary.users.length === 0 ? (
        <p>{t('usage.empty')}</p>
      ) : (
        <>
          <div className="usage-table-wrap">
            <table className="usage-table">
              <thead>
                <tr>
                  <th>{t('usage.col.name')}</th>
                  <th>{t('usage.col.email')}</th>
                  <th>{t('usage.col.hours')}</th>
                  <th>{t('usage.col.lastSeen')}</th>
                  <th>{t('usage.col.tools')}</th>
                </tr>
              </thead>
              <tbody>
                {summary.users.map((u) => (
                  <tr key={u.email}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.totalHours}</td>
                    <td>{lastSeen(u.lastSeen)}</td>
                    <td>{breakdown(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>{t('usage.chart.title')}</h3>
          <UsageChart labels={labels} hours={hours} title={t('usage.chart.title')} />
        </>
      )}

      {session && <AccessRequestsPanel adminEmail={session.user.email} />}
    </GlassPanel>
  )
}
