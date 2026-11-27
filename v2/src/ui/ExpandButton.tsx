import { useEffect, useRef, useState, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react'
import { useFingerDent } from './useFingerDent'
import './expandButton.css'
import './fingerDent.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  /** Icono del círculo. Sin icono, si la etiqueta empieza con "+ " ese "+" es el icono. */
  icon?: ReactNode
}

/** Dedo o lápiz: no hay cursor que pase por encima, así que el botón se abre al tocarlo. */
const isTouch = (e: PointerEvent) => e.pointerType === 'touch' || e.pointerType === 'pen'

/** Cuánto se queda abierto después de tocar en pantallas táctiles. */
const TOUCH_OPEN_MS = 1500

/**
 * Botón de crear: en reposo es un círculo con su icono; se estira a una pastilla con el texto al pasar el cursor,
 * al enfocarlo con el teclado o al tocarlo. El texto siempre está en el DOM, así que su nombre accesible no cambia.
 */
export function ExpandButton({ label, icon, className = '', onPointerEnter, onPointerLeave, onPointerDown, onFocus, onBlur, ...rest }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  // si es un botón principal, también hunde su contorno bajo el dedo
  const primary = /btn--primary/.test(className)
  useFingerDent(ref, primary)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const plus = !icon && label.startsWith('+ ')
  const text = plus ? label.slice(1) : label
  const glyph = icon ?? (plus ? '+' : null)

  return (
    <button
      ref={ref}
      type="button"
      className={`xb${open ? ' xb--open' : ''} ${className}`.trim()}
      onPointerEnter={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e)
        if (!isTouch(e)) setOpen(true)
      }}
      onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(e)
        if (!isTouch(e)) setOpen(false)
      }}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(e)
        if (isTouch(e)) {
          setOpen(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setOpen(false), TOUCH_OPEN_MS)
        }
      }}
      onFocus={(e) => {
        onFocus?.(e)
        if (e.currentTarget.matches(':focus-visible')) setOpen(true)
      }}
      onBlur={(e) => {
        onBlur?.(e)
        setOpen(false)
      }}
      {...rest}
    >
      <span className="xb__icon">{glyph}</span>
      <span className="xb__label">{text}</span>
      {primary && <span className="btn__ring" aria-hidden="true" />}
    </button>
  )
}
