import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'
import { toast } from '../../ui/toastStore'
import { useCapaApi } from './CapaflowStoreProvider'
import { buildSummaryPages, downloadSummaryPages } from './export/comparativeSummary'
import { downloadExecutivePng } from './export/executivePng'
import { fontsReady, makeExportEnv, type ProjectExportData } from './export/exportEnv'
import { downloadReadingGuide } from './export/guide/drawGuide'
import { downloadPlanPng } from './export/planPng'
import { downloadProjectZip } from './export/projectZip'
import { fill, useCapaT } from './i18n'
import { selectActive } from './store'

const errorText = (e: unknown): string => 'Error: ' + (e instanceof Error ? e.message : String(e))
const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

/** Las seis exportaciones de CapaFlow (fase 2b), con sus textos de estado y avisos del original. */
export function useCapaExports() {
  const api = useCapaApi()
  const { t, lang } = useCapaT()
  const { resolved } = useTheme()
  const es = lang === 'es'
  const env = makeExportEnv(lang, resolved === 'dark')
  const [executiveBusy, setExecutiveBusy] = useState(false)
  const [summaryBusy, setSummaryBusy] = useState(false)
  const [zipLabel, setZipLabel] = useState<string | null>(null)

  const projectData = (): ProjectExportData => {
    const s = api.getState()
    return { points: s.points, markers: s.markers, photo: s.photo, projectName: s.projectName }
  }

  const executive = async () => {
    const point = selectActive(api.getState())
    if (!point) {
      toast('warn', t('toast.noData'))
      return
    }
    toast('info', t('toast.generating'))
    setExecutiveBusy(true)
    await wait(80)
    try {
      await fontsReady()
      downloadExecutivePng(point.result, point.ccType, env)
      toast('ok', t('toast.ready'))
    } catch (e) {
      toast('error', errorText(e))
    } finally {
      setExecutiveBusy(false)
    }
  }

  const guide = async () => {
    toast('info', es ? 'Generando guía...' : 'Generating guide...')
    await wait(80)
    try {
      await downloadReadingGuide(env)
      toast('ok', es ? '¡Guía descargada!' : 'Guide downloaded!')
    } catch (e) {
      toast('error', errorText(e))
    }
  }

  const summary = async () => {
    const data = projectData()
    if (data.points.length === 0) {
      toast('info', t('v2.noSummary'))
      return
    }
    setSummaryBusy(true)
    try {
      const urls = await buildSummaryPages(data, env)
      toast('ok', downloadSummaryPages(urls, env))
    } catch (e) {
      toast('error', errorText(e))
    } finally {
      setSummaryBusy(false)
    }
  }

  const zip = async () => {
    const data = projectData()
    if (data.points.length === 0) return
    setZipLabel(es ? '⏳ Generando PNGs…' : '⏳ Generating PNGs…')
    toast('info', es ? 'Generando proyecto ZIP…' : 'Generating project ZIP…')
    try {
      const { folderName, failed } = await downloadProjectZip(data, env, setZipLabel)
      if (failed.length > 0) toast('warn', fill(t('v2.zipFailed'), { files: failed.join(', ') }))
      else toast('ok', es ? `✓ Proyecto "${folderName}" descargado` : `✓ Project "${folderName}" downloaded`)
    } catch (e) {
      toast('error', errorText(e))
    } finally {
      setZipLabel(null)
    }
  }

  const plan = async () => {
    try {
      if (await downloadPlanPng(projectData())) toast('ok', es ? '✓ Plano exportado' : '✓ Drawing exported')
    } catch (e) {
      toast('error', errorText(e))
    }
  }

  return { executive, guide, summary, zip, plan, executiveBusy, summaryBusy, zipLabel }
}
