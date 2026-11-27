import type { MouseEvent } from 'react'
import { Button, type ButtonProps } from './Button'
import { useToasts } from './toastStore'
import { useActionStatus } from './useActionStatus'

/** Tiempo mínimo en "cargando", para que las acciones instantáneas también se vean (círculo + cargador). */
export const MIN_LOADING_MS = 450

class ActionFailed extends Error {}

type Props = Omit<ButtonProps, 'status' | 'onClick'> & {
  /** Puede ser síncrona o devolver una promesa; el botón espera a que termine. */
  onClick: (e: MouseEvent<HTMLButtonElement>) => unknown
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Botón que lanza trabajo: se encoge a un círculo con cargador mientras corre y muestra una palomita al terminar.
 * Muchas acciones capturan sus propios errores y los avisan con un toast de error; si aparece uno nuevo mientras
 * corre, no se muestra la palomita (el botón vuelve al reposo).
 */
export function ActionButton({ onClick, ...rest }: Props) {
  const action = useActionStatus()
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    void action
      .run('action', async () => {
        const before = new Set(useToasts.getState().toasts.map((t) => t.id))
        const started = Date.now()
        await onClick(e)
        const left = MIN_LOADING_MS - (Date.now() - started)
        if (left > 0) await delay(left)
        if (useToasts.getState().toasts.some((t) => t.kind === 'error' && !before.has(t.id))) throw new ActionFailed()
      })
      .catch((err: unknown) => {
        if (!(err instanceof ActionFailed)) throw err
      })
  }
  return <Button {...rest} status={action.statusOf('action')} onClick={handleClick} />
}
