import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { newNotch } from '../../logic/notches'
import { activeNotches } from '../../store'
import type { NotchType } from '../../types'
import type { NotchMenuState } from './useNotchMenu'

interface Props {
  menu: NotchMenuState
  onClose: () => void
  onSelectNotch: (id: string | null) => void
}

const TYPES: NotchType[] = ['I', 'V', 'T']

/** Menú contextual de notches (HTML sobre el lienzo): añadir, y sobre un notch voltear, tipo, profundidad y eliminar. */
export function NotchMenu({ menu, onClose, onSelectNotch }: Props) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const notch = useVectorizr((s) => (menu.kind === 'notch' ? activeNotches(s).find((n) => n.id === menu.id) : undefined))
  const run = (action: () => void) => () => {
    action()
    onClose()
  }
  const s = () => api.getState()
  if (menu.kind === 'notch' && !notch) return null

  return (
    <div className="vz-notch-menu" role="menu" style={{ left: menu.x, top: menu.y }}>
      {menu.kind === 'add' && (
        <button
          type="button"
          role="menuitem"
          onClick={run(() => {
            const n = newNotch(menu.at.x, menu.at.y)
            s().addNotch(n)
            onSelectNotch(n.id)
          })}
        >
          {t('addNotch')}
        </button>
      )}
      {menu.kind === 'notch' && notch && (
        <>
          <button type="button" role="menuitem" onClick={run(() => { s().removeNotch(notch.id); onSelectNotch(null) })}>
            {t('deleteNotch')}
          </button>
          <button type="button" role="menuitem" onClick={run(() => s().updateNotch(notch.id, { flipped: !notch.flipped }))}>
            {t('flipNotch')}
          </button>
          <hr />
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="menuitemradio"
              aria-checked={notch.type === type}
              onClick={run(() => s().updateNotch(notch.id, { type }))}
            >
              {notch.type === type ? '✓ ' : ''}
              {t('notchTypeN', type)}
            </button>
          ))}
          <hr />
          <button type="button" role="menuitem" onClick={run(() => onSelectNotch(notch.id))}>
            {t('notchDepthMenu')}
          </button>
        </>
      )}
    </div>
  )
}
