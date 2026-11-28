import { useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes } from 'react'
import './elasticSlider.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'min' | 'max' | 'value'> & {
  min: number
  max: number
  value: number
}

const STIFFNESS = 220
const DAMPING = 17
const STRETCH = 0.5
const REST = 0.0008

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Deslizador «líquido elástico»: el relleno y la perilla siguen al valor con un resorte, la perilla se estira según
 * la velocidad y la barra se ensancha mientras se arrastra. Debajo va un `<input type="range">` real (transparente),
 * así que el teclado, los lectores de pantalla y los eventos son los de siempre. Con «reducir movimiento» no hay resorte.
 */
export function ElasticSlider({ min, max, value, className = '', onPointerDown, onPointerUp, onPointerCancel, onBlur, ...rest }: Props) {
  const frac = (v: number) => (max === min ? 0 : (v - min) / (max - min))
  const target = frac(value)
  const [initial] = useState(target)
  const [dragging, setDragging] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const spring = useRef({ x: initial, v: 0, raf: 0, last: 0, target })
  spring.current.target = target

  useEffect(() => {
    const s = spring.current
    const paint = (stretch: number) => {
      root.current?.style.setProperty('--p', String(s.x))
      if (thumb.current) thumb.current.style.scale = stretch === 0 ? '' : `${1 + stretch} ${1 - stretch * 0.6}`
    }
    const tick = (t: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (t - s.last) / 1000 || 0.016)) // nunca negativo ni a saltos
      s.last = t
      s.v += ((s.target - s.x) * STIFFNESS - s.v * DAMPING) * dt
      s.x += s.v * dt
      if (Math.abs(s.target - s.x) > REST || Math.abs(s.v) > 0.01) {
        paint(Math.min(0.55, Math.abs(s.v) * STRETCH))
        s.raf = requestAnimationFrame(tick)
      } else {
        s.x = s.target
        s.v = 0
        s.raf = 0
        paint(0)
      }
    }
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
      s.x = s.target
      s.v = 0
      paint(0)
    } else if (!s.raf && s.x !== s.target) {
      s.last = performance.now()
      s.raf = requestAnimationFrame(tick)
    }
  }, [target])

  useEffect(() => () => cancelAnimationFrame(spring.current.raf), [])

  const end = () => setDragging(false)
  return (
    <div ref={root} className={`vz-sl ${className}`.trim()} data-on={dragging} style={{ '--p': initial } as CSSProperties}>
      <div className="vz-sl__trk">
        <div className="vz-sl__fill" />
      </div>
      <div ref={thumb} className="vz-sl__th" />
      <input
        type="range"
        className="vz-sl__in"
        min={min}
        max={max}
        value={value}
        onPointerDown={(e) => {
          setDragging(true)
          onPointerDown?.(e)
        }}
        onPointerUp={(e) => {
          end()
          onPointerUp?.(e)
        }}
        onPointerCancel={(e) => {
          end()
          onPointerCancel?.(e)
        }}
        onBlur={(e) => {
          end()
          onBlur?.(e)
        }}
        {...rest}
      />
    </div>
  )
}
