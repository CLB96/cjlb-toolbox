import { describe, expect, it } from 'vitest'
import { FIXTURES } from './fixtures'
import {
  legacyActivationResultHtml,
  legacyActiveEvents,
  legacyAnnotations,
  legacyApplyTimeRange,
  legacyCalcLoss,
  legacyCooling,
  legacyCoolingInput,
  legacyDragDelta,
  legacyLoadSheet,
  legacyMarkerPositions,
  legacyRenderCalc,
  legacySaveDefaults,
  legacyStatsTexts,
  type LegacySheet,
} from './legacyReference'
import { loadRealWorkbook } from './realFixture'

const real = loadRealWorkbook()
const WB = { min: 55, max: 75, label: 'Water Base' }
const NO_RANGE = { active: false, start: 0, end: null }

function sheet(name: string): LegacySheet {
  const s = legacyLoadSheet(FIXTURES[name])
  if (typeof s === 'string') throw new Error(`fixture ${name}: ${s}`)
  return s
}
function calc(name: string, timeRange = NO_RANGE) {
  const s = sheet(name)
  return legacyRenderCalc({ ...s, cfg: WB, timeRange })
}

describe('hoja real', () => {
  it.skipIf(!real)('hoja 1: 6 TC, 91 s y textos medidos en el original', () => {
    const s = legacyLoadSheet(real![0].raw) as LegacySheet
    expect(s.columns).toHaveLength(6)
    expect(s.totalRows).toBe(91)
    const c = legacyRenderCalc({ ...s, cfg: WB, timeRange: NO_RANGE })
    const st = legacyStatsTexts(c, 'es')
    expect({ tc: st.tc, duration: st.duration, min: st.min, max: st.max, activation: st.activation, activated: st.activated }).toEqual({
      tc: '6',
      duration: '91s',
      min: '28.7°',
      max: '64.4°',
      activation: 't=53s',
      activated: true,
    })
    const r = legacyActivationResultHtml(c, WB, 'es')
    expect(r.className).toBe('activation-result pass')
    expect(r.html).toContain('✓ Ventana de activación exitosa')
  })
})

it('legacyLoadSheet', () => {
  { // empty / allText
    expect(legacyLoadSheet(FIXTURES.empty)).toBe('empty')
    expect(legacyLoadSheet(FIXTURES.allText)).toBe('noTemperature')
  }
  { // descarta la columna de texto y filas en blanco
    expect(sheet('textColumn').columns).toHaveLength(4)
    expect(sheet('blankRows').totalRows).toBe(120)
  }
  { // numericStrings usa parseFloat
    expect(sheet('numericStrings').columns).toEqual([[12, 1, 60, null], [20, 30, 40, 50]])
  }
  { // trailingNulls recorta a la última fila con dato
    const s = sheet('trailingNulls')
    expect(s.totalRows).toBe(12)
    expect(s.columns.every((c) => c.length === 12)).toBe(true)
  }
  { // interiorNulls conserva nulos internos
    expect(sheet('interiorNulls').columns[0][30]).toBeNull()
  }
})

it('legacyRenderCalc sobre fixtures', () => {
  { // plain activa y pasa
    const c = calc('plain')
    expect(c.activationStart).not.toBeNull()
    expect(c.allInRange).toBe(true)
  }
  { // outOfRange activa pero no pasa
    const c = calc('outOfRange')
    expect(c.activationStart).not.toBeNull()
    expect(c.allInRange).toBe(false)
    expect(legacyActivationResultHtml(c, WB, 'es').html).toContain('fuera de rango')
  }
  { // neverActivates
    const c = calc('neverActivates')
    expect(c.activationStart).toBeNull()
    expect(legacyStatsTexts(c, 'es').activation).toBe('—')
    expect(legacyActivationResultHtml(c, WB, 'en').html).toContain('Activation not reached')
  }
  { // windowPastEnd activa 10 s antes del final y no pasa
    const c = calc('windowPastEnd')
    expect(c.activationStart).toBe(110)
    expect(c.allInRange).toBe(false)
  }
  { // rango temporal que corta la ventana es NOK
    const c = calc('plain', { active: true, start: 0, end: 60 })
    expect(c.allInRange).toBe(false)
    expect(c.effectiveRows).toBe(60)
  }
})

it('otras funciones', () => {
  { // legacyCalcLoss
    expect(legacyCalcLoss('200', '195')).toEqual({ text: '5.0 °C', className: 'param-computed loss-positive' })
    expect(legacyCalcLoss('', '195')).toEqual({ text: '— °C', className: 'param-computed loss-zero' })
  }
  { // legacySaveDefaults vacío = fábrica
    expect(legacySaveDefaults({ wbMin: '', wbMax: '', hmMin: '', hmMax: '', cooling: '' })).toEqual({
      waterbase: { min: 55, max: 75 },
      hotmelt: { min: 60, max: 80 },
      coolingTarget: 35,
    })
  }
  { // legacyMarkerPositions
    expect(legacyMarkerPositions(2)).toEqual([{ x: 30, y: 50 }, { x: 70, y: 50 }])
    expect(legacyMarkerPositions(6)[5]).toEqual({ x: 80, y: 70 })
    expect(legacyMarkerPositions(10)).toHaveLength(10)
  }
  { // legacyApplyTimeRange
    expect(legacyApplyTimeRange('10', '50', 91, 'es')).toEqual({ start: 10, end: 50 })
    expect(legacyApplyTimeRange('', '', 91, 'es')).toEqual({ start: 0, end: null })
    expect(legacyApplyTimeRange('10', '5', 91, 'es')).toEqual({ alert: 'El tiempo final debe ser mayor al inicial' })
    expect(legacyApplyTimeRange('0', '100', 91, 'en')).toEqual({ alert: 'End time cannot exceed 91s' })
    expect(legacyApplyTimeRange('-3', '', 91, 'en')).toEqual({ alert: 'Start time must be 0 or greater' })
  }
  { // legacyDragDelta
    expect(legacyDragDelta(12, 10).text).toBe('+2')
    expect(legacyDragDelta(8, 10).text).toBe('-2')
    expect(legacyDragDelta(10, 10)).toEqual({ text: '±0', color: 'var(--text-3)' })
  }
  { // legacyActiveEvents
    const ev = legacyActiveEvents({ eventPressStart: '5', eventCoolingStart: '70', eventPressEnd: '-1', eventManipEnd: 'x' }, 'en')
    expect(ev.map((e) => [e.id, e.x, e.label])).toEqual([
      ['eventPressStart', 5, 'Press Start'],
      ['eventCoolingStart', 70, 'Cooling Start'],
    ])
  }
  { // legacyCooling
    const s = sheet('plain')
    const none = legacyCooling(s.columns, s.totalRows, { start: '', closed: '', end: '' }, 35, 'es')
    expect(none).toEqual({ className: 'activation-result', display: 'none', html: '' })
    const ok = legacyCooling(s.columns, s.totalRows, { start: '85', closed: '', end: '' }, 40, 'es')
    expect(ok.className).toBe('activation-result pass')
    const fail = legacyCooling(s.columns, s.totalRows, { start: '85', closed: '', end: '' }, 20, 'es')
    expect(fail.className).toBe('activation-result fail')
    expect(fail.html).toContain('Enfriamiento no alcanzado')
  }
  { // legacyAnnotations incluye ventana, eventos y línea de cooling
    const c = calc('plain')
    const events = legacyActiveEvents({ eventPressStart: '5' }, 'es')
    const cooling = legacyCoolingInput({ start: '85', closed: '', end: '' }, 35)
    const a = legacyAnnotations(c, WB, 'waterbase', events, cooling, false, 'es')
    expect(Object.keys(a)).toEqual(['minLine', 'maxLine', 'activationWindow', 'event_0', 'coolingTargetLine'])
    expect(a.minLine.label.content).toBe('Temp Mín: 55°C')
    expect(a.activationWindow.label.content).toBe('Ventana de Activación (30s)')
  }
})
