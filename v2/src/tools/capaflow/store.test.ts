import { createCapaStore, initialData, restoreInto, selectActive, snapshotOf, type CapaApi } from './store'

let api: CapaApi
beforeEach(() => {
  api = createCapaStore()
})

const calc = (name = '') => {
  api.getState().loadSample()
  api.getState().setField('pointName', name)
  return api.getState().calculate()
}

describe('capaflow store', () => {
  it('loadSample rellena los cinco campos y deja el nombre del punto como estaba', () => {
    api.getState().setField('pointName', 'Eje A')
    api.getState().loadSample()
    const f = api.getState().form
    expect([f.lsl, f.usl, f.target, f.subgroupSize, f.pointName]).toEqual(['73.95', '74.05', '74', '5', 'Eje A'])
    expect(f.raw.startsWith('74.03, 74.002')).toBe(true)
  })

  it('calcular con los datos de ejemplo da Cpk 1.629, Cp 1.668 y Ppk 1.596', () => {
    expect(calc()).toEqual({ ok: true })
    const p = selectActive(api.getState())!
    expect([p.result.Cpk, p.result.Cp, p.result.Ppk].map((v) => v!.toFixed(3))).toEqual(['1.629', '1.668', '1.596'])
    expect(p.ccType).toBe('auto')
    expect(api.getState().counter).toBe(1)
  })

  it('un error de validación no cambia el proyecto', () => {
    expect(api.getState().calculate()).toEqual({ ok: false, error: 'minData' })
    api.getState().setField('raw', '1 2 3 4 5 6')
    expect(api.getState().calculate()).toEqual({ ok: false, error: 'noLimit' })
    expect(api.getState().points).toHaveLength(0)
  })

  it('cada cálculo acumula un punto nuevo y se vuelve el activo', () => {
    calc('A')
    calc('B')
    const s = api.getState()
    expect(s.points.map((p) => [p.id, p.result.pointName])).toEqual([[0, 'A'], [1, 'B']])
    expect(s.activeId).toBe(1)
    s.selectPoint(0)
    expect(api.getState().activeId).toBe(0)
    api.getState().selectPoint(99)
    expect(api.getState().activeId).toBe(0)
  })

  it('eliminar un análisis quita su marcador y mueve la selección; al vaciar reinicia el contador', () => {
    calc('A')
    calc('B')
    api.getState().placeMarker(1, 10, 20)
    api.getState().deletePoint(1)
    expect(api.getState().markers).toEqual({})
    expect(api.getState().activeId).toBe(0)
    api.getState().deletePoint(0)
    expect(api.getState()).toMatchObject({ points: [], activeId: null, counter: 0 })
  })

  it('limpiar el proyecto borra análisis, foto y marcadores pero no el formulario', () => {
    calc('A')
    api.getState().setPhoto(new Blob(['x']), 'plano.png')
    api.getState().placeMarker(0, 50, 50)
    api.getState().clearProject()
    const s = api.getState()
    expect([s.points.length, s.photo, s.photoName, s.markers, s.counter]).toEqual([0, null, null, {}, 0])
    expect(s.form.raw).not.toBe('')
  })

  it('cambia el tipo de gráfica de control solo del punto indicado', () => {
    calc('A')
    calc('B')
    api.getState().setCCType(0, 'xs')
    expect(api.getState().points.map((p) => p.ccType)).toEqual(['xs', 'auto'])
  })

  it('los marcadores se colocan solo para puntos existentes y se pueden quitar', () => {
    calc('A')
    api.getState().placeMarker(7, 1, 1)
    expect(api.getState().markers).toEqual({})
    api.getState().placeMarker(0, 30, 40)
    api.getState().placeMarker(0, 31, 41)
    expect(api.getState().markers).toEqual({ 0: { x: 31, y: 41 } })
    api.getState().removeMarker(0)
    expect(api.getState().markers).toEqual({})
  })

  it('snapshot y restore conservan el proyecto; completa campos que falten', () => {
    calc('A')
    api.getState().setPanel('qq', true)
    const snap = snapshotOf(api.getState())
    const other = createCapaStore()
    restoreInto(other, snap)
    expect(other.getState().points[0]!.result.Cpk).toBe(snap.points[0]!.result.Cpk)
    expect(other.getState().panels.qq).toBe(true)

    const old = { ...snap, panels: { run: true }, form: { raw: 'x' }, activeId: 99 } as unknown as typeof snap
    restoreInto(other, old)
    expect(other.getState().panels).toEqual({ run: true, qq: false, box: false, photo: false })
    expect(other.getState().form.confidence).toBe('95')
    expect(other.getState().activeId).toBe(0)
  })

  it('reset vuelve al estado inicial', () => {
    calc('A')
    api.setState(initialData())
    expect(api.getState().points).toEqual([])
    expect(api.getState().form.subgroupSize).toBe('5')
  })
})
