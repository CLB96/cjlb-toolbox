import { act, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import { Blob as NodeBlob } from 'node:buffer'
import type { ReactNode } from 'react'
import { startFresh } from '../../persistence/freshStart'
import { listSnapshots, loadSnapshot, saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { VectorizrStoreProvider, useVectorizrApi } from './VectorizrStoreProvider'
import { initialData, snapshotOf, type VectorizrSnapshot } from './store'
import { persistedChanged, useVectorizrPersistence } from './useVectorizrPersistence'

vi.mock('./logic/imageNormalize', () => ({
  loadImageFromBlob: vi.fn(async () => new Image()),
}))

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <UidProvider uid="u1">
      <VectorizrStoreProvider>{children}</VectorizrStoreProvider>
    </UidProvider>
  )
}

const setup = () =>
  renderHook(
    () => {
      const api = useVectorizrApi()
      return { api, tool: useVectorizrPersistence() }
    },
    { wrapper: Wrapper },
  )

// Blob de Node: el de jsdom no sobrevive al structured clone de fake-indexeddb
const blob = new NodeBlob(['jpeg-bytes'], { type: 'image/jpeg' }) as unknown as Blob

function seedSnap(): VectorizrSnapshot {
  return {
    ...snapshotOf(initialData()),
    step: 3,
    imageBlob: blob,
    imageWidth: 640,
    imageHeight: 480,
    scaleRef: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, realValue: 10, unit: 'cm' },
    scaleFactor: 1,
    threshold1: 40,
    threshold2: 120,
  }
}

test('restaura el último guardado y reconstruye la imagen desde el Blob', async () => {
  await saveSnapshot('u1', 'vectorizr', seedSnap())
  const { result } = setup()
  await waitFor(() => expect(result.current.tool.restored).toBe(true))
  await waitFor(() => expect(result.current.api.getState().image).not.toBeNull())
  const s = result.current.api.getState()
  expect(s).toMatchObject({ step: 3, imageWidth: 640, scaleFactor: 1, threshold1: 40, threshold2: 120 })
  expect(s.image!.blob.size).toBe(blob.size)
})

test('el Blob de la imagen hace ida y vuelta por IndexedDB', async () => {
  const { result } = setup()
  await waitFor(() => expect(result.current.tool.restored).toBe(true))
  act(() => result.current.api.getState().setImage({ blob, image: new Image() }, 10, 20))
  await act(() => result.current.tool.flush())
  const [meta] = await listSnapshots('u1', 'vectorizr')
  const snap = await loadSnapshot<VectorizrSnapshot>('u1', 'vectorizr', meta!.id)
    expect(snap!.data.imageBlob!.size).toBe(blob.size)
  expect(snap!.data).toMatchObject({ imageWidth: 10, imageHeight: 20 })
})

test('un cambio de zoom, pan o herramienta no guarda; un cambio de puntos sí', async () => {
  const { result } = setup()
  await waitFor(() => expect(result.current.tool.restored).toBe(true))
  act(() => {
    const s = result.current.api.getState()
    s.setZoom(4)
    s.setStagePos({ x: 9, y: 9 })
    s.setActiveTool('measure')
    s.pushHistory()
  })
  await act(() => result.current.tool.flush())
  expect(await listSnapshots('u1', 'vectorizr')).toHaveLength(0)
  act(() => result.current.api.getState().setContourPoints([{ id: '0', x: 1, y: 1, type: 'line' }]))
  await act(() => result.current.tool.flush())
  expect(await listSnapshots('u1', 'vectorizr')).toHaveLength(1)
})

test('cambiar el umbral también se guarda', async () => {
  const { result } = setup()
  await waitFor(() => expect(result.current.tool.restored).toBe(true))
  act(() => result.current.api.getState().setThreshold2(200))
  await act(() => result.current.tool.flush())
  const [meta] = await listSnapshots('u1', 'vectorizr')
  expect((await loadSnapshot<VectorizrSnapshot>('u1', 'vectorizr', meta!.id))!.data.threshold2).toBe(200)
})

test('"Empezar de cero" guarda lo actual y deja el estado inicial', async () => {
  await saveSnapshot('u1', 'vectorizr', seedSnap())
  const { result } = setup()
  await waitFor(() => expect(result.current.tool.restored).toBe(true))
  await act(() => startFresh('u1', 'vectorizr'))
  expect(result.current.api.getState().step).toBe(1)
  expect(result.current.api.getState().restoringBlob ?? result.current.api.getState().image).toBeNull()
})

test('terminar de cargar la imagen restaurada no cuenta como cambio', () => {
  const prev = { ...initialData(), restoringBlob: blob }
  const next = { ...prev, restoringBlob: null, image: { blob, image: new Image() } }
  expect(persistedChanged(next, prev)).toBe(false)
  expect(persistedChanged({ ...next, image: { blob: new Blob(['x']), image: new Image() } }, next)).toBe(true)
})
