// Piezas comunes del diseño Nebulosa en las exportaciones PNG de CapaFlow (mismos tokens que GapCheck/Bondline/Gantt).
type Ctx = CanvasRenderingContext2D

export const FONT_NUM = '"Space Grotesk", Inter, sans-serif'
export const FONT_TEXT = 'Inter, sans-serif'

/** Fuentes que deben estar cargadas antes de medir y dibujar (la tipografía no se carga hasta que se usa). */
export const NEBULA_FONT_SPECS = [
  '700 24px "Space Grotesk"', '800 36px "Space Grotesk"', '400 16px Inter', '500 16px Inter', '600 16px Inter',
]

/** Fondo Nebulosa oscuro (degradado radial violeta) o su variante clara. */
export function paintNebulaBackground(c: Ctx, w: number, h: number, isDark: boolean): void {
  const g = c.createRadialGradient(w * 0.8, 0, 0, w * 0.8, 0, Math.max(w, h))
  if (isDark) {
    g.addColorStop(0, '#3b1a5e'); g.addColorStop(0.55, '#160c2e'); g.addColorStop(1, '#07061a')
  } else {
    g.addColorStop(0, '#efe0ff'); g.addColorStop(0.55, '#fbf7ff'); g.addColorStop(1, '#f1ebfc')
  }
  c.fillStyle = g
  c.fillRect(0, 0, w, h)
}

/** Marca de CapaFlow: baldosa con el degradado violeta-azul de Nebulosa y la inicial. */
export function drawBrandMark(c: Ctx, x: number, y: number, size: number): void {
  const g = c.createLinearGradient(x, y, x + size, y + size)
  g.addColorStop(0, '#d16bff'); g.addColorStop(1, '#6a7bff')
  c.beginPath(); c.roundRect(x, y, size, size, size * 0.24)
  c.fillStyle = g; c.fill()
  c.font = `800 ${Math.round(size * 0.6)}px ${FONT_NUM}`
  c.fillStyle = '#ffffff'; c.textAlign = 'center'
  c.fillText('C', x + size / 2, y + size * 0.74)
}

const LOGO_TIMEOUT_MS = 400
const logos: Record<'dark' | 'light', HTMLImageElement | null> = { dark: null, light: null }
let logosLoading: Promise<void> | null = null

function loadLogo(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => resolve(null), LOGO_TIMEOUT_MS)
    img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth > 0 ? img : null) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = src
  })
}

/** Precarga (una sola vez) el logo real del toolbox, el mismo que usa la barra superior. Si falla, se usa la baldosa. */
export function preloadBrandLogos(): Promise<void> {
  logosLoading ??= Promise.all([
    loadLogo(`${import.meta.env.BASE_URL}logo-dark.png`),
    loadLogo(`${import.meta.env.BASE_URL}logo-light.png`),
  ]).then(([dark, light]) => { logos.dark = dark; logos.light = light })
  return logosLoading
}

/** Dibuja el logo (oscuro sobre exportación oscura, claro sobre clara) con altura `h`; devuelve el ancho ocupado. */
export function drawBrandLogo(c: Ctx, x: number, y: number, h: number, isDark: boolean): number {
  const img = logos[isDark ? 'dark' : 'light']
  if (!img || img.naturalHeight === 0) {
    drawBrandMark(c, x, y + (h - h * 0.74) / 2, h * 0.74)
    return h * 0.74
  }
  const w = (img.naturalWidth / img.naturalHeight) * h
  c.drawImage(img, x, y, w, h)
  return w
}
