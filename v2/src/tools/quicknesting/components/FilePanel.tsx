import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useQn } from '../QnStoreProvider'
import { useQnT } from '../i18n'
import type { Contour } from '../logic/importer'
import { useQnActions } from '../useQnActions'
import { Choice, useQnFormat } from './common'

function byLayer(contours: Contour[]): [string, Contour[]][] {
  const groups = new Map<string, Contour[]>()
  for (const c of contours) groups.set(c.layer, [...(groups.get(c.layer) ?? []), c])
  return [...groups]
}

export function FilePanel() {
  const t = useQnT()
  const format = useQnFormat()
  const fileName = useQn((s) => s.fileName)
  const imported = useQn((s) => s.imported)
  const importCount = useQn((s) => s.importCount)
  const units = useQn((s) => s.units)
  const selected = useQn((s) => s.selected)
  const confirmed = useQn((s) => s.confirmed)
  const busy = useQn((s) => s.busy)
  const toggleContour = useQn((s) => s.toggleContour)
  const setConfirmed = useQn((s) => s.setConfirmed)
  const viewContour = useQn((s) => s.viewContour)
  const { importFile, changeUnits } = useQnActions()
  const input = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const onDrag = (e: DragEvent, over: boolean) => {
    e.preventDefault()
    setDragging(over)
  }
  const onDrop = (e: DragEvent) => {
    onDrag(e, false)
    void importFile(e.dataTransfer.files[0])
  }

  return (
    <GlassPanel as="section" className="qn-panel" aria-labelledby="qn-upload">
      <h3 id="qn-upload" className="qn-h">{t('uploadTitle')}</h3>
      <div className="qn-drop" data-dragging={dragging} onDragEnter={(e) => onDrag(e, true)} onDragOver={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)} onDrop={onDrop}>
        <div>
          <strong>{fileName ?? t('drop')}</strong>
          <p className="qn-help">{t('uploadHelp')}</p>
        </div>
        <Button variant="ghost" disabled={busy} onClick={() => { if (input.current) { input.current.value = ''; input.current.click() } }}>
          {t(fileName ? 'changeFile' : 'load')}
        </Button>
        <input ref={input} type="file" accept=".dxf" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
      </div>
      {imported && (
        <>
          <label className="qn-field">
            <span>{t('units')}</span>
            <select value={units} disabled={busy} onChange={(e) => void changeUnits(e.target.value)}>
              <option value="declared">{t('declared')}</option>
              <option value="1">{t('millimetres')}</option>
              <option value="10">{t('centimetres')}</option>
              <option value="25.4">{t('inches')}</option>
            </select>
          </label>
          <p className="qn-help">{t('unitInfo', { unit: imported.unitLabel, scale: format(imported.unitMm, 5), tolerance: format(imported.toleranceMm, 3) })}</p>
          {imported.requiresUnitOverride && <p className="qn-warning">{t('unknownUnits')}</p>}
          <div className="qn-cab">
            <h4 className="qn-h qn-h--sub">{t('chooseOutlines')}</h4>
            <span className="qn-help">{t('selected', { count: selected.length })}</span>
          </div>
          {!imported.contours.length && <p className="qn-warning">{t('noContours')}</p>}
          {byLayer(imported.contours).map(([layer, list]) => (
            <section key={layer} className="qn-layer">
              <h5>{layer}</h5>
              {list.map((c) => (
                <div key={c.id} className="qn-contour">
                  <Choice type="checkbox" checked={selected.includes(c.id)} disabled={busy}
                    onChange={(e) => toggleContour(c.id, e.target.checked)}>
                    {c.id}
                    <small>{`${format(c.bounds[0])} × ${format(c.bounds[1])} mm · ${format(c.area)} mm²`}</small>
                    {c.nested && <small className="qn-warning">{t('nested')}</small>}
                  </Choice>
                  <Button variant="ghost" disabled={busy} onClick={() => viewContour(c.id)}>{t('view')}</Button>
                </div>
              ))}
            </section>
          ))}
          <hr className="qn-sep" />
          <Choice type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)}>{t('confirm')}</Choice>
          <details key={importCount} className="qn-diagnostics">
            <summary>{t('diagnostics')}</summary>
            <ul>
              {(imported.diagnostics.length ? imported.diagnostics : [{ code: '' }]).map((d, i) => (
                <li key={i}>
                  {d.code ? t('diagnostic', { code: d.code, count: d.count ?? 1, layer: d.layer ? ` · ${d.layer}` : '' }) : t('noDiagnostics')}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </GlassPanel>
  )
}
