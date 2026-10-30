import { useState } from 'react'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { STATIC_TEXTS, useBondlineT, type BondlineKey } from '../i18n'
import { normalizeDefaults, type DefaultsForm } from '../logic/defaults'
import type { BondlineDefaults } from '../logic/types'
import { useBondlineDefaultsCtx } from '../useBondlineView'

interface Props {
  open: boolean
  onClose: () => void
}

interface FieldDef {
  id: string
  key: keyof DefaultsForm
  label: BondlineKey
}

/** ids del modal original (inventario §6); inputs number step 0.1 sin min/max. */
const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: STATIC_TEXTS.waterbase,
    fields: [
      { id: 'defaultWaterBaseMin', key: 'wbMin', label: 'defaultsTempMin' },
      { id: 'defaultWaterBaseMax', key: 'wbMax', label: 'defaultsTempMax' },
    ],
  },
  {
    title: STATIC_TEXTS.hotmelt,
    fields: [
      { id: 'defaultHotmeltMin', key: 'hmMin', label: 'defaultsTempMin' },
      { id: 'defaultHotmeltMax', key: 'hmMax', label: 'defaultsTempMax' },
    ],
  },
]

const toForm = (d: BondlineDefaults): DefaultsForm => ({
  wbMin: String(d.waterbase.min),
  wbMax: String(d.waterbase.max),
  hmMin: String(d.hotmelt.min),
  hmMax: String(d.hotmelt.max),
  cooling: String(d.coolingTarget),
})

function DefaultsBody({ onClose }: Pick<Props, 'onClose'>) {
  const t = useBondlineT()
  const { defaults, save, resetToFactory } = useBondlineDefaultsCtx()
  const [form, setForm] = useState(() => toForm(defaults))
  const [busy, setBusy] = useState(false)
  const set = (key: keyof DefaultsForm, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const field = (f: FieldDef) => (
    <div className="bl-field" key={f.id}>
      <label htmlFor={f.id}>{t(f.label)}</label>
      <input
        id={f.id}
        type="number"
        step="0.1"
        className="bl-input"
        value={form[f.key]}
        onChange={(e) => set(f.key, e.target.value)}
      />
    </div>
  )

  // saveDefaults: guarda, aplica y cierra; si falla (toast) el diálogo sigue abierto
  const onSave = async () => {
    setBusy(true)
    const ok = await save(form)
    setBusy(false)
    if (ok) onClose()
  }

  // resetDefaults: confirma, guarda de inmediato y rellena sin cerrar (R1, R8)
  const onReset = async () => {
    if (!window.confirm(t('defaultsConfirmReset'))) return
    setBusy(true)
    const ok = await resetToFactory()
    setBusy(false)
    if (ok) setForm(toForm(normalizeDefaults(undefined)))
  }

  return (
    <div className="bl-defaults">
      <p className="bl-muted">{t('defaultsSubtitle')}</p>
      {GROUPS.map((g) => (
        <fieldset className="bl-defaults__group" key={g.title}>
          <legend className="bl-sub">{g.title}</legend>
          <div className="bl-row2">{g.fields.map(field)}</div>
        </fieldset>
      ))}
      {field({ id: 'defaultCoolingTarget', key: 'cooling', label: 'defaultsCoolingTarget' })}
      <div className="bl-defaults__foot">
        <Button variant="ghost" onClick={() => void onReset()} disabled={busy}>
          {t('defaultsReset')}
        </Button>
        <span className="bl-spacer" />
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {t('defaultsCancel')}
        </Button>
        <Button onClick={() => void onSave()} disabled={busy}>
          {t('defaultsSave')}
        </Button>
      </div>
    </div>
  )
}

/** Modal "Valores Default": el formulario se rellena con los valores vigentes al abrir. */
export function DefaultsDialog({ open, onClose }: Props) {
  const t = useBondlineT()
  return (
    <Dialog open={open} onClose={onClose} title={t('defaultsTitle')}>
      {open && <DefaultsBody onClose={onClose} />}
    </Dialog>
  )
}
