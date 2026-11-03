/** PDF del estudio: la lámina del PNG + una página con el ANOVA. */
import { jsPDF } from 'jspdf'
import type { ModeloPng } from './pngModel'
import { dibujarPng, altoPng } from './exportPng'
import { descargarBlob, nombreArchivo } from './descargar'

const W = 1600

/** Dibuja el PNG en un canvas y devuelve su dataURL. */
function laminaDataUrl(m: ModeloPng): { url: string; ancho: number; alto: number } {
  const alto = altoPng(m)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = Math.ceil(alto)
  const c = canvas.getContext('2d')
  if (!c) throw new Error('sin canvas 2d')
  dibujarPng(c, m)
  return { url: canvas.toDataURL('image/png'), ancho: W, alto }
}

export function construirPdf(m: ModeloPng, pieza: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const { url, ancho, alto } = laminaDataUrl(m)

  // Página 1: la lámina completa, ajustada al ancho útil.
  const util = 190
  const h = (alto / ancho) * util
  doc.addImage(url, 'PNG', 10, 10, util, Math.min(h, 277))

  // Página 2: ANOVA en texto, por si se imprime en blanco y negro.
  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(m.etiquetas.anova, 10, 18)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  let y = 28
  const cols = [10, 95, 108, 140, 168, 186]
  const cabeceras = [
    m.etiquetas.fuente, m.etiquetas.gl, m.etiquetas.ss,
    m.etiquetas.ms, m.etiquetas.f, m.etiquetas.p,
  ]
  doc.setFont('helvetica', 'bold')
  cabeceras.forEach((c, i) => doc.text(c, cols[i], y, { align: i < 2 ? 'left' : 'right' }))
  doc.setFont('helvetica', 'normal')
  y += 6
  for (const f of m.anova) {
    doc.text(f.fuente, cols[0], y)
    doc.text(f.gl, cols[1], y, { align: 'right' })
    doc.text(f.ss, cols[2], y, { align: 'right' })
    doc.text(f.ms, cols[3], y, { align: 'right' })
    doc.text(f.f, cols[4], y, { align: 'right' })
    doc.text(f.p, cols[5], y, { align: 'right' })
    y += 6
  }

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text(m.etiquetas.operadores, 10, y)
  doc.setFont('helvetica', 'normal')
  y += 6
  for (const o of m.operadores) {
    doc.text(o.nombre, 10, y)
    doc.text(o.media, 140, y, { align: 'right' })
    doc.text(o.sesgo, 186, y, { align: 'right' })
    y += 6
  }

  doc.setFontSize(8)
  doc.text(m.pie, 10, 290)
  void pieza
  return doc
}

export function exportarPdf(m: ModeloPng, pieza: string): void {
  const doc = construirPdf(m, pieza)
  descargarBlob(doc.output('blob'), nombreArchivo(pieza, 'pdf'))
}
