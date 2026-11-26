import { useVzT } from '../../i18n'
import { clampQuantity, pieceColor } from '../../logic/pieces'
import type { ImagePoint } from '../../types'

export interface DetectedRow {
  key: number
  name: string
  /** Texto mientras se escribe; se corrige a entero 1..999 al salir del campo. */
  quantity: number | string
  points: ImagePoint[]
}

interface Props {
  rows: DetectedRow[]
  onChange: (rows: DetectedRow[]) => void
}

/** Lista lateral de las piezas detectadas: nombre, cantidad y quitar un contorno falso. */
export function DetectedPieces({ rows, onChange }: Props) {
  const { t } = useVzT()
  const patch = (key: number, next: Partial<DetectedRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...next } : r)))
  if (rows.length === 0) return <p className="vz-muted vz-small">{t('noPiecesDetected')}</p>
  return (
    <div className="vz-pieces-list">
      <p className="vz-caps">{t('detectedPieces', rows.length)}</p>
      {rows.map((r, i) => (
        <div className="vz-piece-row" key={r.key}>
          <span className="vz-sw" style={{ background: pieceColor(i) }} />
          <input aria-label={t('pieceName')} value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} />
          <input
            aria-label={t('pieceQty')}
            inputMode="numeric"
            value={r.quantity}
            onChange={(e) => patch(r.key, { quantity: e.target.value })}
            onBlur={() => patch(r.key, { quantity: clampQuantity(r.quantity) })}
          />
          <button type="button" className="vz-x" aria-label={t('removePieceN', i + 1)} onClick={() => onChange(rows.filter((x) => x.key !== r.key))}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
