import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

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
