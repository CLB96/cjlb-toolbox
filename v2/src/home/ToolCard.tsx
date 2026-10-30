import { useState } from 'react'
import type { ToolDef } from '../tools/types'
import { useI18n } from '../i18n/useI18n'

type Props = { tool: ToolDef; onOpen: (tool: ToolDef) => void }

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

export function ToolCard({ tool, onOpen }: Props) {
  const { lang, t } = useI18n()
  const es = lang === 'es'
  const isHold = tool.status === 'hold'
  const name = es ? tool.nameEs : tool.nameEn
  const desc = es ? tool.descEs : tool.descEn
  const holdLabel = es ? tool.holdLabelEs : tool.holdLabelEn
  return (
    <article className={`glass tool-card${isHold ? ' tool-card--hold' : ''}`} data-testid="tool-card">
      <button
        type="button"
        className="tool-card__button"
        disabled={isHold}
        onClick={() => onOpen(tool)}
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
    </article>
  )
}
