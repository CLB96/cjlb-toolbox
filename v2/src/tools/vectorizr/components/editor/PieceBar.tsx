import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { clampQuantity, pieceColor, pieceLabel } from '../../logic/pieces'
import { Icon } from '../icons'

/** Piezas del trabajo: cuál se edita, pestañas para cambiar, nombre y cantidad de la activa. */
export function PieceBar() {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const pieces = useVectorizr((s) => s.pieces)
  const activeId = useVectorizr((s) => s.activePieceId)
  const index = Math.max(0, pieces.findIndex((p) => p.id === activeId))
  const active = pieces[index]
  if (!active) return null
  const s = () => api.getState()

  return (
    <div className="vz-piecebar glass">
      <span className="vz-piecebar__title">{t('editingPiece', pieceLabel(active, index))}</span>
      <div className="vz-tabs" role="group">
        {pieces.map((p, i) => (
          <span key={p.id} className={`vz-tab${p.id === activeId ? ' is-on' : ''}`}>
            <button type="button" aria-pressed={p.id === activeId} onClick={() => s().switchPiece(p.id)}>
              <span className="vz-sw" style={{ background: pieceColor(i) }} />
              {pieceLabel(p, i)}
            </button>
            {pieces.length > 1 && (
              <button type="button" className="vz-tab__x" aria-label={t('deletePieceN', i + 1)} onClick={() => s().removePiece(p.id)}>
                ×
              </button>
            )}
          </span>
        ))}
        <button type="button" className="vz-tab vz-tab--add" onClick={() => s().addPiece()}>
          <Icon name="piece" inline />
          {t('newPiece')}
        </button>
      </div>
      <span className="vz-spacer" />
      <input className="vz-piecebar__name" aria-label={t('pieceName')} value={active.name} onChange={(e) => s().renamePiece(active.id, e.target.value)} />
      <input
        className="vz-piecebar__qty"
        aria-label={t('pieceQty')}
        inputMode="numeric"
        value={active.quantity}
        onChange={(e) => s().setPieceQuantity(active.id, clampQuantity(e.target.value))}
      />
    </div>
  )
}
