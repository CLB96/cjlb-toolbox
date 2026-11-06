import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { domeMinWidth, domePath } from './domePath'

type Size = { w: number; h: number }

type Props = {
  logoSrc: string
  children: ReactNode
}

/** Desplazamiento y desenfoque de la sombra, como el box-shadow de .glass. */
const SHADOW_Y = 8
const SHADOW_BLUR = 30
const BLEED = 60

function useSize(ref: RefObject<HTMLElement>): Size | null {
  const [size, setSize] = useState<Size | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** Cuadro de inicio de sesión cuyo borde sube en semicírculo alrededor del logo. */
export function DomeCard({ logoSrc, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref)
  const maskId = `dome-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const shape = size && size.w >= domeMinWidth() ? domePath(size.w, size.h) : null

  return (
    <div ref={ref} className="auth-dome">
      <GlassPanel
        className={`auth-card auth-card--dome${shape ? ' auth-card--shaped' : ''}`}
        style={shape ? { clipPath: `path('${shape}')` } : undefined}
      >
        <img className="auth-card__logo auth-card__logo--dome" src={logoSrc} alt="CJLB" height={120} />
        {children}
      </GlassPanel>
      {shape && size && (
        <svg className="auth-dome__edge" width={size.w} height={size.h} aria-hidden="true" data-testid="dome-edge">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-BLEED} y={-BLEED} width={size.w + 2 * BLEED} height={size.h + 2 * BLEED}>
              <rect x={-BLEED} y={-BLEED} width={size.w + 2 * BLEED} height={size.h + 2 * BLEED} fill="white" />
              <path d={shape} fill="black" />
            </mask>
            <filter id={`${maskId}-blur`} filterUnits="userSpaceOnUse" x={-BLEED} y={-BLEED} width={size.w + 2 * BLEED} height={size.h + 2 * BLEED}>
              <feGaussianBlur stdDeviation={SHADOW_BLUR / 2} />
            </filter>
          </defs>
          <g mask={`url(#${maskId})`}>
            <path d={shape} transform={`translate(0 ${SHADOW_Y})`} style={{ fill: 'var(--shadow)' }} filter={`url(#${maskId}-blur)`} />
          </g>
          <path d={domePath(size.w, size.h, 0.5)} style={{ fill: 'none', stroke: 'var(--edge)' }} />
        </svg>
      )}
    </div>
  )
}
