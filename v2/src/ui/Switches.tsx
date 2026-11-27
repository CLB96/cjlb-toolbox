import { useRef } from 'react'
import { useTheme } from '../theme/useTheme'
import { useI18n } from '../i18n/useI18n'
import './switches.css'

type Props = { size?: number }

/** Interruptor de tema "Day & Night": el sol rueda y se vuelve luna. Encendido = tema oscuro. */
export function ThemeSwitch({ size }: Props) {
  const { resolved, setMode } = useTheme()
  const { t } = useI18n()
  const night = resolved === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label={t('shell.theme.toggle')}
      className="tgl tgl--theme"
      style={size ? ({ '--h': `${size}px` } as React.CSSProperties) : undefined}
      onClick={() => setMode(night ? 'light' : 'dark')}
    >
      <span className="tgl__stars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="tgl__clouds" aria-hidden="true">
        <b />
        <b />
        <b />
      </span>
      <span className="tgl__knob" aria-hidden="true">
        <span className="tgl__rays" />
        <span className="tgl__bite" />
      </span>
    </button>
  )
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Interruptor de idioma con la misma mecánica: la perilla se desliza con un pequeño aplastamiento. Encendido = inglés. */
export function LangSwitch({ size }: Props) {
  const { lang, setLang, t } = useI18n()
  const pill = useRef<HTMLSpanElement>(null)
  const english = lang === 'en'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={english}
      aria-label={t('shell.lang.toggle')}
      className="tgl tgl--lang"
      style={size ? ({ '--h': `${size}px` } as React.CSSProperties) : undefined}
      onClick={() => {
        setLang(english ? 'es' : 'en')
        if (!reducedMotion() && pill.current?.animate) {
          pill.current.animate(
            [{ scale: '1 1' }, { scale: '1.3 0.82', offset: 0.3 }, { scale: '0.9 1.1', offset: 0.6 }, { scale: '1 1' }],
            { duration: 520 },
          )
        }
      }}
    >
      <span className="tgl__lbl" aria-hidden="true">
        ES
      </span>
      <span className="tgl__lbl" aria-hidden="true">
        EN
      </span>
      <span ref={pill} className="tgl__pill" aria-hidden="true">
        {english ? 'EN' : 'ES'}
      </span>
    </button>
  )
}
