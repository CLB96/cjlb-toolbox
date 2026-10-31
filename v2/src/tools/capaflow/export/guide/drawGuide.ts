// Guía de Lectura (generateReadingGuide / _drawGuide): lienzo de trabajo de 1600x6000 recortado a la altura real.
import { fontsReady, newCanvas, stamp, triggerDownload, type ExportEnv } from '../exportEnv'
import { createGuide } from './guideKit'
import { guideControlCharts, guideHeader, guideHistogramPpm, guideKeyNumbers } from './guideSectionsA'
import { guideCpVsTable, guideFooter, guideRunQqBox } from './guideSectionsB'

export const GUIDE_W = 1600
export const GUIDE_MAX_H = 6000

/** Dibuja la guía y devuelve el DataURL y el alto final del bitmap. */
export function drawGuide(env: ExportEnv): { dataUrl: string; height: number } {
  const { isDark, lang } = env
  const es = lang === 'es'
  const W = GUIDE_W, H = GUIDE_MAX_H
  const { cv, c } = newCanvas(W, H)
  const g = createGuide(c, isDark, es, W)
  const { P } = g

  c.fillStyle = P.bg; c.fillRect(0, 0, W, H)
  const m1 = c.createRadialGradient(200, 300, 0, 200, 300, 800)
  m1.addColorStop(0, isDark ? 'rgba(0,80,200,0.16)' : 'rgba(100,160,255,0.10)'); m1.addColorStop(1, 'transparent')
  c.fillStyle = m1; c.fillRect(0, 0, W, H)
  const m2 = c.createRadialGradient(W, H * 0.5, 0, W, H * 0.5, 900)
  m2.addColorStop(0, isDark ? 'rgba(0,200,150,0.08)' : 'rgba(60,120,200,0.06)'); m2.addColorStop(1, 'transparent')
  c.fillStyle = m2; c.fillRect(0, 0, W, H)
  c.save(); c.globalAlpha = isDark ? 0.02 : 0.01
  for (let i = 0; i < 6000; i++) {
    const v = 100 + Math.random() * 155 | 0
    c.fillStyle = `rgb(${v},${v},${v + 15})`
    c.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1)
  }
  c.restore()

  let Y = guideHeader(g)
  Y = guideKeyNumbers(g, Y)
  Y = guideHistogramPpm(g, Y)
  Y = guideControlCharts(g, Y)
  Y = guideCpVsTable(g, Y)
  Y = guideRunQqBox(g, Y)
  Y = guideFooter(g, Y)

  Y += 60
  const finalHeight = Math.min(Y, H)
  const out = newCanvas(W, finalHeight)
  out.c.drawImage(cv, 0, 0, W, finalHeight, 0, 0, W, finalHeight)
  return { dataUrl: out.cv.toDataURL('image/png', 1.0), height: finalHeight }
}

/** Descarga CapaFlow_Guia_Lectura|Reading_Guide_AAAA-MM-DD.png */
export async function downloadReadingGuide(env: ExportEnv): Promise<void> {
  await fontsReady()
  const { dataUrl } = drawGuide(env)
  triggerDownload(dataUrl, `CapaFlow_${env.lang === 'es' ? 'Guia_Lectura' : 'Reading_Guide'}_${stamp()}.png`)
}
