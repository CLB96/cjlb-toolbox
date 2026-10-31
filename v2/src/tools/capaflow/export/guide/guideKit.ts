// Paleta y utilidades de dibujo de la Guía de Lectura (_drawGuide, _wrapText).
type C = CanvasRenderingContext2D

export interface GuidePalette {
  bg: string; bg2: string; surface: string
  border: string; borderLight: string
  text: string; textSub: string; textDim: string
  accent: string; accent2: string; green: string; yellow: string; red: string
  orange: string; purple: string
  greenBg: string; yellowBg: string; redBg: string
  greenBd: string; yellowBd: string; redBd: string
}

const DARK: GuidePalette = {
  bg: '#160c2e', bg2: '#1d1240', surface: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.16)', borderLight: 'rgba(255,255,255,0.09)',
  text: '#efe9ff', textSub: '#b3a6d9', textDim: '#9a8fc0',
  accent: '#e2b4ff', accent2: '#72a8ff', green: '#59c97f', yellow: '#f8b84f', red: '#ff7683',
  orange: '#fb923c', purple: '#a78bfa',
  greenBg: 'rgba(89,201,127,0.14)', yellowBg: 'rgba(248,184,79,0.14)', redBg: 'rgba(255,118,131,0.14)',
  greenBd: 'rgba(89,201,127,0.40)', yellowBd: 'rgba(248,184,79,0.40)', redBd: 'rgba(255,118,131,0.40)',
}

const LIGHT: GuidePalette = {
  bg: '#fbf7ff', bg2: '#f3ecff', surface: 'rgba(255,255,255,0.78)',
  border: 'rgba(37,26,64,0.14)', borderLight: 'rgba(37,26,64,0.08)',
  text: '#251a40', textSub: '#6d6290', textDim: '#8a7fae',
  accent: '#8b3fd9', accent2: '#4f8cff', green: '#2f9e57', yellow: '#b07000', red: '#d93a4c',
  orange: '#c2410c', purple: '#7c3aed',
  greenBg: 'rgba(47,158,87,0.10)', yellowBg: 'rgba(176,112,0,0.10)', redBg: 'rgba(217,58,76,0.09)',
  greenBd: 'rgba(47,158,87,0.35)', yellowBd: 'rgba(176,112,0,0.35)', redBd: 'rgba(217,58,76,0.35)',
}

/** Parte el texto en líneas que caben en maxW (no cambia el texto). */
export function wrapText(ctx: C, text: string, maxW: number, font: string): string[] {
  ctx.font = font
  const lines: string[] = []
  let cur = ''
  text.split(' ').forEach((w) => {
    const test = cur + (cur ? ' ' : '') + w
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w } else cur = test
  })
  if (cur) lines.push(cur)
  return lines
}

export interface Guide {
  c: C
  P: GuidePalette
  isDark: boolean
  es: boolean
  W: number
  PAD: number
  VGAP: number
  rr(x: number, y: number, w: number, h: number, r2: number | number[], fill: string | null, stroke: string | null, sw?: number): void
  hl(x1: number, x2: number, y: number, col: string, w?: number): void
  txt(s: string, x: number, y: number, font: string, col: string, align?: CanvasTextAlign, mw?: number): void
  sectionTitle(title: string, sub: string, x: number, y: number, w: number, accent: string): void
  callout(icon: string, headline: string, body: string, x: number, y: number, w: number, accentCol: string, bgCol: string, bdCol: string): number
  /** Tarjetas de anotación a la derecha de una figura; devuelve la Y final. */
  annotations(items: { color: string; text: string }[], x: number, y: number, w: number, cardH: number, step: number, textW: number): number
}

export function createGuide(c: C, isDark: boolean, es: boolean, W: number): Guide {
  const P = isDark ? DARK : LIGHT
  const rr: Guide['rr'] = (x, y, w, h, r2, fill, stroke, sw = 1.5) => {
    c.beginPath(); c.roundRect(x, y, w, h, r2)
    if (fill) { c.fillStyle = fill; c.fill() }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke() }
  }
  const hl: Guide['hl'] = (x1, x2, y, col, w = 1) => { c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.strokeStyle = col; c.lineWidth = w; c.stroke() }
  const txt: Guide['txt'] = (s, x, y, font, col, align = 'left', mw = 0) => {
    c.font = font; c.fillStyle = col; c.textAlign = align
    if (mw) c.fillText(s, x, y, mw)
    else c.fillText(s, x, y)
  }
  const sectionTitle: Guide['sectionTitle'] = (title, sub, x, y, W2, accent) => {
    rr(x, y, W2, 56, 12, isDark ? `rgba(${accent || '226,180,255'},0.06)` : 'rgba(255,255,255,0.7)', isDark ? `rgba(${accent || '226,180,255'},0.15)` : P.border, 1.5)
    rr(x, y, 4, 56, [2, 0, 0, 2], isDark ? `rgba(${accent || '226,180,255'},0.9)` : `rgba(${accent || '139,63,217'},0.9)`, null)
    txt(title, x + 20, y + 26, '700 24px "Space Grotesk", Inter, sans-serif', P.text, 'left')
    if (sub) txt(sub, x + 20, y + 44, '400 16px Inter, sans-serif', P.textSub, 'left')
  }
  const callout: Guide['callout'] = (icon, headline, body, x, y, w, accentCol, bgCol, bdCol) => {
    const lineH = 22
    const bodyLines = wrapText(c, body, w - 80, '400 18px Inter, sans-serif')
    const totalH = 20 + 24 + 8 + bodyLines.length * lineH + 20
    rr(x, y, w, totalH, 12, bgCol, bdCol, 1.5)
    rr(x, y, 4, totalH, [2, 0, 0, 2], accentCol, null)
    txt(icon, x + 20, y + 32, '26px Inter, sans-serif', accentCol, 'left')
    txt(headline, x + 50, y + 32, '700 20px "Space Grotesk", Inter, sans-serif', P.text, 'left')
    c.font = '400 18px Inter, sans-serif'; c.fillStyle = P.textSub
    bodyLines.forEach((line, i) => { c.fillText(line, x + 50, y + 58 + i * lineH) })
    return totalH + 12
  }
  const annotations: Guide['annotations'] = (items, x, y, w, cardH, step, textW) => {
    let yy = y
    items.forEach((item) => {
      rr(x, yy, w, cardH, 10, P.surface, P.borderLight, 1)
      rr(x, yy, 4, cardH, [2, 0, 0, 2], item.color, null)
      c.font = '400 16px Inter, sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left'
      wrapText(c, item.text, w - textW, '400 16px Inter, sans-serif').forEach((l, i) => c.fillText(l, x + 16, yy + 18 + i * 20))
      yy += step
    })
    return yy
  }
  return { c, P, isDark, es, W, PAD: 56, VGAP: 28, rr, hl, txt, sectionTitle, callout, annotations }
}
