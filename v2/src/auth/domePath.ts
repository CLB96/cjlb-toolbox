/** Medidas del cuadro de inicio de sesión con la cúpula que rodea al logo (px). */
export const DOME = {
  /** Radio del semicírculo que sobresale arriba del cuadro. */
  radius: 74,
  /** Curva suave donde la cúpula se une con el borde superior. */
  fillet: 12,
  /** Igual que --radius-md. */
  corner: 12,
}

type Dome = typeof DOME

const n = (v: number) => Math.round(v * 100) / 100

/** Ancho mínimo para dibujar la cúpula sin que choque con las esquinas. */
export function domeMinWidth(d: Dome = DOME): number {
  return 2 * (Math.sqrt(d.radius * d.radius + 2 * d.radius * d.fillet) + d.corner)
}

/**
 * Contorno SVG del cuadro: rectángulo redondeado cuyo borde superior está a `radius`
 * px de la parte de arriba, con un semicírculo centrado que llega hasta arriba.
 * `inset` encoge el contorno hacia adentro (para el trazo del borde de 1 px).
 */
export function domePath(w: number, h: number, inset = 0, d: Dome = DOME): string {
  const { radius: R, fillet: f, corner } = d
  const i = inset
  const cx = w / 2
  const top = R + i
  const rc = corner - i
  const dx = Math.sqrt((R + f) * (R + f) - f * f)
  const fx = cx - dx
  const k = (R - i) / (R + f)
  const px = cx - dx * k
  const py = R - f * k
  const fr = f + i
  return [
    `M${n(i)},${n(top + rc)}`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(i + rc)},${n(top)}`,
    `L${n(fx)},${n(top)}`,
    `A${n(fr)},${n(fr)} 0 0 0 ${n(px)},${n(py)}`,
    `A${n(R - i)},${n(R - i)} 0 0 1 ${n(2 * cx - px)},${n(py)}`,
    `A${n(fr)},${n(fr)} 0 0 0 ${n(2 * cx - fx)},${n(top)}`,
    `L${n(w - i - rc)},${n(top)}`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(w - i)},${n(top + rc)}`,
    `L${n(w - i)},${n(h - i - rc)}`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(w - i - rc)},${n(h - i)}`,
    `L${n(i + rc)},${n(h - i)}`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(i)},${n(h - i - rc)}`,
    'Z',
  ].join(' ')
}
