// Resumen comparativo (generateComparativeSummary): una o más páginas PNG de 2400x1440.
import { exportPalette, fontsReady, loadImage, localDate, newCanvas, triggerDownload, type ExportEnv, type ProjectExportData } from './exportEnv'
import { summaryDrawMiniHist } from './summaryMiniHist'
import { summaryDrawPhoto, summaryDrawTable } from './summaryParts'

const W = 2400, H = 1440
const HEADER_H = 68, FOOTER_H = 32, PAD = 40, GAP = 16
const L_X = PAD, L_W = 820
const R_X = L_X + L_W + GAP
const R_W = W - R_X - PAD
const CONTENT_Y = HEADER_H + 12
const CONTENT_H = H - CONTENT_Y - FOOTER_H - PAD
const PHOTO_H = Math.round(CONTENT_H * 0.47)
const TABLE_Y = CONTENT_Y + PHOTO_H + GAP
const TABLE_H = H - TABLE_Y - FOOTER_H - PAD
const HIST_COLS = 4
const CELL_W = Math.floor(R_W / HIST_COLS)
const MAX_PER_PAGE = 24

/** Reparto equilibrado entre páginas (máx. 24 análisis por página). */
export function splitPages<T>(order: T[]): T[][] {
  const pages = Math.ceil(order.length / MAX_PER_PAGE)
  const base = Math.floor(order.length / pages)
  const extra = order.length % pages
  const out: T[][] = []
  let start = 0
  for (let p = 0; p < pages; p++) {
    const cnt = base + (p < extra ? 1 : 0)
    out.push(order.slice(start, start + cnt))
    start += cnt
  }
  return out
}

/** Devuelve los DataURL de cada página (vacío si no hay análisis). */
export async function buildSummaryPages(data: ProjectExportData, env: ExportEnv): Promise<string[]> {
  const order = data.points
  if (order.length === 0) return []
  await fontsReady()
  const { isDark, lang, t } = env
  const P = exportPalette(isDark)
  const cpkColor = (v: number | null) => (v === null ? P.accent : v >= 1.33 ? P.green : v >= 1.0 ? P.yellow : P.red)

  const perPage = splitPages(order)
  const pages = perPage.length
  const photoImg = await loadImage(data.photo)
  const dateStr = localDate(lang)
  const projName = data.projectName.trim()
  const dataURLs: string[] = []

  for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
    const pageOrder = perPage[pageIdx]!
    const rows = Math.ceil(pageOrder.length / HIST_COLS)
    const CELL_H = Math.min(Math.floor(CONTENT_H / rows), CELL_W)
    const { cv, c } = newCanvas(W, H)

    c.fillStyle = P.bg; c.fillRect(0, 0, W, H)
    const m1 = c.createRadialGradient(300, 300, 0, 300, 300, 900)
    m1.addColorStop(0, isDark ? 'rgba(0,80,180,0.13)' : 'rgba(100,160,255,0.08)')
    m1.addColorStop(1, 'transparent')
    c.fillStyle = m1; c.fillRect(0, 0, W, H)

    c.fillStyle = P.headerBg; c.fillRect(0, 0, W, HEADER_H)
    c.beginPath(); c.moveTo(0, HEADER_H); c.lineTo(W, HEADER_H)
    c.strokeStyle = P.border; c.lineWidth = 1.5; c.stroke()

    const lg = c.createLinearGradient(PAD, 10, PAD + 48, 58)
    lg.addColorStop(0, P.accent); lg.addColorStop(1, P.accent2)
    c.beginPath(); c.roundRect(PAD, 10, 48, 48, 10); c.fillStyle = lg; c.fill()
    c.font = '800 26px system-ui,sans-serif'; c.fillStyle = '#050d2a'
    c.textAlign = 'center'; c.fillText('C', PAD + 24, 44)

    c.font = '700 26px system-ui,sans-serif'; c.fillStyle = P.text
    c.textAlign = 'left'; c.fillText('CapaFlow', PAD + 62, 38)
    c.font = '400 13px ui-monospace,monospace'; c.fillStyle = P.textSub
    c.fillText(t('summary.subtitle'), PAD + 62, 57)

    c.textAlign = 'right'
    c.font = '500 13px ui-monospace,monospace'; c.fillStyle = P.textDim
    c.fillText(dateStr, W - PAD, 34)
    if (pages > 1) {
      c.font = '700 13px ui-monospace,monospace'; c.fillStyle = P.accent
      c.fillText(`${t('summary.page')} ${pageIdx + 1} ${t('summary.page.of')} ${pages}`, W - PAD, 55)
    }
    if (projName) {
      c.font = '600 13px ui-monospace,monospace'; c.fillStyle = P.textSub
      c.textAlign = 'center'; c.fillText(t('summary.project') + ' ' + projName, W / 2, 42)
    }

    summaryDrawPhoto(c, L_X, CONTENT_Y, L_W, PHOTO_H, photoImg, P, order, data.markers, cpkColor, env)
    summaryDrawTable(c, L_X, TABLE_Y, L_W, TABLE_H, order, P, cpkColor, env)

    pageOrder.forEach((p, i) => {
      const col = i % HIST_COLS
      const row = Math.floor(i / HIST_COLS)
      summaryDrawMiniHist(c, R_X + col * CELL_W, CONTENT_Y + row * CELL_H, CELL_W - 2, CELL_H - 2, p.result, order.indexOf(p) + 1, P, cpkColor, env)
    })

    const footY = H - FOOTER_H - 4
    c.beginPath(); c.moveTo(PAD, footY); c.lineTo(W - PAD, footY)
    c.strokeStyle = P.borderLight; c.lineWidth = 1; c.stroke()
    c.font = '400 12px ui-monospace,monospace'; c.fillStyle = P.textDim
    const es = lang === 'es'
    const ptLabel = es
      ? `${order.length} punto${order.length !== 1 ? 's' : ''} de medición`
      : `${order.length} measurement point${order.length !== 1 ? 's' : ''}`
    c.textAlign = 'left'; c.fillText(t('summary.footer'), PAD, footY + 18)
    c.textAlign = 'right'; c.fillText(ptLabel, W - PAD, footY + 18)

    dataURLs.push(cv.toDataURL('image/png', 1.0))
    await new Promise((res) => setTimeout(res, 0))
  }
  return dataURLs
}

/** Descarga las páginas con 600 ms entre cada una y devuelve el mensaje de éxito del original. */
export function downloadSummaryPages(urls: string[], env: ExportEnv): string {
  const pages = urls.length
  urls.forEach((url, i) => {
    setTimeout(() => triggerDownload(url, `CapaFlow_Resumen${pages > 1 ? `_Pag${i + 1}` : ''}.png`), i * 600)
  })
  const es = env.lang === 'es'
  return pages > 1
    ? `${env.t('summary.done')} (${pages} ${es ? `página${pages > 1 ? 's' : ''}` : `page${pages > 1 ? 's' : ''}`})`
    : env.t('summary.done')
}
