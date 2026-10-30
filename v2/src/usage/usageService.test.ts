const fs = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  doc: vi.fn((_db: unknown, c: string, id: string) => ({ c, id })),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  increment: vi.fn((n: number) => ({ inc: n })),
}))
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore')
  return { ...actual, ...fs }
})
vi.mock('../auth/firebase', () => ({ db: {} }))
import { beat, recordLogin, startSession } from './usageService'

const user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana', emailVerified: true }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
  fs.addDoc.mockReset().mockResolvedValue({ id: 's1' })
  fs.updateDoc.mockReset().mockResolvedValue(undefined)
  fs.increment.mockClear()
})
afterEach(() => vi.useRealTimers())

test('startSession crea exactamente las claves de las reglas', async () => {
  await startSession({ ...user, displayName: 'N'.repeat(100) }, 'gantt')
  const [col, data] = fs.addDoc.mock.calls[0]
  expect(col).toEqual({ name: 'sessions' })
  expect(Object.keys(data).sort()).toEqual(['activeSeconds', 'email', 'lastBeat', 'name', 'start', 'tool', 'uid'])
  expect(data).toMatchObject({ uid: 'u1', email: 'a@b.com', tool: 'gantt', activeSeconds: 0, start: 'SERVER_TS', lastBeat: 'SERVER_TS' })
  expect(data.name).toHaveLength(80)
})

test('recordLogin crea solo uid, email, name, at (serverTimestamp)', async () => {
  await recordLogin(user)
  const [col, data] = fs.addDoc.mock.calls[0]
  expect(col).toEqual({ name: 'logins' })
  expect(data).toEqual({ uid: 'u1', email: 'a@b.com', name: 'Ana', at: 'SERVER_TS' })
})

test('beat envía solo activeSeconds (increment) y lastBeat', async () => {
  await startSession(user, 'gantt')
  vi.setSystemTime(1_060_000)
  await beat('s1', 60)
  expect(fs.updateDoc.mock.calls[0][1]).toEqual({ activeSeconds: { inc: 60 }, lastBeat: 'SERVER_TS' })
})

test('beat limita a 120 y a los segundos reales transcurridos', async () => {
  await startSession(user, 'gantt')
  vi.setSystemTime(1_000_000 + 30_000)
  await beat('s1', 100)
  expect(fs.increment).toHaveBeenLastCalledWith(30)
  vi.setSystemTime(1_000_000 + 30_000 + 500_000)
  await beat('s1', 500)
  expect(fs.increment).toHaveBeenLastCalledWith(120)
  await beat('s1', -5)
  expect(fs.increment).toHaveBeenLastCalledWith(0)
})

test('lastSuccess se fija al resolver updateDoc, no antes del envío', async () => {
  await startSession(user, 'gantt')
  vi.setSystemTime(1_060_000)
  fs.updateDoc.mockImplementationOnce(async () => {
    vi.setSystemTime(1_070_000)
  })
  await beat('s1', 60)
  vi.setSystemTime(1_080_000)
  await beat('s1', 60)
  expect(fs.increment).toHaveBeenLastCalledWith(10)
})
