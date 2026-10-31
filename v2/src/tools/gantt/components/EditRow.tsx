import { useState } from 'react'
import { Button } from '../../../ui/Button'
import { toast } from '../../../ui/toastStore'
import { useGanttApi } from '../GanttStoreProvider'
import { useGanttT } from '../i18n'
import { fmtDate } from '../logic/dates'
import type { ParentOption } from '../logic/tree'
import type { Status, Task } from '../logic/types'

const EDIT_STATUSES: { value: Status; key: 'statusProg' | 'statusDone' | 'statusPend' | 'statusBloc' | 'statusLate' }[] = [
  { value: 'prog', key: 'statusProg' },
  { value: 'done', key: 'statusDone' },
  { value: 'pend', key: 'statusPend' },
  { value: 'bloc', key: 'statusBloc' },
  { value: 'late', key: 'statusLate' },
]

interface Props {
  task: Task
  span: number
  width: number
  parents: ParentOption[]
}

/** Fila de edición en línea (editRow/saveEdit). */
export function EditRow({ task, span, width, parents }: Props) {
  const { t } = useGanttT()
  const api = useGanttApi()
  const [name, setName] = useState(task.name)
  const [start, setStart] = useState(fmtDate(task.start))
  const [end, setEnd] = useState(fmtDate(task.end))
  const [status, setStatus] = useState<Status>(task.status)
  const [parent, setParent] = useState(task.parentId == null ? '' : String(task.parentId))
  const [comment, setComment] = useState(task.comment || '')

  const save = () => {
    const r = api.getState().saveEdit(task.id, { name, start, end, status, comment, parentId: parent || null })
    if (!r.ok) {
      toast('error', t(r.error))
      return
    }
    toast('ok', t('toastSaved'))
  }

  const colStyle = { width, minWidth: width, maxWidth: width }
  return (
    <tr className="gt-edit-row" data-edit-id={task.id}>
      <td className="gt-task-col" style={colStyle}>
        <input className="gt-input" type="text" maxLength={120} aria-label={t('excelColTask')} value={name} onChange={(e) => setName(e.target.value)} />
      </td>
      <td colSpan={span}>
        <div className="gt-edit-inline">
          <label>
            {t('editStart')}
            <input className="gt-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            {t('editEnd')}
            <input className="gt-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <select className="gt-input" aria-label={t('excelColStatus')} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {EDIT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.key)}
              </option>
            ))}
          </select>
          <label>
            {t('editParent')}
            <select className="gt-input" value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">{t('formParentNone')}</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            💬
            <input
              className="gt-input gt-edit-inline__comment"
              type="text"
              maxLength={300}
              placeholder={t('editCommentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
          <Button onClick={save}>{t('editSave')}</Button>
          <Button variant="ghost" onClick={() => api.getState().setEditing(null)}>
            {t('editCancel')}
          </Button>
        </div>
      </td>
    </tr>
  )
}
