import { useRef, type KeyboardEvent } from 'react'

export type TabItem = { id: string; label: string; disabled?: boolean }

type Props = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  label?: string
}

export function Tabs({ items, value, onChange, label = 'Herramientas' }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const enabled = items.filter((t) => !t.disabled)
    if (enabled.length === 0) return
    const i = enabled.findIndex((t) => t.id === value)
    const step = e.key === 'ArrowRight' ? 1 : -1
    const next = enabled[(i + step + enabled.length) % enabled.length]
    onChange(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className="tabs" onKeyDown={onKeyDown}>
      {items.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el
          }}
          type="button"
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className={`tab${t.id === value ? ' tab--on' : ''}${t.disabled ? ' tab--disabled' : ''}`}
          aria-disabled={t.disabled ? true : undefined}
          onClick={() => {
            if (!t.disabled) onChange(t.id)
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
