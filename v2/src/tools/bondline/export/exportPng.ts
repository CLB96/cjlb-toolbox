import type { Lang } from '../../../i18n/useI18n'
import { toast } from '../../../ui/toastStore'
import { translate } from '../i18n'
import { selectActiveSheet, type BondlineState } from '../store'
import { computeView } from '../useBondlineView'
import type { BondlineDefaults } from '../logic/types'
import { drawExport } from './drawExport'
import { renderExportChart } from './exportChart'
import { buildExportModel } from './exportModel'

const LOGO_URL = `${import.meta.env.BASE_URL}logo-dark.png`
const FONTS = ['700 42px "Space Grotesk"', '700 15px "Space Grotesk"', '14px Inter', '700 14px Inter', '800 12px Inter']

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

function download(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exportar PNG (inventario 7, diseño Nebulosa aprobado). Sin datos avisa y no hace nada; cualquier
 * fallo muestra el toast de error y la gráfica temporal siempre se destruye.
 */
export async function exportBondlinePng(
  state: BondlineState,
  defaults: BondlineDefaults,
  lang: Lang,
  now: Date = new Date(),
): Promise<void> {
  const data = selectActiveSheet(state)
  if (!data) {
    toast('warn', translate(lang, 'exportNoData'))
    return
  }
  try {
    const view = computeView(data, state.config, defaults, lang)
    const model = buildExportModel(state, view, defaults, lang, now)
    if (!model) {
      toast('warn', translate(lang, 'exportNoData'))
      return
    }
    await waitForFonts()
    const { image } = state.config.layout
    const [layoutImage, logo] = await Promise.all([
      // como el original: si la imagen del layout no carga se dibuja el resto sin su caja
      image ? loadBlobImage(image).catch(() => null) : Promise.resolve(null),
      loadImage(LOGO_URL).catch(() => null), // sin logo el PNG sigue siendo válido
    ])
    const chart = renderExportChart({
      view,
      tcVisibility: state.config.tcVisibility,
      adhesive: state.config.adhesive,
      defaults,
      totalRows: data.totalRows,
      lang,
    })
    try {
      const canvas = drawExport(model, chart.canvas, layoutImage, logo)
      download(canvas.toDataURL('image/png'), model.fileName)
    } finally {
      chart.destroy()
    }
  } catch {
    toast('error', translate(lang, 'exportFailed'))
  }
}
