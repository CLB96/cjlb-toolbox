import { useRef, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { useFingerDent } from './useFingerDent'
import { useMorphWidth } from './useMorphWidth'
import './fingerDent.css'
import './buttonStatus.css'

/** Estado de un botón que lanza trabajo: reposo, cargando (círculo con cargador) o listo (palomita). */
export type ButtonStatus = 'idle' | 'loading' | 'success'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  status?: ButtonStatus
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  status,
  onClick,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const primary = variant === 'primary'
  const hasStatus = status !== undefined
  const busy = status === 'loading' || status === 'success'
  useFingerDent(ref, primary)
  useMorphWidth(ref, hasStatus ? busy : undefined)
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // mientras trabaja o muestra la palomita no se vuelve a lanzar
    if (busy) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }
  return (
    <button
      ref={ref}
      type={type}
      className={`btn btn--${variant}${hasStatus ? ' btn--status' : ''} ${className}`.trim()}
      data-status={status}
      aria-busy={status === 'loading' ? true : undefined}
      onClick={handleClick}
      {...rest}
    >
      {hasStatus ? <span className="btn__label">{children}</span> : children}
      {hasStatus && (
        <>
          <span className="btn__spin" aria-hidden="true" />
          <svg className="btn__done" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" pathLength="1" />
          </svg>
        </>
      )}
      {primary && <span className="btn__ring" aria-hidden="true" />}
    </button>
  )
}
