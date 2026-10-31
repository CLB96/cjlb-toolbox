import { useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { Dialog } from '../../ui/Dialog'
import type { ToolProps } from '../types'
import { CapaflowStoreProvider } from './CapaflowStoreProvider'
import { MwxDialog } from './components/MwxDialog'
import { Header } from './components/Header'
import { ProcessForm } from './components/ProcessForm'
import { ProjectBar } from './components/ProjectBar'
import { Results } from './components/Results'
import { useCapaExports } from './useCapaExports'
import { useCapaflowPersistence } from './useCapaflowPersistence'
import './capaflow.css'

function CapaflowBody({ toolId }: ToolProps) {
  const { t: tApp } = useI18n()
  const { lastSavedAt, restoreVersion, restored } = useCapaflowPersistence()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [mwxOpen, setMwxOpen] = useState(false)
  const exports = useCapaExports()
  const nameRef = useRef<HTMLInputElement>(null)
  const disabled = !restored

  const onRestore = async (id: string) => {
    await restoreVersion(id)
    setHistoryOpen(false)
  }

  return (
    <div className="cf" data-testid="capaflow">
      <Header
        lastSavedAt={lastSavedAt}
        disabled={disabled}
        onHistory={() => setHistoryOpen(true)}
        onExport={exports.executive}
        exportBusy={exports.executiveBusy}
        onGuide={exports.guide}
        onConverter={() => setMwxOpen(true)}
      />
      <ProjectBar
        disabled={disabled}
        onNewPoint={() => nameRef.current?.focus()}
        onSummary={exports.summary}
        onZip={exports.zip}
        summaryBusy={exports.summaryBusy}
        zipLabel={exports.zipLabel}
      />
      <div className="cf-layout">
        <ProcessForm ref={nameRef} disabled={disabled} />
        <Results disabled={disabled} onExportPlan={exports.plan} />
      </div>
      <MwxDialog open={mwxOpen} onClose={() => setMwxOpen(false)} />
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} title={tApp('persist.history')}>
        <HistoryPanel toolId={toolId} onRestore={onRestore} lastSavedAt={lastSavedAt} />
      </Dialog>
    </div>
  )
}

export default function CapaflowTool(props: ToolProps) {
  return (
    <CapaflowStoreProvider>
      <CapaflowBody {...props} />
    </CapaflowStoreProvider>
  )
}
