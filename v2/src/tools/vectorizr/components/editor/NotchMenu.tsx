import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { newDrill } from '../../logic/drills'
import { newNotch, notchGeometry, notchOwnerPoints, withSegmentType } from '../../logic/notches'
import { activeNotches } from '../../store'
import type { NotchType, SegmentType } from '../../types'
import type { NotchMenuState } from './useNotchMenu'

interface Props {
  menu: NotchMenuState
  onClose: () => void
  onSelectNotch: (id: string | null) => void
  onEditDepth: (id: string) => void
  onEditDrill: (id: string) => void
}

const TYPES: NotchType[] = ['I', 'V', 'T']
const SEGMENTS: { type: SegmentType; label: 'segLine' | 'segBezier' }[] = [
  { type: 'line', label: 'segLine' },
  { type: 'bezier', label: 'segBezier' },
]

/** Menú contextual de notches (HTML sobre el lienzo): añadir, y sobre un notch voltear, tipo, profundidad y eliminar. */
export function NotchMenu({ menu, onClose, onSelectNotch, onEditDepth, onEditDrill }: Props) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const notch = useVectorizr((s) => (menu.kind === 'notch' ? activeNotches(s).find((n) => n.id === menu.id) : undefined))
  const segmentType = useVectorizr((s) => (menu.kind === 'add' ? s.contourPoints[menu.segmentIndex]?.type : undefined))
  const contour = useVectorizr((s) => s.contourPoints)
  const paths = useVectorizr((s) => s.paths)
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const tip = notch ? notchGeometry(notch, notchOwnerPoints(notch, contour, paths), scaleFactor)?.tip : undefined
  const run = (action: () => void) => () => {
    action()
    onClose()
  }
  const s = () => api.getState()
  if (menu.kind === 'notch' && !notch) return null

  return (
    <div className="vz-notch-menu" role="menu" style={{ left: menu.x, top: menu.y }}>
      {menu.kind === 'add' && (
        <>
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
          <button
            type="button"
            role="menuitem"
            onClick={run(() => {
              const d = newDrill(menu.at.x, menu.at.y)
              s().addDrill(d)
              onEditDrill(d.id)
            })}
          >
            {t('addDrill')}
          </button>
          <hr />
          {SEGMENTS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              role="menuitemradio"
              aria-checked={segmentType === type}
              onClick={run(() => {
                if (segmentType === type) return
                s().setContourPoints(withSegmentType(s().contourPoints, menu.segmentIndex, type))
                s().pushHistory()
              })}
            >
              {segmentType === type ? '✓ ' : ''}
              {t(label)}
            </button>
          ))}
        </>
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
          <button type="button" role="menuitem" onClick={run(() => onEditDepth(notch.id))}>
            {t('notchDepthMenu')}
          </button>
          {notch.type === 'I' && tip && (
            <button
              type="button"
              role="menuitem"
              onClick={run(() => {
                const d = newDrill(tip.x, tip.y)
                s().addDrill(d)
                onEditDrill(d.id)
              })}
            >
              {t('addDrillTip')}
            </button>
          )}
        </>
      )}
      {menu.kind === 'drill' && (
        <>
          <button type="button" role="menuitem" onClick={run(() => onEditDrill(menu.id))}>
            {t('drillSizeMenu')}
          </button>
          <button type="button" role="menuitem" onClick={run(() => s().removeDrill(menu.id))}>
            {t('deleteNotch')}
          </button>
        </>
      )}
    </div>
  )
}
