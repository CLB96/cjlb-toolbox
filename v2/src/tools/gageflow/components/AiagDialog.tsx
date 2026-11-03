import { Dialog } from '../../../ui/Dialog'
import { Button } from '../../../ui/Button'
import { useGageflowT } from '../i18n'

interface Props {
  operadores: string[]
  ensayos: number
  onConvertir: () => void
  onCerrar: () => void
}

/** Confirmación antes de convertir una hoja clásica AIAG al formato largo. */
export function AiagDialog({ operadores, ensayos, onConvertir, onCerrar }: Props) {
  const t = useGageflowT()
  return (
    <Dialog open onClose={onCerrar} title={t('aiagTitulo')}>
      <p>{t('aiagCuerpo', { operadores: operadores.length, ensayos })}</p>
      <ul className="gf-ops">
        {operadores.map((o) => <li key={o} className="gf-op">{o}</li>)}
      </ul>
      <div className="gf-acciones">
        <Button variant="ghost" onClick={onCerrar}>{t('cancelar')}</Button>
        <Button onClick={onConvertir}>{t('convertir')}</Button>
      </div>
    </Dialog>
  )
}
