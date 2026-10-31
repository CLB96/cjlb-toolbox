import { useState } from 'react'
import { Button } from '../../../ui/Button'
import { toast } from '../../../ui/toastStore'
import { useGantt, useGanttApi } from '../GanttStoreProvider'
import { STATIC_TEXTS, useGanttT } from '../i18n'
import { addDays, fmtDate } from '../logic/dates'
import type { ParentOption } from '../logic/tree'
import type { Status } from '../logic/types'
import { Panel } from './Panel'

const FORM_STATUSES: { value: Status; key: 'statusPend' | 'statusProg' | 'statusDone' | 'statusBloc' }[] = [
  { value: 'pend', key: 'statusPend' },
  { value: 'prog', key: 'statusProg' },
  { value: 'done', key: 'statusDone' },
  { value: 'bloc', key: 'statusBloc' },
]

interface Props {
  today: Date
  parents: ParentOption[]
  disabled: boolean
}

/** Nueva tarea (addTask): nombre, fechas, estado, padre y nota. */
export function NewTaskForm({ today, parents, disabled }: Props) {
  const { t } = useGanttT()
  const api = useGanttApi()
  const open = useGantt((s) => s.prefs.formOpen)
  const [name, setName] = useState('')
  const [start, setStart] = useState(() => fmtDate(today))
  const [end, setEnd] = useState(() => fmtDate(addDays(today, 5)))
  const [status, setStatus] = useState<Status>('pend')
  const [parent, setParent] = useState('')
  const [comment, setComment] = useState('')
  // el padre elegido desaparece si ya no existe (render del original)
  const parentValue = parents.some((p) => String(p.id) === parent) ? parent : ''

  const add = () => {
    if (disabled) return
    const r = api.getState().addTask({ name, start, end, status, comment, parentId: parentValue || null })
    if (!r.ok) {
      toast('error', t(r.error))
      return
    }
    setName('')
    setStart(fmtDate(today))
    setEnd(fmtDate(addDays(today, 5)))
    setComment('')
    setParent('')
    toast('ok', t('toastAdded'))
  }

  return (
    <Panel
      title={t('formTitle')}
      subtitle={t('formSubtitle')}
      open={open}
      toggleLabel="Minimizar nueva tarea"
      onToggle={() => api.getState().setPref('formOpen', !open)}
    >
      <div className="gt-form">
        <input
          className="gt-input"
          type="text"
          maxLength={120}
          placeholder={t('formPlaceholderName')}
          aria-label="Nombre de nueva tarea"
          value={name}
          disabled={disabled}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
        />
        <div className="gt-row">
          <input className="gt-input" type="date" aria-label="Fecha de inicio" value={start} disabled={disabled} onChange={(e) => setStart(e.target.value)} />
          <input className="gt-input" type="date" aria-label="Fecha de fin" value={end} disabled={disabled} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="gt-row">
          <select className="gt-input" aria-label="Estado de nueva tarea" value={status} disabled={disabled} onChange={(e) => setStatus(e.target.value as Status)}>
            {FORM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.key)}
              </option>
            ))}
          </select>
          <select className="gt-input" aria-label="Subtarea de" value={parentValue} disabled={disabled} onChange={(e) => setParent(e.target.value)}>
            <option value="">{t('formParentNone')}</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="gt-row gt-row--comment">
          <span className="gt-comment-icon" title="Comentario" aria-hidden="true">
            💬
          </span>
          <input
            className="gt-input"
            type="text"
            maxLength={300}
            placeholder={t('formPlaceholderComment')}
            aria-label="Comentario"
            value={comment}
            disabled={disabled}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button onClick={add} disabled={disabled}>
            {STATIC_TEXTS.addButton}
          </Button>
        </div>
        <div className="gt-tip">{t('formTip')}</div>
      </div>
    </Panel>
  )
}
