import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { Dialog } from '../../ui/Dialog'
import { GlassPanel } from '../../ui/GlassPanel'
import { toast } from '../../ui/toastStore'
import type { ToolProps } from '../types'
import { GapcheckStoreProvider, useGapcheck, useGapcheckApi } from './GapcheckStoreProvider'
import { useGapcheckPersistence } from './useGapcheckPersistence'
import { importExcelFile } from './importExcel'
import { useGapcheckT } from './i18n'
import { EmptyState } from './components/EmptyState'
import { Header, type LoadedFile } from './components/Header'
import { GapcheckChart } from './components/Chart'
import { DataTable } from './components/DataTable'
import { Filters } from './components/Filters'
import { Kpis } from './components/Kpis'
import { TargetPanel } from './components/TargetPanel'
import './gapcheck.css'

interface Props {
  toolId: ToolProps['toolId']
  /** Exportar PNG: lo conecta la Task 8. */
  onExport?: () => void
}

const noop = () => undefined

function GapcheckBody({ toolId, onExport = noop }: Props) {
  const t = useGapcheckT()
  const { t: tApp } = useI18n()
  const api = useGapcheckApi()
  const { lastSavedAt, restoreVersion, restored } = useGapcheckPersistence()
  const [historyOpen, setHistoryOpen] = useState(false)
  const file = useGapcheck(
    useShallow((s): LoadedFile | null =>
      s.points.length > 0
        ? { name: s.fileName ?? '', iterations: s.maxIter, points: s.points.length }
        : null,
    ),
  )
  const disabled = !restored

  const onFile = async (picked: File) => {
    if (!restored) return
    try {
      const rows = await importExcelFile(picked)
      // sin datos numéricos el original no hace nada (inventario §3)
      api.getState().loadRows(picked.name, rows)
    } catch {
      toast('error', t('importFailed'))
    }
  }

  const onRestore = async (id: string) => {
    await restoreVersion(id)
    setHistoryOpen(false)
  }

  return (
    <div className="gc">
      <Header
        file={file}
        lastSavedAt={lastSavedAt}
        disabled={disabled}
        onFile={(f) => void onFile(f)}
        onHistory={() => setHistoryOpen(true)}
        onExport={onExport}
      />
      {file ? (
        <>
          <Kpis />
          <div className="gc-main">
            <GlassPanel as="section" className="gc-card gc-chart-slot" aria-labelledby="gc-chart-title">
              <h2 id="gc-chart-title" className="gc-card__title">
                📊 {t('chart')}
              </h2>
              <Filters />
              <GapcheckChart />
            </GlassPanel>
            <TargetPanel disabled={disabled} />
          </div>
          <DataTable />
        </>
      ) : (
        <EmptyState disabled={disabled} onFile={(f) => void onFile(f)} />
      )}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} title={tApp('persist.history')}>
        <HistoryPanel toolId={toolId} onRestore={onRestore} lastSavedAt={lastSavedAt} />
      </Dialog>
    </div>
  )
}

export default function GapcheckTool({ toolId }: ToolProps) {
  return (
    <GapcheckStoreProvider>
      <GapcheckBody toolId={toolId} />
    </GapcheckStoreProvider>
  )
}
