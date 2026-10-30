import { renderHook } from '@testing-library/react'
import { fake, resetStore, store } from './fakeFirestore'
import { useToasts } from '../ui/toastStore'

vi.mock('firebase/firestore', async () => (await import('./fakeFirestore')).fake)
vi.mock('../auth/firebase', () => ({ db: {} }))

import {
  approveRequest,
  submitAccessRequest,
  SUBMIT_TIMEOUT_MS,
  usePendingCount,
} from './accessService'

beforeEach(() => resetStore())

test('normaliza el correo y guarda status pending con solo las claves permitidas', async () => {
  const r = await submitAccessRequest({ email: '  Bob@X.com ', name: ' Bob ', reason: 'quiero' })
  expect(r).toBe('sent')
  const saved = store.get('accessRequests/bob@x.com')!
  expect(Object.keys(saved).sort()).toEqual(['createdAt', 'email', 'name', 'reason', 'status', 'uid'])
  expect(saved).toMatchObject({ email: 'bob@x.com', name: 'Bob', reason: 'quiero', status: 'pending', uid: null })
})

test('honeypot con texto devuelve ignored y no escribe nada', async () => {
  const r = await submitAccessRequest({ email: 'bob@x.com', name: 'Bob', honeypot: 'spam' })
  expect(r).toBe('ignored')
  expect(store.size).toBe(0)
})

test('entradas fuera de los límites de las reglas devuelven error sin escribir', async () => {
  expect(await submitAccessRequest({ email: 'bob@x.com', name: '' })).toBe('error')
  expect(await submitAccessRequest({ email: 'bob@x.com', name: 'a'.repeat(81) })).toBe('error')
  expect(await submitAccessRequest({ email: 'bob@x.com', name: 'Bob', reason: 'a'.repeat(501) })).toBe('error')
  expect(await submitAccessRequest({ email: 'no-es-correo', name: 'Bob' })).toBe('error')
  expect(store.size).toBe(0)
})

test('approveRequest crea allowlist y marca approved', async () => {
  await submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })
  await approveRequest('bob@x.com', 'admin@x.com')
  expect(store.get('allowlist/bob@x.com')).toMatchObject({ addedBy: 'admin@x.com' })
  expect(store.get('accessRequests/bob@x.com')).toMatchObject({ status: 'approved' })
})

test('si setDoc nunca responde (offline), a los 15 s devuelve error', async () => {
  vi.useFakeTimers()
  const spy = vi.spyOn(fake, 'setDoc').mockReturnValueOnce(new Promise(() => {}))
  const p = submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })
  await vi.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS)
  expect(await p).toBe('error')
  spy.mockRestore()
  vi.useRealTimers()
})

test('usePendingCount muestra un toast si el listener falla y devuelve 0', () => {
  useToasts.setState({ toasts: [] })
  const spy = vi.spyOn(fake, 'onSnapshot').mockImplementationOnce(((_q: unknown, _n: unknown, err: () => void) => {
    err()
    return () => {}
  }) as never)
  const { result } = renderHook(() => usePendingCount(true))
  expect(result.current).toBe(0)
  expect(useToasts.getState().toasts).toHaveLength(1)
  spy.mockRestore()
})
