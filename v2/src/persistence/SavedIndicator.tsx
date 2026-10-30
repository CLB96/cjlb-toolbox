import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/useI18n'

const TICK_MS = 30_000

export function SavedIndicator({ lastSavedAt }: { lastSavedAt: number | null }) {
  const { t } = useI18n()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  if (lastSavedAt === null) return null
  const min = Math.max(0, Math.floor((now - lastSavedAt) / 60_000))
  return (
    <span className="saved-indicator" role="status">
      {min < 1 ? t('persist.savedJustNow') : t('persist.savedAgo', { min })}
    </span>
  )
}
