import { act, renderHook, waitFor } from '@testing-library/react'
import type { AppUser } from './authService'

vi.mock('./authService', () => ({
  authService: {
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
    onUser: vi.fn(),
    isAllowed: vi.fn(),
    fetchAdminEmail: vi.fn(),
    sendVerification: vi.fn(),
    reloadUser: vi.fn(),
  },
}))

import { authService } from './authService'
import { useAuth } from './useAuth'
import { useToasts } from '../ui/toastStore'

const svc = vi.mocked(authService)
let emit: (u: AppUser | null) => void

function user(over: Partial<AppUser> = {}): AppUser {
  return { uid: 'u1', email: 'fulano@gmail.com', displayName: null, emailVerified: true, ...over }
}

beforeEach(() => {
  vi.resetAllMocks()
  useToasts.setState({ toasts: [] })
  svc.onUser.mockImplementation((cb) => {
    emit = cb
    return () => {}
  })
  svc.isAllowed.mockResolvedValue(true)
  svc.fetchAdminEmail.mockResolvedValue(null)
})

test('empieza en loading y pasa a signedOut sin usuario', async () => {
  const { result } = renderHook(() => useAuth())
  expect(result.current.status).toBe('loading')
  act(() => emit(null))
  await waitFor(() => expect(result.current.status).toBe('signedOut'))
})

test('correo en allowlist -> allowed', async () => {
  const { result } = renderHook(() => useAuth())
  act(() => emit(user()))
  await waitFor(() => expect(result.current.status).toBe('allowed'))
  expect(result.current.user?.uid).toBe('u1')
})

test('correo fuera de allowlist -> denied', async () => {
  svc.isAllowed.mockResolvedValue(false)
  const { result } = renderHook(() => useAuth())
  act(() => emit(user()))
  await waitFor(() => expect(result.current.status).toBe('denied'))
})

test('isAllowed recibe el correo en minúsculas', async () => {
  const { result } = renderHook(() => useAuth())
  act(() => emit(user({ email: 'fulano@gmail.com' })))
  await waitFor(() => expect(result.current.status).toBe('allowed'))
  expect(svc.isAllowed).toHaveBeenCalledWith('fulano@gmail.com')
})

test('isAdmin solo si el correo coincide con el admin (sin distinguir mayúsculas)', async () => {
  svc.fetchAdminEmail.mockResolvedValue('Fulano@Gmail.com')
  const { result } = renderHook(() => useAuth())
  act(() => emit(user()))
  await waitFor(() => expect(result.current.status).toBe('allowed'))
  expect(result.current.isAdmin).toBe(true)
})

test('isAdmin falso si el admin es otro', async () => {
  svc.fetchAdminEmail.mockResolvedValue('otro@gmail.com')
  const { result } = renderHook(() => useAuth())
  act(() => emit(user()))
  await waitFor(() => expect(result.current.status).toBe('allowed'))
  expect(result.current.isAdmin).toBe(false)
})

test('fallo al leer admin: allowed, no admin y toast', async () => {
  svc.fetchAdminEmail.mockRejectedValue(new Error('net'))
  const { result } = renderHook(() => useAuth())
  act(() => emit(user()))
  await waitFor(() => expect(result.current.status).toBe('allowed'))
  expect(result.current.isAdmin).toBe(false)
  expect(useToasts.getState().toasts).toHaveLength(1)
})

test('correo sin verificar -> unverified y no consulta allowlist', async () => {
  const { result } = renderHook(() => useAuth())
  act(() => emit(user({ emailVerified: false })))
  await waitFor(() => expect(result.current.status).toBe('unverified'))
  expect(svc.isAllowed).not.toHaveBeenCalled()
})

test('al verificar tras reloadUser pasa a allowed', async () => {
  const { result } = renderHook(() => useAuth())
  act(() => emit(user({ emailVerified: false })))
  await waitFor(() => expect(result.current.status).toBe('unverified'))
  act(() => emit(user({ emailVerified: true })))
  await waitFor(() => expect(result.current.status).toBe('allowed'))
})

test('fallo de isAllowed -> error con toast, y retry reevalúa', async () => {
  svc.isAllowed.mockRejectedValueOnce(new Error('net'))
  const { result } = renderHook(() => useAuth())
  act(() => emit(user()))
  await waitFor(() => expect(result.current.status).toBe('error'))
  expect(useToasts.getState().toasts).toHaveLength(1)
  await act(async () => {
    await result.current.retry()
  })
  await waitFor(() => expect(result.current.status).toBe('allowed'))
})
