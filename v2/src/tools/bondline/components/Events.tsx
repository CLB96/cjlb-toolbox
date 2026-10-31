import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import { toast } from '../../../ui/toastStore'
import { useBondlineT, type BondlineKey } from '../i18n'
import type { EventInputId } from '../logic/types'
import type { CoolingParams } from '../store'
import { Collapsible } from './Collapsible'

interface Group {
  title: BondlineKey
  entries: readonly { id: EventInputId; label: BondlineKey }[]
}

const GROUPS: readonly Group[] = [
  {
    title: 'eventsPrensa',
    entries: [
      { id: 'eventPressStart', label: 'eventPressStart' },
      { id: 'eventPressClosed', label: 'eventPressClosed' },
      { id: 'eventPressOpen', label: 'eventPressOpen' },
      { id: 'eventPressEnd', label: 'eventPressEnd' },
    ],
  },
  {
    title: 'eventsManipulation',
    entries: [
      { id: 'eventManipStart', label: 'eventManipStart' },
      { id: 'eventManipEnd', label: 'eventManipEnd' },
    ],
  },
  {
    title: 'eventsCooling',
    entries: [
      { id: 'eventCoolingStart', label: 'eventCoolingStart' },
      { id: 'eventCoolingClosed', label: 'eventCoolingClosed' },
      { id: 'eventCoolingEnd', label: 'eventCoolingEnd' },
    ],
  },
]

const COOLING_PARAMS: readonly { key: keyof CoolingParams; label: BondlineKey }[] = [
  { key: 'chiller', label: 'coolingChiller' },
  { key: 'nestUpper', label: 'coolingNestUpper' },
  { key: 'nestLower', label: 'coolingNestLower' },
]

/** Sucesos (inventario §5C/§6): 9 marcadores y, con los 3 de cooling rellenos, sus parámetros. */
export function Events({ disabled }: { disabled: boolean }) {
  const t = useBondlineT()
  const api = useBondlineApi()
  const events = useBondline((s) => s.config.events)
  const coolingParams = useBondline((s) => s.config.coolingParams)
  const { setEvent, setCoolingParam } = api.getState()
  // checkCoolingParams del original: inicio, cerrado y fin con texto
  const allCooling = Boolean(events.eventCoolingStart && events.eventCoolingClosed && events.eventCoolingEnd)

  return (
    <Collapsible panel="events" title={t('eventsTitle')} subtitle={t('eventsSubtitle')}>
      {GROUPS.map((g) => (
        <div key={g.title} className="bl-group">
          <div className="bl-sub">{t(g.title)}</div>
          <div className="bl-events-grid">
            {g.entries.map((e) => (
              <div key={e.id} className="bl-field">
                <label htmlFor={`bl-${e.id}`}>{t(e.label)}</label>
                <input
                  id={`bl-${e.id}`}
                  type="number"
                  step="1"
                  min="0"
                  className="bl-input"
                  placeholder="s"
                  value={events[e.id]}
                  disabled={disabled}
                  aria-invalid={e.id === 'eventCoolingStart' && parseFloat(events[e.id]) < 0 ? true : undefined}
                  onChange={(ev) => {
                    setEvent(e.id, ev.target.value)
                    if (e.id === 'eventCoolingStart' && parseFloat(ev.target.value) < 0) toast('error', t('coolingStartNegative'))
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {allCooling && (
        <div className="bl-group bl-cooling-params">
          <div className="bl-sub">{t('coolingParamsTitle')}</div>
          <div className="bl-events-grid">
            {COOLING_PARAMS.map((p) => (
              <div key={p.key} className="bl-field">
                <label htmlFor={`bl-cooling-${p.key}`}>{t(p.label)}</label>
                <input
                  id={`bl-cooling-${p.key}`}
                  type="number"
                  step="0.1"
                  className="bl-input"
                  placeholder="°C"
                  value={coolingParams[p.key]}
                  disabled={disabled}
                  onChange={(ev) => setCoolingParam(p.key, ev.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Collapsible>
  )
}
