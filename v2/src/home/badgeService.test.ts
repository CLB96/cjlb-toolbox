const fs = vi.hoisted(() => ({
  collection: vi.fn((_db: unknown, col: string) => ({ col })),
  doc: vi.fn((_db: unknown, col: string, id: string) => ({ path: `${col}/${id}` })),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}))
vi.mock('firebase/firestore', () => fs)
vi.mock('../auth/firebase', () => ({ db: {} }))

import { saveBadge, subscribeBadges } from './badgeService'

const docOf = (id: string, data: Record<string, unknown>) => ({ id, data: () => data })

beforeEach(() => vi.clearAllMocks())

test('subscribeBadges lee toolBadges y descarta valores no válidos', async () => {
  const unsub = vi.fn()
  fs.onSnapshot.mockImplementation((_ref, next: (s: unknown) => void) => {
    next({ docs: [docOf('gantt', { badge: 'updated' }), docOf('capaflow', { badge: null }), docOf('x', { badge: 'raro' }), docOf('y', {})] })
    return unsub
  })
  const onChange = vi.fn()
  const stop = subscribeBadges(onChange, vi.fn())
  await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ gantt: 'updated', capaflow: null }))
  expect(fs.collection).toHaveBeenCalledWith({}, 'toolBadges')
  stop()
  expect(unsub).toHaveBeenCalled()
})

test('si se cancela antes de cargar Firebase no se suscribe', async () => {
  const stop = subscribeBadges(vi.fn(), vi.fn())
  stop()
  await new Promise((r) => setTimeout(r, 0))
  expect(fs.onSnapshot).not.toHaveBeenCalled()
})

test('subscribeBadges pasa los errores al callback', async () => {
  fs.onSnapshot.mockImplementation((_ref, _next, error: (e: unknown) => void) => {
    error(new Error('permission-denied'))
    return vi.fn()
  })
  const onError = vi.fn()
  subscribeBadges(vi.fn(), onError)
  await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)))
})

test('saveBadge escribe solo el campo badge en toolBadges/{id}', async () => {
  fs.setDoc.mockResolvedValue(undefined)
  await saveBadge('gantt', null)
  expect(fs.setDoc).toHaveBeenCalledWith({ path: 'toolBadges/gantt' }, { badge: null })
})
