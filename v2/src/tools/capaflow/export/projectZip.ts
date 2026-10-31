// Descargar Proyecto (ZIP) (generateProjectZip). JSZip 3.10.1, cargado bajo demanda.
import { buildSummaryPages } from './comparativeSummary'
import { drawExecutivePng } from './executivePng'
import { dataUrlToBase64, fontsReady, triggerDownload, type ExportEnv, type ProjectExportData } from './exportEnv'

export const DEFAULT_PROJECT_NAME = 'CapaFlow_Proyecto'

export const zipFolderName = (projectName: string): string =>
  (projectName.trim() || DEFAULT_PROJECT_NAME).replace(/[^a-zA-Z0-9_\-. ]/g, '_')

export const zipEntryName = (pos: number, pointName: string, es: boolean): string => {
  const raw = pointName ? pointName.replace(/[^a-zA-Z0-9_\- ]/g, '_') : (es ? `Analisis_${pos + 1}` : `Analysis_${pos + 1}`)
  return `${String(pos + 1).padStart(2, '0')}_${raw}.png`
}

export const summaryEntryName = (index: number, total: number): string =>
  total > 1 ? `00_Resumen_Comparativo_Pag${index + 1}.png` : '00_Resumen_Comparativo.png'

/** Construye el ZIP (sin descargarlo). Un PNG por análisis y el resumen; los fallos por análisis se tragan, como en el original. */
export async function buildProjectZip(data: ProjectExportData, env: ExportEnv, onProgress?: (text: string) => void): Promise<{ blob: Blob; folderName: string }> {
  const es = env.lang === 'es'
  const folderName = zipFolderName(data.projectName)
  await fontsReady()
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const folder = zip.folder(folderName)!

  for (let pos = 0; pos < data.points.length; pos++) {
    const p = data.points[pos]!
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          const dataURL = drawExecutivePng(p.result, p.ccType, env)
          if (dataURL) folder.file(zipEntryName(pos, p.result.pointName, es), dataUrlToBase64(dataURL), { base64: true })
        } catch (e) {
          console.error('PNG error idx', p.id, e)
        }
        resolve()
      }, 0)
    })
    onProgress?.(`⏳ ${pos + 1} / ${data.points.length}`)
  }

  onProgress?.(es ? '⏳ Generando resumen…' : '⏳ Generating summary…')
  try {
    const urls = await buildSummaryPages(data, env)
    urls.forEach((url, i) => folder.file(summaryEntryName(i, urls.length), dataUrlToBase64(url), { base64: true }))
  } catch (e) {
    console.error('Summary error', e)
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return { blob, folderName }
}

/** Genera y descarga `${carpeta}.zip`; devuelve el nombre de la carpeta (mensaje de éxito siempre, aunque falten archivos). */
export async function downloadProjectZip(data: ProjectExportData, env: ExportEnv, onProgress?: (text: string) => void): Promise<string> {
  const { blob, folderName } = await buildProjectZip(data, env, onProgress)
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${folderName}.zip`)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return folderName
}
