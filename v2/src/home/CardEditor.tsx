import { useI18n, type MessageKey } from '../i18n/useI18n'
import type { ToolDef } from '../tools/types'
import type { Badge } from './customize'
import type { DragProps } from './useCardDrag'

export interface CardEdit {
  index: number
  total: number
  onMove: (delta: number) => void
  /** Solo el admin recibe este control. */
  onBadge?: (badge: Badge) => void
  drag: DragProps
  isDragging: boolean
  isTarget: boolean
}

const BADGE_OPTIONS: ReadonlyArray<[Badge, MessageKey]> = [
  [null, 'home.customize.noBadge'],
  ['new', 'home.badge.new'],
  ['updated', 'home.badge.updated'],
]

export function CardEditor({ tool, edit }: { tool: ToolDef; edit: CardEdit }) {
  const { t, lang } = useI18n()
  const name = lang === 'es' ? tool.nameEs : tool.nameEn
  const { onBadge } = edit
  return (
    <div className="tool-card__edit">
      <div className="tool-card__move">
        <button
          type="button"
          className="tool-card__arrow"
          data-move="-1"
          aria-label={t('home.customize.moveBefore', { name })}
          disabled={edit.index === 0}
          onClick={() => edit.onMove(-1)}
        >
          ←
        </button>
        <button
          type="button"
          className="tool-card__arrow"
          data-move="1"
          aria-label={t('home.customize.moveAfter', { name })}
          disabled={edit.index === edit.total - 1}
          onClick={() => edit.onMove(1)}
        >
          →
        </button>
        <span className="tool-card__pos">
          {t('home.customize.position', { n: edit.index + 1, total: edit.total })}
        </span>
      </div>
      {onBadge && (
        <fieldset className="tool-card__badge-edit">
          <legend>{t('home.customize.badge')}</legend>
          <div className="seg">
            {BADGE_OPTIONS.map(([value, key]) => (
              <label key={key} className="seg__opt">
                <input
                  type="radio"
                  name={`badge-${tool.id}`}
                  checked={tool.badge === value}
                  onChange={() => onBadge(value)}
                />
                <span>{t(key)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
