// Exportar Plano PNG (exportPhotoWithMarkers): la foto a su tamaño natural con los marcadores colocados.
import { colorForCpk } from '../logic'
import { fontsReady, loadImage, newCanvas, stamp, triggerDownload, type ProjectExportData } from './exportEnv'

/** Dibuja el plano y devuelve el DataURL; null si no hay foto o no carga (el original sale en silencio). */
export async function drawPlanPng(data: ProjectExportData): Promise<string | null> {
  if (!data.photo) return null
  await fontsReady()
  const img = await loadImage(data.photo)
  if (!img) return null
  const W = img.naturalWidth, H = img.naturalHeight
  const { cv, c: ctx } = newCanvas(W, H)
  ctx.drawImage(img, 0, 0, W, H)

  const radius = Math.max(20, Math.min(W, H) * 0.028)
  const fontSize = radius * 0.9
  const labelFS = Math.max(11, radius * 0.72)

  data.points.forEach((p, i) => {
    const m = data.markers[p.id]
    if (!m) return
    const r = p.result
    const pos = i + 1
    const nm = r.pointName || `${pos}`
    // Quirk original: colorForCpk devuelve var(--...), que el canvas no entiende (el marcador queda con el color por defecto).
    const col = r.Cpk != null ? colorForCpk(r.Cpk) : '#00E5FF'
    const cx = m.x / 100 * W, cy = m.y / 100 * H

    ctx.save()
    ctx.shadowColor = col; ctx.shadowBlur = radius
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = col; ctx.fill()
    ctx.shadowBlur = 0
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = radius * 0.13; ctx.stroke()

    ctx.font = `800 ${fontSize}px system-ui,sans-serif`
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(String(pos), cx, cy)

    ctx.font = `600 ${labelFS}px ui-monospace,monospace`
    const tw = ctx.measureText(nm).width
    const lw = tw + 16, lh = labelFS + 10
    const lx = cx - lw / 2, ly = cy + radius + 5
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(lx, ly, lw, lh, 5)
    else ctx.rect(lx, ly, lw, lh)
    ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(nm, cx, ly + 5)
    ctx.restore()
  })

  return cv.toDataURL('image/png', 1.0)
}

/** Descarga CapaFlow_Plano_AAAA-MM-DD.png; false si no había foto. */
export async function downloadPlanPng(data: ProjectExportData): Promise<boolean> {
  const url = await drawPlanPng(data)
  if (!url) return false
  triggerDownload(url, `CapaFlow_Plano_${stamp()}.png`)
  return true
}
