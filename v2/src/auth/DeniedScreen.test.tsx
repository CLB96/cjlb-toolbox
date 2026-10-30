import { render, screen } from '@testing-library/react'
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

test('al aparecer en la allowlist vuelve a evaluar el acceso sin recargar', async () => {
  get.mockResolvedValue({ ...base, status: 'approved' })
  const onRecheck = vi.fn()
  render(<DeniedScreen email="ana@x.com" uid="u1" displayName="Ana" onSignOut={vi.fn()} onRecheck={onRecheck} />)
  expect(watch).toHaveBeenCalledWith('ana@x.com', onRecheck, expect.any(Function))
  watch.mock.calls[0][1]()
  expect(onRecheck).toHaveBeenCalledTimes(1)
  await screen.findByText('Tu solicitud fue aprobada. Entrando…')
})
