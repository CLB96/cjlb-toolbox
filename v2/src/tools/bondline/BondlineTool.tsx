import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { Dialog } from '../../ui/Dialog'
import { GlassPanel } from '../../ui/GlassPanel'
import { toast } from '../../ui/toastStore'
import type { ToolProps } from '../types'
import { BondlineStoreProvider, useBondlineApi } from './BondlineStoreProvider'
import { importWorkbook } from './importWorkbook'
import { fileReadErrorText } from './i18n'
import { invalidSheetText, type SheetResult } from './store'
import { useBondlineDefaults } from './useBondlineDefaults'
import { useBondlinePersistence } from './useBondlinePersistence'
import { BondlineDefaultsContext, useBondlineView } from './useBondlineView'
import { BondlineChart } from './components/Chart'
import { DefaultsDialog } from './components/DefaultsDialog'
import { EmptyState } from './components/EmptyState'
import { Events } from './components/Events'
import { Header } from './components/Header'
import { Kpis } from './components/Kpis'
import { Legend } from './components/Legend'
import { ProcessParams } from './components/ProcessParams'
import { RawMaterial } from './components/RawMaterial'
import { ResultBoxes } from './components/ResultBoxes'
import { TimeRange } from './components/TimeRange'
import './bondline.css'

interface Props {
  toolId: ToolProps['toolId']
  defaultsLoaded: boolean
  coolingTarget: number
}

function BondlineBody({ toolId, defaultsLoaded, coolingTarget }: Props) {
  const { t: tApp, lang } = useI18n()
  const api = useBondlineApi()
  const view = useBondlineView()
  const { lastSavedAt, restoreVersion, restored } = useBondlinePersistence()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [defaultsOpen, setDefaultsOpen] = useState(false)
  const disabled = !(restored && defaultsLoaded)

  const report = (r: SheetResult) => {
    if (!r.ok) toast('error', invalidSheetText(r.sheetName, r.reason, lang))
  }

  const onFile = async (picked: File) => {
    if (disabled) return
    let sheets
    try {
      sheets = await importWorkbook(picked)
    } catch {
      toast('error', fileReadErrorText(lang))
      return
    }
    // si la primera hoja no es válida el estado previo queda intacto (R10)
    report(api.getState().loadWorkbook(picked.name, sheets))
  }

  const onRestore = async (id: string) => {
    await restoreVersion(id)
    setHistoryOpen(false)
  }

  return (
    <div className="bl">
      <Header
        lastSavedAt={lastSavedAt}
        disabled={disabled}
        onFile={(f) => void onFile(f)}
        onSelectSheet={(i) => report(api.getState().selectSheet(i))}
        onDefaults={() => setDefaultsOpen(true)}
        onHistory={() => setHistoryOpen(true)}
      />
      {view ? (
        <>
          <div className="bl-bento">
            <Kpis kpis={view.kpis} />
            <ResultBoxes result={view.result} cooling={view.cooling} coolingTarget={coolingTarget} />
          </div>
          <div className="bl-main">
            <GlassPanel as="section" className="bl-chart-card">
              <BondlineChart view={view} disabled={disabled} />
              <Legend view={view} disabled={disabled} />
            </GlassPanel>
            <div className="bl-side">
              <RawMaterial cfg={view.cfg} disabled={disabled} />
              <TimeRange disabled={disabled} />
            </div>
          </div>
          <ProcessParams disabled={disabled} />
          <Events disabled={disabled} />
          {/* Layout plegable: Task 8 */}
        </>
      ) : (
        <EmptyState disabled={disabled} onFile={(f) => void onFile(f)} />
      )}
      <DefaultsDialog open={defaultsOpen} onClose={() => setDefaultsOpen(false)} />
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} title={tApp('persist.history')}>
        <HistoryPanel toolId={toolId} onRestore={onRestore} lastSavedAt={lastSavedAt} />
      </Dialog>
    </div>
  )
}

function BondlineWithDefaults({ toolId }: Pick<Props, 'toolId'>) {
  const defaults = useBondlineDefaults()
  return (
    <BondlineDefaultsContext.Provider value={defaults}>
      <BondlineBody
        toolId={toolId}
        defaultsLoaded={defaults.loaded}
        coolingTarget={defaults.defaults.coolingTarget}
      />
    </BondlineDefaultsContext.Provider>
  )
}

export default function BondlineTool({ toolId }: ToolProps) {
  return (
    <BondlineStoreProvider>
      <BondlineWithDefaults toolId={toolId} />
    </BondlineStoreProvider>
  )
}
