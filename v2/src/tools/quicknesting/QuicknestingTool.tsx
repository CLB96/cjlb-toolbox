import type { ToolProps } from '../types'
import { QnStoreProvider, useQn } from './QnStoreProvider'
import { useQnT } from './i18n'
import { FilePanel } from './components/FilePanel'
import { LayoutPanel } from './components/LayoutPanel'
import { QuantityPanel } from './components/QuantityPanel'
import { SpreadPanel } from './components/SpreadPanel'
import './quicknesting.css'

function Steps() {
  const t = useQnT()
  const imported = useQn((s) => Boolean(s.imported))
  const confirmed = useQn((s) => s.confirmed)
  const result = useQn((s) => Boolean(s.result))
  const steps = [
    [t('configure'), imported], [t('load'), imported], [t('review'), confirmed || result], [t('nest'), result],
  ] as const
  return (
    <ol className="qn-pasos">
      {steps.map(([text, done], i) => (
        <li key={i} className={done ? 'qn-paso--hecho' : undefined}><b>{i + 1}</b> {text}</li>
      ))}
    </ol>
  )
}

function Screen() {
  const t = useQnT()
  const busy = useQn((s) => s.busy)
  return (
    <div className="qn-root" aria-busy={busy}>
      <header className="qn-header">
        <h2 className="qn-title">{t('title')}</h2>
      </header>
      <Steps />
      <div className="qn-cols">
        <div className="qn-col">
          <SpreadPanel />
          <QuantityPanel />
        </div>
        <div className="qn-col">
          <FilePanel />
          <LayoutPanel />
          <p className="qn-note">{t('stacked')}</p>
        </div>
      </div>
      <p className="qn-note">{t('reviewOnly')}</p>
    </div>
  )
}

export default function QuicknestingTool(_props: ToolProps) {
  return (
    <QnStoreProvider>
      <Screen />
    </QnStoreProvider>
  )
}
