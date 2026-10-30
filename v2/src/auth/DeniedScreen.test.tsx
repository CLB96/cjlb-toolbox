import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeniedScreen } from './DeniedScreen'

vi.mock('../access/accessService', () => ({
  getMyRequest: vi.fn(),
  submitAccessRequest: vi.fn(),
  watchMyAllowlist: vi.fn(),
}))
import { getMyRequest, watchMyAllowlist } from '../access/accessService'
const get = vi.mocked(getMyRequest)
const watch = vi.mocked(watchMyAllowlist)

beforeEach(() => {
  vi.resetAllMocks()
  watch.mockReturnValue(() => {})
})

const base = { email: 'ana@x.com', name: 'Ana', status: 'pending' as const, uid: 'u1', reason: '', createdAt: 1 }
const ui = <DeniedScreen email="ana@x.com" uid="u1" displayName="Ana" onSignOut={vi.fn()} onRecheck={vi.fn()} />

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

test('al aparecer en la allowlist vuelve a evaluar el acceso sin recargar', async () => {
  get.mockResolvedValue({ ...base, status: 'approved' })
  const onRecheck = vi.fn()
  render(<DeniedScreen email="ana@x.com" uid="u1" displayName="Ana" onSignOut={vi.fn()} onRecheck={onRecheck} />)
  expect(watch).toHaveBeenCalledWith('ana@x.com', onRecheck, expect.any(Function))
  watch.mock.calls[0][1]()
  expect(onRecheck).toHaveBeenCalledTimes(1)
  await screen.findByText('Tu solicitud fue aprobada. Entrando…')
})

test('el botón Comprobar de nuevo vuelve a evaluar el acceso', async () => {
  get.mockResolvedValue(base)
  const onRecheck = vi.fn()
  render(<DeniedScreen email="ana@x.com" uid="u1" displayName="Ana" onSignOut={vi.fn()} onRecheck={onRecheck} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Comprobar de nuevo' }))
  expect(onRecheck).toHaveBeenCalledTimes(1)
})
