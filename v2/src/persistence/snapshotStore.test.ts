import { clear, createStore } from 'idb-keyval'
import {
  consumeFreshStart,
  latestPerTool,
  listSnapshots,
  loadSnapshot,
  markFreshStart,
  saveSnapshot,
  stripLargeFiles,
  MAX_FILE_BYTES,
} from './snapshotStore'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(1_000)
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})
afterEach(() => vi.useRealTimers())

function fakeBlob(size: number): Blob {
  const b = new Blob(['x'])
  Object.defineProperty(b, 'size', { value: size })
  return b
}

test('poda a 10 versiones y descarta la más antigua', async () => {
  for (let i = 0; i < 12; i++) {
    vi.setSystemTime(1_000 + i * 10)
    await saveSnapshot('u1', 'gapcheck', { i })
  }
  const list = await listSnapshots('u1', 'gapcheck')
  expect(list).toHaveLength(10)
  expect(list[0].savedAt).toBe(1_110)
  expect(list[list.length - 1].savedAt).toBe(1_020)
  expect(list.some((m) => m.savedAt === 1_000)).toBe(false)
})

test('loadSnapshot devuelve los datos y null si no existe', async () => {
  const meta = await saveSnapshot('u1', 'gantt', { a: 1 }, 'v1')
  const snap = await loadSnapshot<{ a: number }>('u1', 'gantt', meta.id)
  expect(snap?.data).toEqual({ a: 1 })
  expect(snap?.label).toBe('v1')
  expect(await loadSnapshot('u1', 'gantt', 'nope')).toBeNull()
})

test('dos guardados en el mismo milisegundo no se pisan', async () => {
  await saveSnapshot('u1', 'gantt', 1)
  await saveSnapshot('u1', 'gantt', 2)
  expect(await listSnapshots('u1', 'gantt')).toHaveLength(2)
})

test('latestPerTool aísla por uid, uno por herramienta y respeta el límite', async () => {
  await saveSnapshot('u1', 'gantt', 1)
  vi.setSystemTime(2_000)
  await saveSnapshot('u1', 'gantt', 2)
  vi.setSystemTime(3_000)
  await saveSnapshot('u2', 'gapcheck', 3)
  vi.setSystemTime(4_000)
  await saveSnapshot('u1', 'bondline', 4)
  const latest = await latestPerTool('u1')
  expect(latest.map((m) => m.toolId)).toEqual(['bondline', 'gantt'])
  expect(latest.every((m) => m.uid === 'u1')).toBe(true)
  expect(await latestPerTool('u1', 1)).toHaveLength(1)
})

test('markFreshStart se consume una sola vez y conserva el historial', async () => {
  await saveSnapshot('u1', 'gantt', 1)
  expect(await consumeFreshStart('u1', 'gantt')).toBe(false)
  await markFreshStart('u1', 'gantt')
  expect(await consumeFreshStart('u1', 'gantt')).toBe(true)
  expect(await consumeFreshStart('u1', 'gantt')).toBe(false)
  expect(await listSnapshots('u1', 'gantt')).toHaveLength(1)
  expect(await latestPerTool('u1')).toHaveLength(1)
})

test('omite blobs > 20 MB, conserva los pequeños y marca el meta', async () => {
  const small = fakeBlob(MAX_FILE_BYTES)
  const big = fakeBlob(MAX_FILE_BYTES + 1)
  const out = stripLargeFiles({ small, nested: [{ big }], n: 1 })
  expect(out.skipped).toBe(true)
  expect(out.value).toEqual({ small, nested: [{ big: null }], n: 1 })

  const meta = await saveSnapshot('u1', 'vectorizr', { n: 1, big })
  expect(meta.skippedLargeFiles).toBe(true)
  const snap = await loadSnapshot<{ n: number; big: unknown }>('u1', 'vectorizr', meta.id)
  expect(snap?.data).toEqual({ n: 1, big: null })
  expect(snap?.skippedLargeFiles).toBe(true)

  const ok = await saveSnapshot('u1', 'vectorizr', { n: 2 })
  expect(ok.skippedLargeFiles).toBeUndefined()
})

function fakeBuffer(size: number): ArrayBuffer {
  const b = new ArrayBuffer(1)
  Object.defineProperty(b, 'byteLength', { value: size })
  return b
}

function fakeTyped(size: number): Uint8Array {
  const a = new Uint8Array(1)
  Object.defineProperty(a, 'byteLength', { value: size })
  return a
}

test('omite ArrayBuffer y typed arrays > 20 MB y conserva los pequeños', () => {
  const smallBuf = fakeBuffer(MAX_FILE_BYTES)
  const smallArr = fakeTyped(10)
  const out = stripLargeFiles({
    smallBuf,
    smallArr,
    bigBuf: fakeBuffer(MAX_FILE_BYTES + 1),
    bigArr: fakeTyped(MAX_FILE_BYTES + 1),
  })
  expect(out.skipped).toBe(true)
  expect(out.value.smallBuf).toBe(smallBuf)
  expect(out.value.smallArr).toBe(smallArr)
  expect(out.value.bigBuf).toBeNull()
  expect(out.value.bigArr).toBeNull()
})

test('recorre Map y Set (claves y valores) devolviendo copias nuevas', () => {
  const big = fakeBlob(MAX_FILE_BYTES + 1)
  const small = fakeBlob(1)
  const map = new Map<string, unknown>([
    ['big', big],
    ['nested', { big }],
    ['small', small],
  ])
  const set = new Set<unknown>([big, small])
  const out = stripLargeFiles({ map, set })
  expect(out.skipped).toBe(true)
  expect(out.value.map).not.toBe(map)
  expect(out.value.map).toBeInstanceOf(Map)
  expect(out.value.map.get('big')).toBeNull()
  expect(out.value.map.get('nested')).toEqual({ big: null })
  expect(out.value.map.get('small')).toBe(small)
  expect(out.value.set).toBeInstanceOf(Set)
  expect([...out.value.set]).toEqual([null, small])
  expect(map.get('big')).toBe(big)
})

test('ciclos: conserva la estructura sin recursión infinita', () => {
  type Node = { n: number; self?: Node; list: unknown[]; map: Map<string, unknown> }
  const a: Node = { n: 1, list: [], map: new Map() }
  a.self = a
  a.list.push(a)
  a.map.set('a', a)
  const out = stripLargeFiles(a)
  expect(out.skipped).toBe(false)
  expect(out.value).not.toBe(a)
  expect(out.value.self).toBe(out.value)
  expect(out.value.list[0]).toBe(out.value)
  expect(out.value.map.get('a')).toBe(out.value)
})

test('listSnapshots conserva label y skippedLargeFiles', async () => {
  await saveSnapshot('u1', 'gantt', { big: fakeBlob(MAX_FILE_BYTES + 1) }, 'etiqueta')
  const [meta] = await listSnapshots('u1', 'gantt')
  expect(meta).toMatchObject({ label: 'etiqueta', skippedLargeFiles: true, uid: 'u1', toolId: 'gantt' })
  expect(meta).not.toHaveProperty('data')
})
