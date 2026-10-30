import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', email: 'a@b.com', displayName: 'Ana', emailVerified: true } }),
}))
vi.mock('../usage/UsagePage', () => ({ UsagePage: () => <div>pagina-uso</div> }))

beforeEach(() => {
  window.location.hash = '#/usage'
})

test('no admin en #/usage: redirige a home y no renderiza UsagePage', async () => {
  render(<AppShell isAdmin={false} />)
  expect(await screen.findByRole('heading', { name: /Hola/ })).toBeInTheDocument()
  expect(screen.queryByText('pagina-uso')).toBeNull()
  expect(window.location.hash).toBe('#/home')
})

test('admin en #/usage ve UsagePage', async () => {
  render(<AppShell isAdmin />)
  expect(await screen.findByText('pagina-uso')).toBeInTheDocument()
})
