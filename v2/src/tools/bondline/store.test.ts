import { FIXTURES } from '../../../legacy-fixtures/bondline/fixtures'
import { stripLargeFiles } from '../../persistence/stripLargeFiles'
import { loadRealWorkbook } from '../../../legacy-fixtures/bondline/realFixture'
import {
  createBondlineStore,
  initialData,
  invalidSheetText,
  restoreInto,
  selectActiveSheet,
  snapshotOf,
} from './store'

const real = loadRealWorkbook()
const plain = FIXTURES.plain
const sixTc = FIXTURES.plain.map((r) => [...r, 50, 51])
const two = [
  { name: 'Uno', raw: plain },
  { name: 'Dos', raw: plain },
]

describe('loadWorkbook', () => {
  it.skipIf(!real)('con el libro real: hoja 0 activa, 6 TC, sheetConfigs vacío', () => {
    const api = createBondlineStore()
    expect(api.getState().loadWorkbook('real.xlsx', real ?? [])).toEqual({ ok: true })
    const s = api.getState()
    expect(s.sheetIndex).toBe(0)
    expect(selectActiveSheet(s)?.columns).toHaveLength(6)
    expect(s.config.tcVisibility).toEqual([true, true, true, true, true, true])
    expect(s.sheetConfigs).toEqual({})
    expect(s.fileName).toBe('real.xlsx')
  })

  it('hoja 0 vacía: error y estado intacto', () => {
    const api = createBondlineStore()
    const before = snapshotOf(api.getState())
    const r = api.getState().loadWorkbook('x.xlsx', [{ name: 'Vacia', raw: [] }, { name: 'B', raw: plain }])
    expect(r).toEqual({ ok: false, sheetName: 'Vacia', reason: 'empty' })
    expect(snapshotOf(api.getState())).toEqual(before)
  })

  it('cargar otro archivo vacía sheetConfigs', () => {
    const api = createBondlineStore()
    api.getState().loadWorkbook('a.xlsx', two)
    api.getState().setAdhesive('hotmelt')
    api.getState().selectSheet(1)
    expect(Object.keys(api.getState().sheetConfigs)).toEqual(['Uno'])
    api.getState().loadWorkbook('b.xlsx', two)
    expect(api.getState().sheetConfigs).toEqual({})
    expect(api.getState().sheetIndex).toBe(0)
  })
})

it('configuración por hoja (R2)', () => {
  { // ida y vuelta recupera todo y la hoja nueva hereda con rango reiniciado
    const api = createBondlineStore()
    const g = () => api.getState()
    g().loadWorkbook('a.xlsx', two)
    g().setAdhesive('hotmelt')
    g().setTestDate('2026-03-04')
    g().setSubstrate('pp')
    g().toggleTC(2)
    g().setCoolingParam('chiller', '12')
    g().setTimeRangeInput('start', '10')
    g().setTimeRangeInput('end', '60')
    expect(g().applyTimeRange()).toBeNull()
    g().setEvent('eventPressClosed', '42')
    g().setLeister(0, '120')
    g().addLeister()
    g().setLeister(1, '130')
    const img = new Blob(['x'])
    g().setLayoutImage(img, 'p.png')
    g().moveMarker(0, 5, 6)

    g().selectSheet(1)
    expect(g().config.adhesive).toBe('hotmelt')
    expect(g().config.timeRange).toEqual({ active: false, start: 0, end: null })
    expect(g().config.timeRangeInputs).toEqual({ start: '', end: '' })

    g().selectSheet(0)
    const c = g().config
    expect(c.adhesive).toBe('hotmelt')
    expect(c.timeRange).toEqual({ active: true, start: 10, end: 60 })
    expect(c.events.eventPressClosed).toBe('42')
    expect(c.params.leisters).toEqual(['120', '130'])
    expect(c.testDate).toBe('2026-03-04')
    expect(c.substrate).toBe('pp')
    expect(c.tcVisibility).toEqual([true, true, false, true])
    expect(c.coolingParams.chiller).toBe('12')
    expect(c.layout.image).toBe(img)
    expect(c.layout.markers.find((m) => m.tcIndex === 0)).toMatchObject({ x: 5, y: 6 })
  }

  { // primera visita: visibilidad TC toda true aunque haya el mismo nº de TC
    const api = createBondlineStore()
    const g = () => api.getState()
    g().loadWorkbook('a.xlsx', two)
    g().toggleTC(0)
    g().selectSheet(1)
    expect(g().config.tcVisibility).toEqual([true, true, true, true])
    g().selectSheet(0)
    expect(g().config.tcVisibility).toEqual([false, true, true, true])
  }

  { // hoja con distinto nº de TC: visibilidad toda true
    const api = createBondlineStore()
    const g = () => api.getState()
    g().loadWorkbook('a.xlsx', [{ name: 'Uno', raw: plain }, { name: 'Seis', raw: sixTc }])
    g().toggleTC(0)
    g().selectSheet(1)
    expect(g().config.tcVisibility).toEqual([true, true, true, true, true, true])
  }

  { // hoja inválida: no cambia el estado
    const api = createBondlineStore()
    const g = () => api.getState()
    g().loadWorkbook('a.xlsx', [{ name: 'Uno', raw: plain }, { name: 'Mala', raw: [] }])
    const before = snapshotOf(g())
    expect(g().selectSheet(1)).toEqual({ ok: false, sheetName: 'Mala', reason: 'empty' })
    expect(snapshotOf(g())).toEqual(before)
    expect(invalidSheetText('Mala', 'empty')).toBe('La hoja "Mala" no contiene datos válidos')
    expect(invalidSheetText('Mala', 'noTemperature')).toBe(
      'La hoja "Mala" no contiene datos de temperatura válidos',
    )
  }
})

it('acciones', () => {
  const loaded = () => {
    const api = createBondlineStore()
    api.getState().loadWorkbook('a.xlsx', two)
    return api
  }

  { // applyTimeRange con inicio negativo devuelve startNegative y no cambia el rango
    const api = loaded()
    api.getState().setTimeRangeInput('start', '-1')
    expect(api.getState().applyTimeRange()).toBe('startNegative')
    expect(api.getState().config.timeRange.active).toBe(false)
    api.getState().setTimeRangeInput('start', '5')
    api.getState().setTimeRangeInput('end', '3')
    expect(api.getState().applyTimeRange()).toBe('endNotAfterStart')
    api.getState().setTimeRangeInput('end', '9999')
    expect(api.getState().applyTimeRange()).toBe('endExceeds')
    api.getState().resetTimeRange()
    expect(api.getState().config.timeRangeInputs).toEqual({ start: '', end: '' })
  }

  { // removeLeister con 1 no hace nada
    const api = loaded()
    api.getState().removeLeister()
    expect(api.getState().config.params.leisters).toEqual([''])
    api.getState().addLeister()
    api.getState().removeLeister()
    expect(api.getState().config.params.leisters).toEqual([''])
  }

  { // toggleTC regenera marcadores solo con imagen
    const api = loaded()
    api.getState().toggleTC(1)
    expect(api.getState().config.layout.markers).toEqual([])
    api.getState().setLayoutImage(new Blob(['x']), 'p.png')
    expect(api.getState().config.layout.markers.map((m) => m.tcIndex)).toEqual([0, 2, 3])
    api.getState().toggleTC(1)
    expect(api.getState().config.layout.markers).toHaveLength(4)
  }

  { // mejora A14: otra hoja (primera visita) con el mismo nº de TC conserva las posiciones
    const api = loaded()
    api.getState().setLayoutImage(new Blob(['x']), 'a.png')
    api.getState().moveMarker(0, 5, 6)
    api.getState().selectSheet(1)
    expect(api.getState().config.layout.markers[0]).toMatchObject({ x: 5, y: 6 })
  }

  { // quitar la imagen borra los marcadores y una nueva usa las posiciones por defecto
    const api = loaded()
    api.getState().setLayoutImage(new Blob(['x']), 'a.png')
    api.getState().moveMarker(0, 1, 2)
    api.getState().setLayoutImage(null, null)
    expect(api.getState().config.layout.markers).toEqual([])
    api.getState().setLayoutImage(new Blob(['y']), 'b.png')
    expect(api.getState().config.layout.markers[0]).not.toMatchObject({ x: 1, y: 2 })
    expect(api.getState().config.layout.markers).toHaveLength(4)
  }

  { // imagen >20 MB recortada al guardar: restaurar conserva marcadores y bandera
    const src = loaded()
    src.getState().setLayoutImage(new Blob([new Uint8Array(21 * 1024 * 1024)]), 'a.png')
    src.getState().moveMarker(0, 1, 2)
    const cut = stripLargeFiles(snapshotOf(src.getState())).value
    expect(cut.config.layout.image).toBeNull()
    const api = createBondlineStore()
    restoreInto(api, cut)
    expect(api.getState().config.layout.imageStripped).toBe(true)
    api.getState().toggleTC(3) // ocultar una TC conserva los demás marcadores y la bandera
    expect(api.getState().config.layout.imageStripped).toBe(true)
    expect(api.getState().config.layout.markers).toHaveLength(3)
    expect(api.getState().config.layout.markers[0]).toMatchObject({ x: 1, y: 2 })
    api.getState().toggleTC(3)
    expect(api.getState().config.layout.markers).toHaveLength(4)
    api.getState().selectSheet(1) // primera visita a otra hoja: hereda marcadores y bandera
    expect(api.getState().config.layout.imageStripped).toBe(true)
    expect(api.getState().config.layout.markers[0]).toMatchObject({ x: 1, y: 2 })
    api.getState().setLayoutImage(new Blob(['x']), 'a.png') // al subir la imagen se conservan
    expect(api.getState().config.layout.markers[0]).toMatchObject({ x: 1, y: 2 })
    expect(api.getState().config.layout.imageStripped).toBe(false)
  }

  { // panels, layoutFit y reset
    const api = loaded()
    api.getState().setPanelOpen('events', true)
    api.getState().setLayoutFit(false)
    expect(api.getState().panels.events).toBe(true)
    api.getState().reset()
    expect(snapshotOf(api.getState())).toEqual(initialData())
  }
})

it('snapshot', () => {
  { // es clonable y restoreInto devuelve el mismo estado
    const api = createBondlineStore()
    api.getState().loadWorkbook('a.xlsx', two)
    api.getState().setEvent('eventPressClosed', '7')
    api.getState().selectSheet(1)
    const snap = snapshotOf(api.getState())
    const clone = structuredClone(snap)
    const other = createBondlineStore()
    restoreInto(other, clone)
    expect(snapshotOf(other.getState())).toEqual(snap)
  }

  { // un snapshot antiguo sin campos nuevos se completa con los iniciales
    const api = createBondlineStore()
    const old = {
      fileName: 'v.xlsx',
      sheets: [],
      sheetIndex: 0,
      config: { adhesive: 'hotmelt', events: { eventPressStart: '3' }, params: { thermoUpper: '9' } },
      sheetConfigs: { H: { testDate: 'd' } },
    }
    restoreInto(api, old as never)
    const s = api.getState()
    expect(s.config.adhesive).toBe('hotmelt')
    expect(s.config.events.eventPressClosed).toBe('')
    expect(s.config.events.eventPressStart).toBe('3')
    expect(s.config.params.leisters).toEqual([''])
    expect(s.config.coolingParams).toEqual({ chiller: '', nestUpper: '', nestLower: '' })
    expect(s.sheetConfigs.H.layout.markers).toEqual([])
    expect(s.panels).toEqual({ params: false, events: false, layout: false })
    expect(s.layoutFit).toBe(true)
  }
})
