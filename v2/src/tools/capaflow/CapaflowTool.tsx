import { useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { Dialog } from '../../ui/Dialog'
import type { ToolProps } from '../types'
import { CapaflowStoreProvider } from './CapaflowStoreProvider'
import { Header } from './components/Header'
import { ProcessForm } from './components/ProcessForm'
import { ProjectBar } from './components/ProjectBar'
import { Results } from './components/Results'
import { useCapaflowPersistence } from './useCapaflowPersistence'
import './capaflow.css'

/** Fase 2b: exportaciones (PNG ejecutivo, guía, resumen, ZIP, conversor, plano PNG). Botones cableados sin efecto. */
const todoPhase2b = (): void => {
  // TODO(fase 2b): implementar la exportación correspondiente.
}

function CapaflowBody({ toolId }: ToolProps) {
  const { t: tApp } = useI18n()
  const { lastSavedAt, restoreVersion, restored } = useCapaflowPersistence()
  const [historyOpen, setHistoryOpen] = useState(false)
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
        onExport={todoPhase2b}
        onGuide={todoPhase2b}
        onConverter={todoPhase2b}
      />
      <ProjectBar disabled={disabled} onNewPoint={() => nameRef.current?.focus()} onSummary={todoPhase2b} onZip={todoPhase2b} />
      <div className="cf-layout">
        <ProcessForm ref={nameRef} disabled={disabled} />
        <Results disabled={disabled} onExportPlan={todoPhase2b} />
      </div>
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
