import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistoryPanel } from './HistoryPanel'
import * as store from './snapshotStore'
import { useToasts } from '../ui/toastStore'

beforeEach(() => useToasts.setState({ toasts: [] }))
afterEach(() => vi.restoreAllMocks())

test('un fallo al listar versiones muestra toast de error', async () => {
  vi.spyOn(store, 'listSnapshots').mockRejectedValue(new Error('idb'))
  render(<HistoryPanel toolId="gantt" onRestore={vi.fn()} />)
  await waitFor(() => expect(useToasts.getState().toasts.some((t) => t.kind === 'error')).toBe(true))
})

test('onRestore que rechaza muestra toast y no rechaza sin manejar', async () => {
  vi.spyOn(store, 'listSnapshots').mockResolvedValue([
    { id: 'u:gantt:1', uid: 'local', toolId: 'gantt', savedAt: 1 },
  ])
  const onRestore = vi.fn().mockRejectedValue(new Error('x'))
  render(<HistoryPanel toolId="gantt" onRestore={onRestore} />)
  await userEvent.click(await screen.findByRole('button'))
  expect(onRestore).toHaveBeenCalledWith('u:gantt:1')
  await waitFor(() => expect(useToasts.getState().toasts.some((t) => t.kind === 'error')).toBe(true))
})

test('se refresca cuando cambia lastSavedAt', async () => {
  const spy = vi.spyOn(store, 'listSnapshots').mockResolvedValue([])
  const { rerender } = render(<HistoryPanel toolId="gantt" onRestore={vi.fn()} lastSavedAt={1} />)
  await screen.findByText('Aún no hay versiones guardadas.')
  spy.mockResolvedValue([{ id: 'local:gantt:2', uid: 'local', toolId: 'gantt', savedAt: 2 }])
  rerender(<HistoryPanel toolId="gantt" onRestore={vi.fn()} lastSavedAt={2} />)
  expect(await screen.findByRole('button', { name: 'Restaurar' })).toBeInTheDocument()
  expect(spy).toHaveBeenCalledTimes(2)
})
