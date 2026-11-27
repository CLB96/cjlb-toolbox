import { useRef, type ButtonHTMLAttributes } from 'react'
import { useFingerDent } from './useFingerDent'
import './fingerDent.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', type = 'button', children, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const primary = variant === 'primary'
  useFingerDent(ref, primary)
  return (
    <button ref={ref} type={type} className={`btn btn--${variant} ${className}`.trim()} {...rest}>
      {children}
      {primary && <span className="btn__ring" aria-hidden="true" />}
    </button>
  )
}
