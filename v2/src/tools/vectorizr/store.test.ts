import { createVectorizrStore, resetInto, restoreInto, snapshotOf, THRESHOLD_LIMITS, type VectorizrSnapshot } from './store'
import type { ContourPoint } from './types'

vi.mock('./logic/imageNormalize', () => ({
  loadImageFromBlob: vi.fn(async () => {
    const img = new Image()
    img.dataset.restored = '1'
    return img
  }),
}))

const pt = (id: string, x = 0, y = 0): ContourPoint => ({ id, x, y, type: 'line' })

describe('store de VectoriZr (port de appStore)', () => {
  it('arranca con los valores del original y los umbrales 50/150', () => {
    const s = createVectorizrStore().getState()
    expect(s.step).toBe(1)
    expect(s.image).toBeNull()
    expect(s.scaleFactor).toBe(0)
    expect(s.activeToolId).toBe('select')
    expect(s.zoom).toBe(1)
    expect(s.history).toEqual([])
    expect(s.historyIndex).toBe(-1)
    expect([s.detectionMethod, s.threshold1, s.threshold2]).toEqual([0, 50, 150])
  })

  it('pushHistory + undo + redo recorren las instantáneas del trazo activo', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    s().setContourPoints([pt('a')])
    s().pushHistory()
    s().setContourPoints([pt('a'), pt('b')])
    s().pushHistory()
    s().undo()
    expect(s().contourPoints.map((p) => p.id)).toEqual(['a'])
    s().undo() // en el índice 0 no hace nada
    expect(s().historyIndex).toBe(0)
    s().redo()
    expect(s().contourPoints.map((p) => p.id)).toEqual(['a', 'b'])
    s().redo() // al final no hace nada
    expect(s().historyIndex).toBe(1)
  })

  it('pushHistory tras deshacer descarta el futuro', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    for (const ids of [['a'], ['a', 'b'], ['a', 'b', 'c']]) {
      s().setContourPoints(ids.map((i) => pt(i)))
      s().pushHistory()
    }
    s().undo()
    s().undo()
    s().setContourPoints([pt('z')])
    s().pushHistory()
    expect(s().history).toHaveLength(2)
    s().redo()
    expect(s().contourPoints.map((p) => p.id)).toEqual(['z'])
  })

  it('las instantáneas son copias: mutar el trazo no cambia el historial', () => {
    const api = createVectorizrStore()
    const p = pt('a', 1, 1)
    api.getState().setContourPoints([p])
    api.getState().pushHistory()
    p.x = 99
    expect(api.getState().history[0]!.points[0]!.x).toBe(1)
  })

  it('addNewPath guarda el trazo activo, vacía el activo y borra el historial', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    s().setContourPoints([pt('a'), pt('b')])
    s().pushHistory()
    s().addNewPath()
    expect(s().paths).toHaveLength(1)
    expect(s().contourPoints).toEqual([])
    expect(s().history).toEqual([])
    expect(s().historyIndex).toBe(-1)
  })

  it('addNewPath con menos de 2 puntos no hace nada', () => {
    const api = createVectorizrStore()
    api.getState().setContourPoints([pt('a')])
    api.getState().addNewPath()
    expect(api.getState().paths).toEqual([])
    expect(api.getState().contourPoints).toHaveLength(1)
  })

  it('removePathAt y setPaths', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    s().setPaths([[pt('1')], [pt('2')], [pt('3')]], [pt('x')])
    expect(s().contourPoints.map((p) => p.id)).toEqual(['x'])
    s().removePathAt(1)
    expect(s().paths.map((p) => p[0]!.id)).toEqual(['1', '3'])
    s().setPaths([])
    expect(s().contourPoints).toEqual([])
  })

  it('umbrales: el bajo siempre queda por debajo del alto y dentro de rango (M19)', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    s().setThreshold1(180)
    expect(s().threshold1).toBe(149)
    s().setThreshold2(40)
    expect(s().threshold2).toBe(150) // mínimo 50 y > bajo (149)
    s().setThreshold1(5)
    expect(s().threshold1).toBe(THRESHOLD_LIMITS.low.min)
    s().setThreshold2(55)
    expect(s().threshold2).toBe(55)
    s().setThreshold2(999)
    expect(s().threshold2).toBe(THRESHOLD_LIMITS.high.max)
  })

  it('setDetectionMethod, herramienta, zoom, posición, rotación y exportado', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    s().setDetectionMethod(1)
    s().setActiveTool('measure')
    s().setZoom(2)
    s().setStagePos({ x: 3, y: 4 })
    s().setImageRotation(90)
    s().setExported(true)
    expect(s()).toMatchObject({ detectionMethod: 1, activeToolId: 'measure', zoom: 2, stagePos: { x: 3, y: 4 }, imageRotation: 90, exported: true })
  })

  it('reset vuelve al estado inicial, umbrales incluidos', () => {
    const api = createVectorizrStore()
    const s = () => api.getState()
    s().setStep(4)
    s().setThreshold1(20)
    s().setContourPoints([pt('a')])
    s().reset()
    expect(s().step).toBe(1)
    expect(s().threshold1).toBe(50)
    expect(s().contourPoints).toEqual([])
  })

  it('cada store es independiente', () => {
    const a = createVectorizrStore()
    const b = createVectorizrStore()
    a.getState().setStep(3)
    expect(b.getState().step).toBe(1)
  })
})

describe('snapshotOf / restoreInto / resetInto', () => {
  const blob = new Blob(['jpg'], { type: 'image/jpeg' })

  function full(): VectorizrSnapshot {
    return {
      step: 4,
      imageBlob: blob,
      imageWidth: 800,
      imageHeight: 600,
      scaleRef: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, realValue: 5, unit: 'cm' },
      scaleFactor: 5,
      contourPoints: [pt('a', 1, 2)],
      paths: [[pt('b'), pt('c')]],
      imageRotation: 180,
      detectionMethod: 1,
      threshold1: 30,
      threshold2: 90,
    }
  }

  it('el snapshot es clonable y no incluye historial, zoom, pan, herramienta ni exportado', () => {
    const api = createVectorizrStore()
    api.getState().setImage({ blob, image: new Image() }, 800, 600)
    api.getState().setZoom(3)
    const snap = snapshotOf(api.getState())
    expect(snap.imageBlob).toBe(blob)
    expect(Object.keys(snap)).not.toEqual(expect.arrayContaining(['history']))
    for (const k of ['history', 'historyIndex', 'zoom', 'stagePos', 'activeToolId', 'exported', 'image']) expect(snap).not.toHaveProperty(k)
    expect(() => structuredClone({ ...snap, imageBlob: null })).not.toThrow()
  })

  it('restoreInto aplica los datos y reconstruye la imagen desde el Blob', async () => {
    const api = createVectorizrStore()
    restoreInto(api, full())
    expect(api.getState()).toMatchObject({ step: 4, imageWidth: 800, scaleFactor: 5, imageRotation: 180, threshold1: 30 })
    // mientras carga, el snapshot conserva el Blob
    expect(snapshotOf(api.getState()).imageBlob).toBe(blob)
    await vi.waitFor(() => expect(api.getState().image).not.toBeNull())
    expect(api.getState().image!.blob).toBe(blob)
    expect(api.getState().image!.image.dataset.restored).toBe('1')
    expect(api.getState().history).toEqual([])
  })

  it('sin imagen guardada vuelve al paso 1', () => {
    const api = createVectorizrStore()
    restoreInto(api, { ...full(), imageBlob: null })
    expect(api.getState().step).toBe(1)
  })

  it('resetInto deja el estado inicial', () => {
    const api = createVectorizrStore()
    restoreInto(api, full())
    resetInto(api)
    expect(api.getState().step).toBe(1)
    expect(snapshotOf(api.getState()).imageBlob).toBeNull()
  })
})

describe('object URLs de la imagen', () => {
  it('revoca la URL blob de la imagen anterior al reemplazarla o al volver a empezar', () => {
    const revoke = vi.fn()
    Object.assign(URL, { revokeObjectURL: revoke })
    const api = createVectorizrStore()
    const img = (src: string) => { const i = new Image(); Object.defineProperty(i, 'src', { value: src }); return i }
    api.getState().setImage({ blob: new Blob(['a']), image: img('blob:a') }, 10, 10)
    api.getState().setImage({ blob: new Blob(['b']), image: img('blob:b') }, 10, 10)
    expect(revoke).toHaveBeenCalledWith('blob:a')
    api.getState().reset()
    expect(revoke).toHaveBeenCalledWith('blob:b')
  })
})
