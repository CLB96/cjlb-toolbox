import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getMyRequest, submitAccessRequest } from './access/accessService'
import { useToasts } from './ui/toastStore'
import type { AuthStatus } from './auth/useAuth'

const authState = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
vi.mock('./auth/useAuth', () => ({ useAuth: () => authState.value }))

vi.mock('./access/accessService', () => ({
  usePendingCount: () => 0,
  getMyRequest: vi.fn().mockResolvedValue(null),
  submitAccessRequest: vi.fn(),
  watchMyAllowlist: () => () => {},
}))

vi.mock('./usage/usageService', () => ({
  recordLogin: vi.fn().mockResolvedValue(undefined),
  startSession: vi.fn().mockResolvedValue('s1'),
  beat: vi.fn().mockResolvedValue(undefined),
}))

import App from './App'

const user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana', emailVerified: true }
function setAuth(status: AuthStatus, extra: Record<string, unknown> = {}) {
  authState.value = {
    status,
    user: status === 'signedOut' || status === 'loading' ? null : user,
    isAdmin: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
    sendVerification: vi.fn(),
    reloadUser: vi.fn(),
    retry: vi.fn(),
    ...extra,
  }
}

beforeEach(() => {
  window.location.hash = '#/home'
  localStorage.clear()
  useToasts.setState({ toasts: [] })
  vi.mocked(getMyRequest).mockResolvedValue(null)
})

test('allowed: renderiza el shell con logo, pestañas y menú de usuario', () => {
  setAuth('allowed')
  render(<App />)
  expect(screen.getByAltText('CJLB')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Inicio' })).toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Uso' })).toBeNull()
  expect(screen.getByText('a@b.com')).toBeInTheDocument()
})

test('signedOut muestra el login', () => {
  setAuth('signedOut')
  render(<App />)
  expect(screen.getByRole('button', { name: 'Entrar con Google' })).toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Inicio' })).toBeNull()
})

test('denied muestra Sin acceso', async () => {
  setAuth('denied')
  render(<App />)
  expect(screen.getByText('Sin acceso')).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Solicitar acceso' })).toBeInTheDocument()
})

test('unverified muestra Verifica tu correo', () => {
  setAuth('unverified')
  render(<App />)
  expect(screen.getByText('Verifica tu correo')).toBeInTheDocument()
})

test('denied: si falla la solicitud el toast se muestra', async () => {
  vi.mocked(submitAccessRequest).mockResolvedValue('error')
  setAuth('denied')
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: 'Solicitar acceso' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo enviar la solicitud')
})
