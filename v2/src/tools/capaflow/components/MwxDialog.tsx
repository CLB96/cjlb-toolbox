import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { useCapaT } from '../i18n'
import { convertMwxFiles, type MwxLogType } from '../export/mwxConverter'

interface LogEntry {
  id: number
  type: MwxLogType
  text: string
}

const isMwx = (name: string): boolean => /\.(mwx|mwp|mpx)$/i.test(name)
const extOf = (name: string): string => {
  const n = name.toLowerCase()
  return n.endsWith('.mwp') ? 'MWP' : n.endsWith('.mpx') ? 'MPX' : 'MWX'
}

/** Modal del conversor MWX/MWP/MPX -> Excel (openMwxConverter, clearMwxFiles, convertMwxFiles). */
export function MwxDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useCapaT()
  const [files, setFiles] = useState<File[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const counter = useRef(0)

  const addLog = (text: string, type: MwxLogType = 'info') => {
    const entry: LogEntry = { id: counter.current++, type, text: `[${new Date().toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US')}] ${text}` }
    setLog((l) => [...l, entry])
  }
  const clear = () => {
    setFiles([])
    setLog([])
    if (input.current) input.current.value = ''
  }
  const close = () => {
    clear()
    onClose()
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) => isMwx(f.name))
    if (dropped.length > 0) setFiles((f) => [...f, ...dropped])
    else addLog(t('v2.onlyMwx'), 'warning')
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    setFiles((f) => [...f, ...picked])
  }
  const onConvert = async () => {
    if (files.length === 0) return
    setBusy(true)
    setLog([])
    try {
      await convertMwxFiles(files, addLog, lang)
    } finally {
      setBusy(false)
    }
  }
  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    if (next.length === 0) clear()
    else setFiles(next)
  }

  return (
    <Dialog open={open} onClose={close} title={`🔄 ${t('panel.mwxTitle')}`}>
      <div className="cf-mwx" data-testid="cf-mwx">
        <label
          className={`cf-drop${over ? ' cf-drop--over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <input ref={input} type="file" className="cf-file-input" accept=".mwx,.MWX,.mwp,.MWP,.mpx,.MPX" multiple data-testid="cf-mwx-input" onChange={onPick} />
          <span aria-hidden="true">📁</span> <strong>{t('mwx.dropTitle')}</strong>
          <span className="cf-muted"> {t('mwx.dropSub')}</span>
        </label>
        {files.length > 0 && (
          <ul className="cf-mwx__files" data-testid="cf-mwx-files">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="cf-mwx__file">
                <span className="cf-mwx__ext">{extOf(file.name)}</span>
                <span className="cf-mwx__name">{file.name}</span>
                <span className="cf-muted">{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" className="cf-mwx__rm" title={t('v2.remove')} aria-label={t('v2.remove')} onClick={() => removeAt(index)}>×</button>
              </li>
            ))}
          </ul>
        )}
        <div className="cf-head__actions">
          <Button variant="ghost" onClick={clear} disabled={busy}>{t('mwx.clear')}</Button>
          <Button onClick={onConvert} disabled={busy || files.length === 0}>{busy ? t('v2.processing') : t('mwx.convert')}</Button>
        </div>
        {log.length > 0 && (
          <div className="cf-mwx__log" data-testid="cf-mwx-log" role="log">
            {log.map((entry) => (
              <div key={entry.id} className={`cf-mwx__entry cf-mwx__entry--${entry.type}`}>{entry.text}</div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  )
}
