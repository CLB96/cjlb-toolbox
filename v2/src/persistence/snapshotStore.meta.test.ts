import { clear, createStore } from 'idb-keyval'

const requested = vi.hoisted(() => ({ keys: [] as unknown[] }))
vi.mock('idb-keyval', async (importOriginal) => {
  const m = await importOriginal<typeof import('idb-keyval')>()
  return {
    ...m,
    get: (k: IDBValidKey, s?: Parameters<typeof m.get>[1]) => {
      requested.keys.push(k)
      return m.get(k, s)
    },
    getMany: (ks: IDBValidKey[], s?: Parameters<typeof m.getMany>[1]) => {
      requested.keys.push(...ks)
      return m.getMany(ks, s)
    },
  }
})

import { latestPerTool, listSnapshots, loadSnapshot, MAX_SNAPSHOTS, saveSnapshot } from './snapshotStore'

/** Las claves de datos son `uid:toolId:savedAt`; las internas empiezan por `~`. */
const isDataKey = (k: unknown) => typeof k === 'string' && !k.startsWith('~')

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  requested.keys = []
})

test('listar y latestPerTool no leen los registros de datos', async () => {
  await saveSnapshot('u1', 'gantt', { big: 'x'.repeat(1000) }, 'a')
  await saveSnapshot('u1', 'gapcheck', { v: 2 })
  requested.keys = []
  const list = await listSnapshots('u1', 'gantt')
  const latest = await latestPerTool('u1')
  expect(list).toHaveLength(1)
  expect(list[0]?.label).toBe('a')
  expect(latest.map((m) => m.toolId).sort()).toEqual(['gantt', 'gapcheck'])
  expect(requested.keys.filter(isDataKey)).toEqual([])
})

test('guardar y podar no leen los registros de datos', async () => {
  for (let i = 0; i < MAX_SNAPSHOTS; i++) await saveSnapshot('u1', 'gantt', { i })
  requested.keys = []
  await saveSnapshot('u1', 'gantt', { i: 99 })
  expect(requested.keys.filter(isDataKey)).toEqual([])
  const list = await listSnapshots('u1', 'gantt')
  expect(list).toHaveLength(MAX_SNAPSHOTS)
  const newest = await loadSnapshot<{ i: number }>('u1', 'gantt', list[0]!.id)
  expect(newest?.data).toEqual({ i: 99 })
})
