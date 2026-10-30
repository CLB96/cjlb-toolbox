import * as XLSX from 'xlsx'
import { beforeEach, describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../legacy-fixtures/gapcheck/fixtures'
import { loadRealRows } from '../../../legacy-fixtures/gapcheck/realFixture'
import { importExcelFile } from './importExcel'
import {
  createGapcheckStore,
  restoreInto,
  selectKpis,
  selectLiveTarget,
  snapshotOf,
  type GapcheckApi,
} from './store'

let api: GapcheckApi
const act = () => api.getState()
const getGapcheckSnapshot = () => snapshotOf(api.getState())

beforeEach(() => {
  api = createGapcheckStore()
})

describe('loadRows', () => {
  const real = loadRealRows()
  it.skipIf(!real)('carga el Excel real: 20 puntos, todo visible, objetivo 5', () => {
    expect(act().loadRows('real.xlsx', real as unknown[][])).toBe(true)
    const s = act()
    expect(s.points).toHaveLength(20)
    expect(s.visiblePoints).toHaveLength(20)
    expect(s.visibleIters).toHaveLength(s.maxIter)
    expect(s.appliedTarget).toBe(5)
    expect(s.fileName).toBe('real.xlsx')
  })

  it('con datos sintéticos resetea filtros y aplica comparación', () => {
    act().loadRows('a.xlsx', FIXTURES.header)
    act().togglePoint(0)
    act().loadRows('b.xlsx', FIXTURES.header)
    expect(act().visiblePoints).toHaveLength(act().points.length)
  })

  it('sin datos numéricos devuelve false y no cambia el estado', () => {
    act().loadRows('a.xlsx', FIXTURES.header)
    const before = getGapcheckSnapshot()
    expect(act().loadRows('x.xlsx', FIXTURES.empty)).toBe(false)
    expect(getGapcheckSnapshot()).toEqual(before)
  })

  it('regenera marcadores si hay imagen al cargar filas', () => {
    act().setLayoutImage(new Blob(['x']), 'img.png')
    expect(act().layout.markers).toHaveLength(0)
    act().loadRows('a.xlsx', FIXTURES.header)
    expect(act().layout.markers).toHaveLength(act().points.length)
  })

  it('regenera marcadores al fijar imagen si ya hay puntos', () => {
    act().loadRows('a.xlsx', FIXTURES.header)
    act().setLayoutImage(new Blob(['x']), 'img.png')
    expect(act().layout.markers).toHaveLength(act().points.length)
    expect(act().layout.imageName).toBe('img.png')
  })
})

describe('filtros, comparación y layout', () => {
  beforeEach(() => act().loadRows('a.xlsx', FIXTURES.header))

  it('togglePoint/toggleIter alternan', () => {
    act().togglePoint(0)
    expect(act().visiblePoints).not.toContain(0)
    act().togglePoint(0)
    expect(act().visiblePoints).toContain(0)
    act().toggleIter(0)
    expect(act().visibleIters).not.toContain(0)
    act().toggleIter(0)
    act().togglePoint(1)
    act().togglePoint(0)
    act().togglePoint(1)
    expect(act().visiblePoints).toEqual([...act().visiblePoints].sort((x, y) => x - y))
    expect(act().visibleIters[0]).toBe(0)
  })

  it('R1: escribir pct no cambia appliedTarget hasta applyComparison', () => {
    expect(act().appliedTarget).toBe(5)
    act().setInput('pct', '60')
    expect(act().appliedTarget).toBe(5)
    expect(act().appliedInputs.pct).toBe('50')
    expect(selectLiveTarget(act()).target).toBeCloseTo(4)
    act().applyComparison()
    expect(act().appliedTarget).toBeCloseTo(4)
    expect(act().appliedInputs.pct).toBe('60')
    act().setCovering('soft')
    expect(act().appliedCovering).toBe('hard')
    act().applyComparison()
    expect(act().appliedCovering).toBe('soft')
  })

  it('selectKpis usa appliedTarget y filtros', () => {
    const all = selectKpis(act())
    for (let i = 0; i < act().points.length; i++) act().togglePoint(i)
    expect(selectKpis(act()).meeting).toBe('0 / 0')
    expect(all.meeting).not.toBe('0 / 0')
  })

  it('moveMarker, setMarkerSize y setTableOpen', () => {
    act().setLayoutImage(new Blob(['x']), 'i.png')
    act().moveMarker(0, 12, 34)
    expect(act().layout.markers.find((m) => m.pointIndex === 0)).toMatchObject({ x: 12, y: 34 })
    expect(act().layout.markerSize).toBe(44)
    act().setMarkerSize(60)
    expect(act().layout.markerSize).toBe(60)
    act().setTableOpen(true)
    expect(act().tableOpen).toBe(true)
  })

  it('volver a poner una imagen tras quitarse la anterior conserva las posiciones guardadas', () => {
    act().setLayoutImage(null, null)
    act().loadRows('a.xlsx', FIXTURES.header)
    act().setLayoutImage(new Blob(['x']), 'i.png')
    act().moveMarker(0, 12, 34)
    // snapshot con la imagen grande omitida (>20 MB): image null pero marcadores guardados
    restoreInto(api, { ...getGapcheckSnapshot(), layout: { ...act().layout, image: null } })
    act().setLayoutImage(new Blob(['y']), 'otra.png')
    expect(act().layout.markers.find((m) => m.pointIndex === 0)).toMatchObject({ x: 12, y: 34 })
    // con otra imagen ya presente sí se recolocan (original)
    act().setLayoutImage(new Blob(['z']), 'z.png')
    expect(act().layout.markers.find((m) => m.pointIndex === 0)).not.toMatchObject({ x: 12, y: 34 })
  })

  it('reset vuelve al estado inicial', () => {
    act().setInput('pct', '60')
    act().reset()
    expect(act().points).toHaveLength(0)
    expect(act().inputs.pct).toBe('50')
    expect(act().fileName).toBeNull()
  })
})

describe('snapshot', () => {
  it('es clonable y restore devuelve el mismo estado', () => {
    act().loadRows('a.xlsx', FIXTURES.header)
    act().togglePoint(1)
    act().setInput('skin', '12')
    act().applyComparison()
    act().setCovering('soft')
    const snap = getGapcheckSnapshot()
    const cloned = structuredClone(snap)
    api = createGapcheckStore()
    restoreInto(api, cloned)
    expect(getGapcheckSnapshot()).toEqual(snap)
    expect(Object.values(snap).some((v) => typeof v === 'function')).toBe(false)
  })
})

describe('importExcelFile', () => {
  it('devuelve las filas de la primera hoja aunque haya varias', async () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['A', 'B'], [1, 2], [3, 4]]), 'Uno')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Z'], [9]]), 'Dos')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const file = new File([buf], 'x.xlsx')
    expect(await importExcelFile(file)).toEqual([['A', 'B'], [1, 2], [3, 4]])
  })

  it('rechaza con Error si el archivo no se puede leer', async () => {
    const bad = { arrayBuffer: () => Promise.reject(new Error('boom')) } as unknown as File
    await expect(importExcelFile(bad)).rejects.toBeInstanceOf(Error)
  })
})
