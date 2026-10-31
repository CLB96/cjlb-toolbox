import { useEffect, useState } from 'react'
import { useVzT } from '../i18n'

const QUERY = '(orientation: portrait)'

/** Port de hooks/useOrientation.ts (con guarda para entornos sin matchMedia). */
export function useOrientation(): 'portrait' | 'landscape' {
  const read = () =>
    typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches ? 'portrait' : 'landscape'
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(read)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    const handler = () => setOrientation(read())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return orientation
}

/** Aviso "Rota tu dispositivo", dentro del área de la herramienta. */
export function RotatePrompt() {
  const { t } = useVzT()
  return (
    <div className="vz-rotate" role="alert">
      <div className="vz-rotate__icon">📱</div>
      <p>{t('rotate')}</p>
    </div>
  )
}
