import { act, fireEvent, render, screen } from '@testing-library/react'
import { ActionButton, MIN_LOADING_MS } from './ActionButton'
import { SUCCESS_MS } from './useActionStatus'
import { toast, useToasts } from './toastStore'

beforeEach(() => {
  vi.useFakeTimers()
  useToasts.setState({ toasts: [] })
})
afterEach(() => vi.useRealTimers())

const status = () => screen.getByRole('button').getAttribute('data-status')

test('una acción instantánea igual se ve cargando y luego listo, y vuelve al reposo', async () => {
  const onClick = vi.fn()
  render(<ActionButton onClick={onClick}>Exportar</ActionButton>)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(status()).toBe('loading')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(MIN_LOADING_MS)
  })
  expect(status()).toBe('success')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SUCCESS_MS)
  })
  expect(status()).toBe('idle')
})

test('espera a que termine una promesa lenta antes de la palomita', async () => {
  let finish!: () => void
  render(<ActionButton onClick={() => new Promise<void>((r) => (finish = r))}>Exportar</ActionButton>)
  fireEvent.click(screen.getByRole('button'))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(MIN_LOADING_MS * 3)
  })
  expect(status()).toBe('loading')
  await act(async () => {
    finish()
    await vi.advanceTimersByTimeAsync(0)
  })
  expect(status()).toBe('success')
})

test('si la acción avisa de un error con un toast, no hay palomita', async () => {
  render(<ActionButton onClick={() => toast('error', 'falló')}>Exportar</ActionButton>)
  fireEvent.click(screen.getByRole('button'))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(MIN_LOADING_MS)
  })
  expect(status()).toBe('idle')
})

test('un aviso de error anterior no cuenta como fallo de esta acción', async () => {
  toast('error', 'viejo')
  render(<ActionButton onClick={() => {}}>Exportar</ActionButton>)
  fireEvent.click(screen.getByRole('button'))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(MIN_LOADING_MS)
  })
  expect(status()).toBe('success')
})

test('no se lanza dos veces mientras trabaja', async () => {
  const onClick = vi.fn()
  render(<ActionButton onClick={onClick}>Exportar</ActionButton>)
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)
})
