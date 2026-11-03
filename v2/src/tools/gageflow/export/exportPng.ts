/**
 * PNG del estudio (1600 px de ancho, 2x) para pegar en PowerPoint.
 * Se dibuja a mano para no depender de las gráficas montadas en pantalla.
 */
import type { ModeloPng } from './pngModel'
import { descargarBlob, nombreArchivo } from './descargar'

const W = 1600
const PAD = 64
const ESCALA = 2
const BLANCO = '#efe9ff'
const MUTED = '#b3a6d9'
const BORDE = 'rgba(255,255,255,.16)'
const CARTA = 'rgba(255,255,255,.06)'

function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function fondo(c: CanvasRenderingContext2D, alto: number) {
  const g = c.createLinearGradient(0, 0, 0, alto)
  g.addColorStop(0, '#2a1445')
  g.addColorStop(0.45, '#160c2e')
  g.addColorStop(1, '#07061a')
  c.fillStyle = g
  c.fillRect(0, 0, W, alto)
  const rad = c.createRadialGradient(W * 0.75, 0, 0, W * 0.75, 0, W * 0.7)
  rad.addColorStop(0, 'rgba(193,60,255,.28)')
  rad.addColorStop(1, 'rgba(193,60,255,0)')
  c.fillStyle = rad
  c.fillRect(0, 0, W, alto)
}

function texto(
  c: CanvasRenderingContext2D, s: string, x: number, y: number,
  fuente: string, color: string, alinear: CanvasTextAlign = 'left',
) {
  c.font = fuente
  c.fillStyle = color
  c.textAlign = alinear
  c.textBaseline = 'alphabetic'
  c.fillText(s, x, y)
}

export function altoPng(m: ModeloPng): number {
  return 96 + 140 + 128 + 60 + m.componentes.length * 42 + 40 +
    56 + (m.anova.length + 1) * 30 + 40 +
    56 + (m.operadores.length + 1) * 30 + 40 +
    56 + PAD / 2
}

export function dibujarPng(c: CanvasRenderingContext2D, m: ModeloPng): number {
  const alto = altoPng(m)
  fondo(c, alto)
  let y = 96

  // Cabecera
  texto(c, m.titulo, PAD, y, '700 36px "Space Grotesk", Inter, sans-serif', BLANCO)
  texto(c, m.subtitulo, PAD, y + 30, '400 20px Inter, sans-serif', MUTED)
  texto(c, m.fecha, W - PAD, y, '400 18px Inter, sans-serif', MUTED, 'right')
  y += 56

  // Veredicto
  c.fillStyle = CARTA
  rrect(c, PAD, y, W - PAD * 2, 116, 16)
  c.fill()
  c.strokeStyle = BORDE
  c.lineWidth = 1
  c.stroke()
  c.fillStyle = m.veredicto.color
  rrect(c, PAD, y, 8, 116, 4)
  c.fill()

  texto(c, m.veredicto.texto, PAD + 32, y + 46, '700 28px "Space Grotesk", Inter, sans-serif', m.veredicto.color)
  texto(c, m.veredicto.detalle, PAD + 32, y + 82, '400 18px Inter, sans-serif', MUTED)
  texto(c, m.veredicto.valor, W - PAD - 32, y + 68, '700 44px "Space Grotesk", Inter, sans-serif', m.veredicto.color, 'right')
  y += 140

  // KPIs
  const kw = (W - PAD * 2 - 18 * 3) / 4
  m.kpis.forEach((k, i) => {
    const x = PAD + i * (kw + 18)
    c.fillStyle = CARTA
    rrect(c, x, y, kw, 104, 14)
    c.fill()
    c.strokeStyle = BORDE
    c.stroke()
    texto(c, k.etiqueta.toUpperCase(), x + 18, y + 30, '500 14px Inter, sans-serif', MUTED)
    texto(c, k.valor, x + 18, y + 72, '700 34px "Space Grotesk", Inter, sans-serif', k.color)
    texto(c, k.nota, x + 18, y + 94, '400 14px Inter, sans-serif', MUTED)
  })
  y += 128

  // Componentes
  texto(c, m.etiquetas.componentes, PAD, y, '600 20px Inter, sans-serif', BLANCO)
  y += 32
  const barX = PAD + 300
  const barW = W - PAD * 2 - 300 - 170
  m.componentes.forEach((comp) => {
    texto(c, comp.etiqueta, PAD, y + 18, '400 17px Inter, sans-serif', BLANCO)
    c.fillStyle = 'rgba(255,255,255,.07)'
    rrect(c, barX, y + 6, barW, 16, 6)
    c.fill()
    c.fillStyle = comp.color
    rrect(c, barX, y + 6, Math.max(3, (Math.min(100, comp.pct) / 100) * barW), 16, 6)
    c.fill()
    texto(c, `${comp.mm} · ${comp.texto}`, W - PAD, y + 19, '400 15px Inter, sans-serif', MUTED, 'right')
    y += 42
  })
  y += 40

  // ANOVA
  texto(c, m.etiquetas.anova, PAD, y, '600 20px Inter, sans-serif', BLANCO)
  y += 30
  const colX = [PAD, PAD + 380, PAD + 470, PAD + 720, PAD + 960, PAD + 1140]
  const cabeceras = [
    m.etiquetas.fuente, m.etiquetas.gl, m.etiquetas.ss,
    m.etiquetas.ms, m.etiquetas.f, m.etiquetas.p,
  ]
  cabeceras.forEach((h, i) => {
    texto(c, h, i < 2 ? colX[i] : W - PAD - (5 - i) * 130, y, '600 14px Inter, sans-serif', MUTED,
      i < 2 ? 'left' : 'right')
  })
  y += 10
  c.strokeStyle = BORDE
  c.beginPath()
  c.moveTo(PAD, y)
  c.lineTo(W - PAD, y)
  c.stroke()
  y += 24
  m.anova.forEach((f) => {
    texto(c, f.fuente, colX[0], y, '400 16px Inter, sans-serif', BLANCO)
    texto(c, f.gl, colX[1], y, '400 16px Inter, sans-serif', MUTED, 'right')
    texto(c, f.ss, W - PAD - 520, y, '400 16px Inter, sans-serif', MUTED, 'right')
    texto(c, f.ms, W - PAD - 390, y, '400 16px Inter, sans-serif', MUTED, 'right')
    texto(c, f.f, W - PAD - 260, y, '400 16px Inter, sans-serif', MUTED, 'right')
    texto(c, f.p, W - PAD, y, '400 16px Inter, sans-serif', MUTED, 'right')
    y += 30
  })
  y += 40

  // Operadores
  texto(c, m.etiquetas.operadores, PAD, y, '600 20px Inter, sans-serif', BLANCO)
  y += 30
  m.operadores.forEach((o) => {
    texto(c, o.nombre, PAD, y, '400 16px Inter, sans-serif', BLANCO)
    texto(c, o.media, W - PAD - 300, y, '400 16px Inter, sans-serif', MUTED, 'right')
    texto(c, o.sesgo, W - PAD, y, '400 16px Inter, sans-serif', MUTED, 'right')
    y += 30
  })

  // Pie
  y += 40
  c.strokeStyle = BORDE
  c.beginPath()
  c.moveTo(PAD, y)
  c.lineTo(W - PAD, y)
  c.stroke()
  texto(c, m.pie, PAD, y + 28, '400 15px Inter, sans-serif', MUTED)
  texto(c, m.fecha, W - PAD, y + 28, '400 15px Inter, sans-serif', MUTED, 'right')

  return alto
}

export function crearCanvasPng(m: ModeloPng): HTMLCanvasElement {
  const alto = altoPng(m)
  const canvas = document.createElement('canvas')
  canvas.width = W * ESCALA
  canvas.height = Math.ceil(alto * ESCALA)
  const c = canvas.getContext('2d')
  if (!c) throw new Error('sin canvas 2d')
  c.scale(ESCALA, ESCALA)
  dibujarPng(c, m)
  return canvas
}

export async function exportarPng(m: ModeloPng, pieza: string): Promise<void> {
  const canvas = crearCanvasPng(m)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('no se pudo generar el PNG')
  descargarBlob(blob, nombreArchivo(pieza, 'png'))
}
