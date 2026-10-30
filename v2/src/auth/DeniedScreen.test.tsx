import { render, screen } from '@testing-library/react'
import { DeniedScreen } from './DeniedScreen'

vi.mock('../access/accessService', () => ({ getMyRequest: vi.fn(), submitAccessRequest: vi.fn() }))
import { getMyRequest } from '../access/accessService'
const get = vi.mocked(getMyRequest)

beforeEach(() => vi.resetAllMocks())

const base = { email: 'ana@x.com', name: 'Ana', status: 'pending' as const, uid: 'u1', reason: '', createdAt: 1 }
const ui = <DeniedScreen email="ana@x.com" uid="u1" displayName="Ana" onSignOut={vi.fn()} />

test('con solicitud previa pendiente muestra el estado en vez del formulario', async () => {
  get.mockResolvedValue(base)
  render(ui)
  expect(await screen.findByText('Solicitud enviada, pendiente de aprobación')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Solicitar acceso' })).toBeNull()
})

test('sin solicitud previa muestra el formulario', async () => {
  get.mockResolvedValue(null)
  render(ui)
  expect(await screen.findByRole('button', { name: 'Solicitar acceso' })).toBeInTheDocument()
})

test('solicitud rechazada se informa', async () => {
  get.mockResolvedValue({ ...base, status: 'rejected' })
  render(ui)
  expect(await screen.findByText('Tu solicitud de acceso fue rechazada.')).toBeInTheDocument()
})
