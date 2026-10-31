// Guía de Lectura (generateReadingGuide / _drawGuide): lienzo de trabajo de 1600x6000 recortado a la altura real.
import { fontsReady, newCanvas, stamp, triggerDownload, type ExportEnv } from '../exportEnv'
import { paintNebulaBackground } from '../nebulaKit'
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

  paintNebulaBackground(c, W, H, isDark)

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
