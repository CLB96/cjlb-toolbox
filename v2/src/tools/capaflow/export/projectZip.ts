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

/** Construye el ZIP (sin descargarlo). Un PNG por análisis y el resumen; los archivos que fallen se listan en `failed` (C7). */
export async function buildProjectZip(data: ProjectExportData, env: ExportEnv, onProgress?: (text: string) => void): Promise<{ blob: Blob; folderName: string; failed: string[] }> {
  const es = env.lang === 'es'
  const folderName = zipFolderName(data.projectName)
  await fontsReady()
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const folder = zip.folder(folderName)!
  const failed: string[] = []

  for (let pos = 0; pos < data.points.length; pos++) {
    const p = data.points[pos]!
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          const dataURL = drawExecutivePng(p.result, p.ccType, env)
          if (dataURL) folder.file(zipEntryName(pos, p.result.pointName, es), dataUrlToBase64(dataURL), { base64: true })
          else failed.push(zipEntryName(pos, p.result.pointName, es))
        } catch (e) {
          console.error('PNG error idx', p.id, e)
          failed.push(zipEntryName(pos, p.result.pointName, es))
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
    failed.push(summaryEntryName(0, 1))
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return { blob, folderName, failed }
}

/** Genera y descarga `${carpeta}.zip`; devuelve el nombre de la carpeta y los archivos que no se pudieron generar. */
export async function downloadProjectZip(data: ProjectExportData, env: ExportEnv, onProgress?: (text: string) => void): Promise<{ folderName: string; failed: string[] }> {
  const { blob, folderName, failed } = await buildProjectZip(data, env, onProgress)
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${folderName}.zip`)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return { folderName, failed }
}
