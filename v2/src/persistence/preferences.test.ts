import { clear, createStore } from 'idb-keyval'
import { loadPreference, savePreference } from './preferences'
import { listSnapshots, saveSnapshot, latestPerTool } from './snapshotStore'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})

test('guarda y carga por uid; otro uid no la ve', async () => {
  await savePreference('u1', 'k', { a: 1 })
  expect(await loadPreference('u1', 'k')).toEqual({ a: 1 })
  expect(await loadPreference('u2', 'k')).toBeUndefined()
})

test('sin preferencia devuelve undefined', async () => {
  expect(await loadPreference('u1', 'nada')).toBeUndefined()
})

test('listSnapshots y latestPerTool ignoran claves de preferencia y viceversa', async () => {
  await savePreference('u1', 'bondline', { a: 1 })
  expect(await listSnapshots('u1', 'bondline')).toEqual([])
  expect(await latestPerTool('u1')).toEqual([])
  await saveSnapshot('u1', 'bondline', { s: 1 })
  expect(await listSnapshots('u1', 'bondline')).toHaveLength(1)
  expect(await loadPreference('u1', 'bondline')).toEqual({ a: 1 })
})

test('la poda de snapshots no borra preferencias', async () => {
  await savePreference('u1', 'bondline', { a: 1 })
  for (let i = 0; i < 12; i++) await saveSnapshot('u1', 'bondline', { i })
  expect(await loadPreference('u1', 'bondline')).toEqual({ a: 1 })
})
