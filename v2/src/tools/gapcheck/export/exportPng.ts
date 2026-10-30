import type { Lang } from '../../../i18n/useI18n'
import { toast } from '../../../ui/toastStore'
import { GAPCHECK_TEXTS } from '../i18n'
import type { GapcheckState } from '../store'
import { drawExport } from './drawExport'
import { renderExportChart } from './exportChart'
import { buildExportModel } from './exportModel'

const LOGO_URL = `${import.meta.env.BASE_URL}logo-dark.png`
const FONTS = ['700 36px "Space Grotesk"', '500 16px Inter', '800 10px Inter', '900 16px Inter']

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    img.src = src
  })
}

async function loadBlobImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Espera a Space Grotesk/Inter antes de dibujar; si no cargan se usa la fuente de respaldo. */
async function waitForFonts(): Promise<void> {
  if (!document.fonts) return
  await Promise.all(FONTS.map((f) => document.fonts.load(f).catch(() => [])))
  await document.fonts.ready
}

function download(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function render(state: GapcheckState, lang: Lang, now: Date): Promise<void> {
  const model = buildExportModel(state, lang, now)
  if (!model) return
  await waitForFonts()
  const [layoutImage, logo] = await Promise.all([
    // como el original: si la imagen del layout no carga, se dibuja el resto sin su caja
    state.layout.image ? loadBlobImage(state.layout.image).catch(() => null) : Promise.resolve(null),
    loadImage(LOGO_URL).catch(() => null), // sin logo el PNG sigue siendo válido
  ])
  const chart = renderExportChart(state, lang)
  try {
    const canvas = drawExport(model, chart.canvas, layoutImage, logo)
    download(canvas.toDataURL('image/png'), model.fileName)
  } finally {
    chart.destroy()
  }
}

/**
 * Exportar PNG (inventario §9, diseño Nebulosa R5). `chartCanvas` es el canvas de la gráfica en
 * pantalla: solo sirve de guard (`if (!chart)` del original); la imagen se genera aparte con tema
 * oscuro (ver exportChart.ts).
 */
export async function exportGapcheckPng(
  state: GapcheckState,
  lang: Lang,
  chartCanvas: HTMLCanvasElement | null,
): Promise<void> {
  const texts = GAPCHECK_TEXTS[lang]
  if (!chartCanvas || !buildExportModel(state, lang, new Date())) {
    toast('warn', texts.exportNoData)
    return
  }
  try {
    await render(state, lang, new Date())
  } catch {
    toast('error', texts.exportFailed)
  }
}
