import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccessRequestsPanel } from './AccessRequestsPanel'

vi.mock('./accessService', () => ({
  listPendingRequests: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}))
import { approveRequest, listPendingRequests } from './accessService'

const list = vi.mocked(listPendingRequests)
const req = (email: string) => ({
  email,
  name: 'N ' + email,
  reason: 'por favor',
  uid: null,
  status: 'pending' as const,
  createdAt: 1,
})

beforeEach(() => vi.resetAllMocks())

test('lista pendientes y aprueba recargando la lista', async () => {
  list.mockResolvedValueOnce([req('bob@x.com')]).mockResolvedValueOnce([])
  vi.mocked(approveRequest).mockResolvedValue()
  render(<AccessRequestsPanel adminEmail="admin@x.com" />)
  expect(await screen.findByText('bob@x.com')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
  expect(approveRequest).toHaveBeenCalledWith('bob@x.com', 'admin@x.com')
  expect(await screen.findByText('No hay solicitudes pendientes.')).toBeInTheDocument()
})
