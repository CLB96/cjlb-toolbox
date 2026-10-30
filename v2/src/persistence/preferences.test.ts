import { clear, createStore } from 'idb-keyval'
import { loadPreference, savePreference } from './preferences'
import { saveSnapshot } from './snapshotStore'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})

test('guarda y carga por uid; otro uid no la ve', async () => {
  await savePreference('u1', 'k', { a: 1 })
  expect(await loadPreference('u1', 'k')).toEqual({ a: 1 })
  expect(await loadPreference('u2', 'k')).toBeUndefined()
})

test('la poda de snapshots no borra preferencias', async () => {
  await savePreference('u1', 'bondline', { a: 1 })
  for (let i = 0; i < 12; i++) await saveSnapshot('u1', 'bondline', { i })
  expect(await loadPreference('u1', 'bondline')).toEqual({ a: 1 })
})
