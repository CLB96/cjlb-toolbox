import { useState } from 'react'
import type { ToolDef } from '../tools/types'
import { useI18n } from '../i18n/useI18n'
import { CardEditor, type CardEdit } from './CardEditor'

/** `edit` presente = modo Personalizar: la tarjeta no abre la herramienta y se puede mover. */
type Props = { tool: ToolDef; onOpen: (tool: ToolDef) => void; edit?: CardEdit }

function ToolIcon({ tool }: { tool: ToolDef }) {
  const [failed, setFailed] = useState(false)
  if (tool.iconSvg && !failed) {
    return (
      <img
        className="tool-card__icon-img"
        src={tool.iconSvg}
        alt=""
        width={40}
        height={40}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span className="tool-card__icon" aria-hidden="true">
      {tool.icon}
    </span>
  )
}

function cardClass(isHold: boolean, edit?: CardEdit): string {
  const parts = ['glass', 'tool-card']
  if (isHold) parts.push('tool-card--hold')
  if (edit) parts.push('tool-card--editing')
  if (edit?.isDragging) parts.push('tool-card--dragging')
  if (edit?.isTarget) parts.push('tool-card--target')
  return parts.join(' ')
}

export function ToolCard({ tool, onOpen, edit }: Props) {
  const { lang, t } = useI18n()
  const es = lang === 'es'
  const isHold = tool.status === 'hold'
  const name = es ? tool.nameEs : tool.nameEn
  const desc = es ? tool.descEs : tool.descEn
  const holdLabel = es ? tool.holdLabelEs : tool.holdLabelEn
  return (
    <article
      className={cardClass(isHold, edit)}
      data-testid="tool-card"
      data-tool-id={tool.id}
      {...edit?.drag}
    >
      {edit && (
        <span className="tool-card__grip" aria-hidden="true">
          ⋮⋮
        </span>
      )}
      <button
        type="button"
        className="tool-card__button"
        disabled={isHold}
        tabIndex={edit ? -1 : undefined}
        aria-disabled={edit ? true : undefined}
        onClick={() => {
          if (!edit) onOpen(tool)
        }}
      >
        <ToolIcon tool={tool} />
        <span className="tool-card__name">{name}</span>
        <span className="tool-card__desc">{desc}</span>
        <span className="tool-card__badges">
          {tool.badge && (
            <span className={`pill pill--${tool.badge}`}>
              {t(tool.badge === 'new' ? 'home.badge.new' : 'home.badge.updated')}
            </span>
          )}
          {isHold && <span className="pill pill--hold">{holdLabel}</span>}
        </span>
      </button>
      {edit && <CardEditor tool={tool} edit={edit} />}
    </article>
  )
}
