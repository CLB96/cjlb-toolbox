import { render, waitFor } from '@testing-library/react'
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
