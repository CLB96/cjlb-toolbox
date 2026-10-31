import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { SavedIndicator } from '../../persistence/SavedIndicator'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { GlassPanel } from '../../ui/GlassPanel'
import type { ToolProps } from '../types'
import { VectorizrStoreProvider, useVectorizr } from './VectorizrStoreProvider'
import { HELP, useVzT } from './i18n'
import { useVectorizrPersistence } from './useVectorizrPersistence'
import { disposeOpencvClient, preloadOpencv } from './worker/opencvClient'
import { HelpPanel } from './components/HelpPanel'
import { RotatePrompt, useOrientation } from './components/RotatePrompt'
import { StepBar } from './components/StepBar'
import { Step1Upload } from './components/steps/Step1Upload'
import { Step2Scale } from './components/steps/Step2Scale'
import { Step3Vectorize } from './components/steps/Step3Vectorize'
import { Step4Editor } from './components/steps/Step4Editor'
import './vectorizr.css'

const IDLE_FALLBACK_MS = 1500

/** M10: precarga OpenCV en segundo plano la primera vez que la pestaña está visible. */
function usePreloadOpencv(active: boolean) {
  const done = useRef(false)
  useEffect(() => {
    if (!active || done.current) return
    done.current = true
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => preloadOpencv())
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(() => preloadOpencv(), IDLE_FALLBACK_MS)
    return () => clearTimeout(id)
  }, [active])
}

function VectorizrBody({ toolId, active }: ToolProps) {
  const { t: tApp } = useI18n()
  const { t, lang } = useVzT()
  const step = useVectorizr((s) => s.step)
  const { lastSavedAt, restoreVersion, restored } = useVectorizrPersistence()
  const orientation = useOrientation()
  const [helpOpen, setHelpOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  usePreloadOpencv(active)
  // M9: el worker de OpenCV vive mientras la herramienta esté montada
  useEffect(() => () => disposeOpencvClient(), [])

  const onRestore = async (id: string) => {
    await restoreVersion(id)
    setHistoryOpen(false)
  }

  return (
    <div className="vz">
      <GlassPanel as="header" className="vz-head">
        <h2 className="vz-head__title">📐 {t('appName')}</h2>
        <StepBar />
        <SavedIndicator lastSavedAt={lastSavedAt} />
        <div className="vz-head__actions">
          <Button variant="ghost" onClick={() => setHelpOpen(true)}>
            {t('manualBtn')}
          </Button>
          <Button variant="ghost" onClick={() => setHistoryOpen(true)} disabled={!restored}>
            {t('historyBtn')}
          </Button>
        </div>
      </GlassPanel>

      <main className="vz-main">
        {orientation === 'portrait' && step >= 3 && <RotatePrompt />}
        {step === 1 && <Step1Upload disabled={!restored} />}
        {step === 2 && <Step2Scale />}
        {step === 3 && <Step3Vectorize />}
        {step === 4 && <Step4Editor active={active} />}
      </main>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title={HELP[lang].title}>
        <HelpPanel />
        <div className="vz-dialog-row">
          <Button variant="ghost" onClick={() => setHelpOpen(false)}>
            {t('close')}
          </Button>
        </div>
      </Dialog>
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} title={tApp('persist.history')}>
        <HistoryPanel toolId={toolId} onRestore={onRestore} lastSavedAt={lastSavedAt} />
      </Dialog>
    </div>
  )
}

export default function VectorizrTool(props: ToolProps) {
  return (
    <VectorizrStoreProvider>
      <VectorizrBody {...props} />
    </VectorizrStoreProvider>
  )
}
