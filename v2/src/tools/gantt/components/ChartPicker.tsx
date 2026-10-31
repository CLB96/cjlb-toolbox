import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { toast } from '../../../ui/toastStore'
import { useGantt, useGanttApi } from '../GanttStoreProvider'
import { useGanttT } from '../i18n'
import { MAX_CHARTS } from '../store'

type NameDialog = { mode: 'new' } | { mode: 'rename'; id: string; name: string } | null

/** Selector de hasta 5 Gantts por usuario: cambiar, crear, renombrar y eliminar. */
export function ChartPicker({ disabled }: { disabled: boolean }) {
  const { t } = useGanttT()
  const api = useGanttApi()
  const stored = useGantt((s) => s.charts)
  const charts = stored.map((c) => ({ id: c.id, name: c.name, count: c.tasks.length }))
  const activeId = useGantt((s) => s.activeId)
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<NameDialog>(null)
  const [name, setName] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const active = charts.find((c) => c.id === activeId) ?? charts[0]!
  const left = MAX_CHARTS - charts.length

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const openDialog = (d: NonNullable<NameDialog>) => {
    setOpen(false)
    setName(d.mode === 'rename' ? d.name : t('chartsDefaultName', charts.length + 1))
    setDialog(d)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!dialog || !name.trim()) return
    if (dialog.mode === 'new') {
      const r = api.getState().createChart(name)
      if (!r.ok) toast('error', t(r.error))
    } else {
      api.getState().renameChart(dialog.id, name)
    }
    setDialog(null)
  }

  const remove = (id: string, chartName: string) => {
    const r0 = charts.length <= 1
    if (r0) {
      toast('error', t('chartsLastOne'))
      return
    }
    if (!window.confirm(t('chartsConfirmDelete', chartName))) return
    api.getState().deleteChart(id)
  }

  return (
    <div className="gt-picker" ref={ref}>
      <button
        type="button"
        className="gt-picker__btn"
        aria-haspopup="true"
        aria-label={`${t('chartsLabel')}: ${active.name}`}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">📊</span> <span className="gt-picker__name">{active.name}</span>
        <small>· {charts.length}/{MAX_CHARTS}</small> <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="gt-pop glass glass--dense" role="menu">
          {charts.map((c) => (
            <div key={c.id} className={`gt-pop__item${c.id === activeId ? ' is-on' : ''}`}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={c.id === activeId}
                className="gt-pop__pick"
                onClick={() => {
                  api.getState().selectChart(c.id)
                  setOpen(false)
                }}
              >
                <span className="gt-pop__check" aria-hidden="true">{c.id === activeId ? '✓' : ''}</span>
                <span className="gt-pop__label">{c.name}</span>
                <em>{t('taskCount', c.count)}</em>
              </button>
              <button
                type="button"
                className="gt-pop__icon"
                title={t('chartsRename')}
                aria-label={`${t('chartsRename')} ${c.name}`}
                onClick={() => openDialog({ mode: 'rename', id: c.id, name: c.name })}
              >
                ✎
              </button>
              <button
                type="button"
                className="gt-pop__icon"
                title={t('chartsDelete')}
                aria-label={`${t('chartsDelete')} ${c.name}`}
                onClick={() => remove(c.id, c.name)}
              >
                🗑
              </button>
            </div>
          ))}
          <hr />
          <button
            type="button"
            role="menuitem"
            className="gt-pop__new"
            disabled={left <= 0}
            title={left <= 0 ? t('chartsMax') : undefined}
            onClick={() => openDialog({ mode: 'new' })}
          >
            <span>{t('chartsNew')}</span>
            <em>{left <= 0 ? t('chartsMax') : t('chartsLeft', left)}</em>
          </button>
        </div>
      )}
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'rename' ? t('chartsRenameTitle') : t('chartsNewTitle')}
      >
        <form className="gt-dialog-form" onSubmit={submit}>
          <label className="gt-field">
            {t('chartsNameLabel')}
            <input
              className="gt-input"
              value={name}
              maxLength={60}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="gt-dialog-actions">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('editCancel')}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t('editSave')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
