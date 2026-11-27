/** Diámetro del círculo del que sale el menú. */
export const ORB = 40
/** Nivel elegido por el dueño en el mockup (1.0 = base). */
export const MENU_INTENSITY = 0.4
const SPRING_K = 170
const SPRING_C = 8.2
const MAX_BULGE = 26

export type Spring = { p: number; v: number }

/** Un paso del resorte subamortiguado: pasa del círculo (0) al menú (1) pasándose un poco y vibrando. */
export function stepSpring({ p, v }: Spring, target: number, dt: number): Spring {
  const nv = v + (-SPRING_K * (p - target) - SPRING_C * v) * dt
  return { p: p + nv * dt, v: nv }
}

/** Cuánto se abomba cada borde según la velocidad del resorte (positivo = hacia afuera). */
export function bulges(v: number, panelW: number, panelH: number): { bx: number; by: number } {
  const clamp = (n: number) => Math.max(-MAX_BULGE, Math.min(MAX_BULGE, n))
  return {
    bx: clamp(v * (panelW - ORB) * 0.05 * MENU_INTENSITY),
    by: clamp(v * (panelH - ORB) * 0.05 * MENU_INTENSITY),
  }
}

/**
 * Contorno del menú en progreso `p`: rectángulo redondeado que crece desde el círculo hasta (panelW × panelH), con
 * los bordes derecho e inferior abombados (bx, by). Con p = 0 es el círculo.
 */
export function menuShapePath(p: number, bx: number, by: number, panelW: number, panelH: number): string {
  const q = Math.max(0, p)
  const w = ORB + (panelW - ORB) * q
  const h = ORB + (panelH - ORB) * q
  const r = 20 - 6 * Math.min(1, q)
  const f = (n: number) => n.toFixed(1)
  return (
    `M${f(r)} 0H${f(w - r)}Q${f(w)} 0 ${f(w)} ${f(r)}` +
    `Q${f(w + bx * 2)} ${f(h / 2)} ${f(w)} ${f(h - r)}` +
    `Q${f(w)} ${f(h)} ${f(w - r)} ${f(h)}` +
    `Q${f(w / 2)} ${f(h + by * 2)} ${f(r)} ${f(h)}` +
    `Q0 ${f(h)} 0 ${f(h - r)}V${f(r)}Q0 0 ${f(r)} 0Z`
  )
}

/** Opacidad del contenido: aparece cuando el cuadro ya casi tiene su tamaño. */
export function contentOpacity(p: number): number {
  return Math.max(0, Math.min(1, (p - 0.5) / 0.4))
}
