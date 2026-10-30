import { useShallow } from 'zustand/react/shallow'
import { useGapcheck } from '../GapcheckStoreProvider'
import { useGapcheckT } from '../i18n'
import { PALETTE_SOLID, hexToRgba } from '../logic/chartStyle'

/** Chips de filtro de puntos e iteraciones (buildFilterChips, inventario §5). Reflejan el estado real (R2). */
export function Filters() {
  const t = useGapcheckT()
  const names = useGapcheck(useShallow((s) => s.points.map((p) => p.name)))
  const maxIter = useGapcheck((s) => s.maxIter)
  const visiblePoints = useGapcheck((s) => s.visiblePoints)
  const visibleIters = useGapcheck((s) => s.visibleIters)
  const togglePoint = useGapcheck((s) => s.togglePoint)
  const toggleIter = useGapcheck((s) => s.toggleIter)

  return (
    <div className="gc-filters">
      <div className="gc-filters__group" role="group" aria-labelledby="gc-filter-points">
        <div id="gc-filter-points" className="gc-filters__label">{t('filterPoints')}</div>
        <div className="gc-filters__chips">
          {names.map((name, i) => {
            const on = visiblePoints.includes(i)
            return (
              <button
                key={i}
                type="button"
                className={`gc-fchip${on ? ' gc-fchip--on' : ''}`}
                aria-pressed={on}
                onClick={() => togglePoint(i)}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
      <div className="gc-filters__divider" />
      <div className="gc-filters__group" role="group" aria-labelledby="gc-filter-iters">
        <div id="gc-filter-iters" className="gc-filters__label">{t('filterIterations')}</div>
        <div className="gc-filters__chips">
          {Array.from({ length: maxIter }, (_, j) => {
            const color = PALETTE_SOLID[j % PALETTE_SOLID.length]
            const on = visibleIters.includes(j)
            const style = on
              ? { borderColor: color, backgroundColor: hexToRgba(color, 0.12), color }
              : undefined
            return (
              <button
                key={j}
                type="button"
                className={`gc-fchip${on ? ' gc-fchip--on' : ''}`}
                aria-pressed={on}
                style={style}
                onClick={() => toggleIter(j)}
              >
                <span className="gc-fchip__dot" style={{ background: color }} aria-hidden="true" />
                Iter {j + 1}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
