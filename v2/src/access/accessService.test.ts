import { fake, resetStore, store } from './fakeFirestore'

vi.mock('firebase/firestore', async () => (await import('./fakeFirestore')).fake)
vi.mock('../auth/firebase', () => ({ db: {} }))

import {
  approveRequest,
  getMyRequest,
  listPendingRequests,
  rejectRequest,
  submitAccessRequest,
} from './accessService'

beforeEach(() => resetStore())

test('normaliza el correo y guarda status pending con solo las claves permitidas', async () => {
  const r = await submitAccessRequest({ email: '  Bob@X.com ', name: ' Bob ', reason: 'quiero' })
  expect(r).toBe('sent')
  const saved = store.get('accessRequests/bob@x.com')!
  expect(Object.keys(saved).sort()).toEqual(['createdAt', 'email', 'name', 'reason', 'status', 'uid'])
  expect(saved).toMatchObject({ email: 'bob@x.com', name: 'Bob', reason: 'quiero', status: 'pending', uid: null })
})

test('segundo envío del mismo correo devuelve alreadyExists', async () => {
  await submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })
  expect(await submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })).toBe('alreadyExists')
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

test('otros errores de Firestore devuelven error', async () => {
  const spy = vi.spyOn(fake, 'setDoc').mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'unavailable' }))
  expect(await submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })).toBe('error')
  spy.mockRestore()
})

test('getMyRequest devuelve null si no existe y la solicitud con createdAt numérico si existe', async () => {
  expect(await getMyRequest('bob@x.com')).toBeNull()
  await submitAccessRequest({ email: 'bob@x.com', name: 'Bob', uid: 'u1' })
  expect(await getMyRequest('Bob@x.com')).toMatchObject({
    email: 'bob@x.com',
    status: 'pending',
    uid: 'u1',
    createdAt: 1700000000000,
  })
})

test('approveRequest crea allowlist y marca approved', async () => {
  await submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })
  await approveRequest('bob@x.com', 'admin@x.com')
  expect(store.get('allowlist/bob@x.com')).toMatchObject({ addedBy: 'admin@x.com' })
  expect(store.get('accessRequests/bob@x.com')).toMatchObject({ status: 'approved' })
})

test('rejectRequest marca rejected sin tocar la allowlist; list solo devuelve pendientes', async () => {
  await submitAccessRequest({ email: 'bob@x.com', name: 'Bob' })
  await submitAccessRequest({ email: 'eve@x.com', name: 'Eve' })
  await rejectRequest('bob@x.com')
  expect(store.has('allowlist/bob@x.com')).toBe(false)
  expect(store.get('accessRequests/bob@x.com')).toMatchObject({ status: 'rejected' })
  expect((await listPendingRequests()).map((r) => r.email)).toEqual(['eve@x.com'])
})
