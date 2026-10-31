import { useState } from 'react'
import { HELP, useVzT, type HelpRow } from '../i18n'

type Tab = 'flow' | 'tools' | 'keys' | 'tips'
const TABS: { id: Tab; key: 'tabFlow' | 'tabTools' | 'tabKeys' | 'tabTips' }[] = [
  { id: 'flow', key: 'tabFlow' },
  { id: 'tools', key: 'tabTools' },
  { id: 'keys', key: 'tabKeys' },
  { id: 'tips', key: 'tabTips' },
]

const Section = ({ text }: { text: string }) => <p className="vz-help__section">{text}</p>

const Rows = ({ rows }: { rows: HelpRow[] }) => (
  <>
    {rows.map((r) => (
      <div key={r.title} className="vz-help__row">
        <span className="vz-help__icon">{r.icon}</span>
        <div>
          <p className="vz-help__title">{r.title}</p>
          <p className="vz-help__desc">{r.desc}</p>
        </div>
      </div>
    ))}
  </>
)

const Keys = ({ pairs, split = false }: { pairs: [string, string][]; split?: boolean }) => (
  <div className="vz-help__keys">
    {pairs.map(([key, desc]) => (
      <div key={key} className="vz-help__keyrow">
        <div className="vz-help__keycell">
          {(split ? key.split(' / ') : [key]).map((k, i) => (
            <span key={k}>
              {i > 0 && <span className="vz-help__slash">/</span>}
              <kbd>{k}</kbd>
            </span>
          ))}
        </div>
        <p className="vz-help__desc">{desc}</p>
      </div>
    ))}
  </div>
)

/** Contenido del manual (HelpModal.tsx) con sus 4 pestañas; va dentro del Dialog de la v2. */
export function HelpPanel() {
  const { t, lang } = useVzT()
  const h = HELP[lang]
  const [tab, setTab] = useState<Tab>('flow')
  return (
    <div className="vz-help">
      <div className="vz-help__tabs" role="tablist">
        {TABS.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`vz-help__tab${tab === id ? ' is-on' : ''}`}
            onClick={() => setTab(id)}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="vz-help__body" role="tabpanel">
        {tab === 'flow' && (
          <>
            <Section text={h.flow.section} />
            <p className="vz-help__intro">{h.flow.intro}</p>
            <Rows rows={h.flow.rows} />
          </>
        )}
        {tab === 'tools' && (
          <>
            <Section text={h.tools.section} />
            <Rows rows={h.tools.rows} />
            <Section text={h.tools.multiSection} />
            <Rows rows={h.tools.multiRows} />
          </>
        )}
        {tab === 'keys' && (
          <>
            <Section text={h.keys.section} />
            <Keys pairs={h.keys.mouse} split />
            <Section text={h.keys.toolSection} />
            <Keys pairs={h.keys.tools} />
            <Section text={h.keys.buttonSection} />
            <Keys pairs={h.keys.buttons} />
          </>
        )}
        {tab === 'tips' && (
          <>
            <Section text={h.tips.section} />
            <Rows rows={h.tips.rows} />
          </>
        )}
      </div>
    </div>
  )
}
