import { dismissToast, useToasts } from './toastStore'

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts)
  return (
    <div className="toast-host" role="region" aria-label="Notificaciones">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass toast toast--${t.kind}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span>{t.message}</span>
          <button
            type="button"
            className="toast__close"
            aria-label="Cerrar"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
