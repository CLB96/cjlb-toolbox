import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { loadRealWorkbook } from '../../../../legacy-fixtures/bondline/realFixture'
import { createBondlineStore, selectActiveSheet } from '../store'
import { computeView } from '../useBondlineView'
import { FACTORY_DEFAULTS } from '../logic/types'
import { legendSlots } from './drawExport'
import { buildExportChartConfig } from './exportChart'
import { buildExportModel } from './exportModel'

const real = loadRealWorkbook()
const sheets = real ?? Object.entries(FIXTURES).map(([name, raw]) => ({ name, raw }))
const NOW = new Date(2026, 9, 30, 10, 0, 0)

function setup(withLayout = false) {
  const api = createBondlineStore()
  api.getState().loadWorkbook('real.xlsx', sheets)
  const s = api.getState()
  s.setTestDate('30/10/2026')
  s.setParam('thermoUpper', '85')
  s.setParam('nestUpper', '80')
  s.setParam('thermoLower', '70')
  s.setParam('nestLower', '70')
  s.setParam('slidersTemp', '90')
  s.setLeister(0, '120')
  s.addLeister()
  s.setLeister(1, '')
  s.addLeister()
  s.setLeister(2, '118')
  s.setCoolingParam('chiller', '12')
  s.setCoolingParam('nestUpper', '15')
  s.setEvent('eventCoolingStart', '58')
  s.setEvent('eventPressStart', '8')
  if (withLayout) s.setLayoutImage(new Blob(['x'], { type: 'image/png' }), 'l.png')
  return api
}

const viewOf = (api: ReturnType<typeof setup>) => {
  const state = api.getState()
  const data = selectActiveSheet(state)!
  return { state, data, view: computeView(data, state.config, FACTORY_DEFAULTS, 'es') }
}

describe('buildExportModel', () => {
  test('sin datos devuelve null', () => {
    const state = createBondlineStore().getState()
    expect(buildExportModel(state, null, FACTORY_DEFAULTS, 'es', NOW)).toBeNull()
  })

  test('textos, tarjetas y nombre de archivo del export original', () => {
    const { state, view } = viewOf(setup())
    const m = buildExportModel(state, view, FACTORY_DEFAULTS, 'es', NOW)!
    expect(m.title).toBe('Bondline — Activación de Adhesivo')
    expect(m.dateLine).toBe(NOW.toLocaleString('es-MX'))
    expect(m.stats.map((s) => s.label)).toEqual([
      'Termopares',
      'Duración ciclo',
      'Temp mín registrada',
      'Temp máx registrada',
      'Inicio activación',
    ])
    expect(m.stats[1].value).toBe(`${view.range.rows}s`)
    expect(m.stats[4].value).toBe(view.kpis.activation)
    expect(m.footer).toBe('Desarrollado por CJLB — R&D Process Engineering')
    expect(m.fileName).toBe(`Bondline - 30-10-2026 - ${state.sheets[0].name.replace(/[/\\:*?"<>|]/g, '-')}.png`)
    expect(m.legend.cooling).toBe('🎯 Cooling 35°C')
  })

  test.skipIf(!real)('hoja real: 6 TC, 91s, 28.7°, 64.4°, t=53s', () => {
    const { state, view } = viewOf(setup())
    const m = buildExportModel(state, view, FACTORY_DEFAULTS, 'es', NOW)!
    expect(m.stats.map((s) => s.value)).toEqual(['6', '91s', '28.7°', '64.4°', 't=53s'])
  })

  test('columnas de parámetros: ▲ Superior, pérdida, Leisters numerados, Sliders y Cooling', () => {
    const { state, view } = viewOf(setup())
    const m = buildExportModel(state, view, FACTORY_DEFAULTS, 'es', NOW)!
    expect(m.panelWidth).toBe(1800)
    expect(m.columns.map((c) => c.title)).toEqual(['▲ Superior', '▼ Inferior', 'Leisters', 'Sliders', '❄️ Cooling'])
    expect(m.columns[0].rows.map((r) => [r.label, r.value, !!r.warn])).toEqual([
      ['Termoreg.', '85°C', false],
      ['Nido', '80°C', false],
      ['Pérdida', '5.0 °C', true],
    ])
    expect(m.columns[1].rows[2]).toMatchObject({ value: '0.0 °C', warn: false })
    expect(m.columns[2].rows.map((r) => r.label)).toEqual(['Leister 1', 'Leister 3'])
    expect(m.columns[4].rows.map((r) => r.label)).toEqual(['Chiller', 'Nido Sup'])
  })

  test('sub-etiquetas del PNG en el idioma activo', () => {
    const { state, view } = viewOf(setup())
    const m = buildExportModel(state, view, FACTORY_DEFAULTS, 'en', NOW)!
    expect(m.columns[0].title).toBe('▲ Upper')
    expect(m.columns[0].rows.map((r) => r.label)).toEqual(['Thermoreg.', 'Nest', 'Loss'])
    expect(m.columns[3].rows[0].label).toBe('Temperature')
    expect(m.columns[4].rows.map((r) => r.label)).toEqual(['Chiller', 'Nest Up'])
  })

  test('con layout: panel de 1010, sin columna Cooling y sin marcadores de TC ocultas', () => {
    const api = setup(true)
    api.getState().toggleTC(1)
    const { state, view } = viewOf(api)
    const m = buildExportModel(state, view, FACTORY_DEFAULTS, 'es', NOW)!
    expect(m.hasLayout).toBe(true)
    expect(m.panelWidth).toBe(1010)
    expect(m.columns.map((c) => c.title)).not.toContain('❄️ Cooling')
    expect(m.markers.map((k) => k.tcIndex)).not.toContain(1)
    expect(m.legend.tcs.map((t) => t.label)).not.toContain('TC-2')
  })
})

describe('buildExportChartConfig', () => {
  test('solo TC visibles, borderWidth 3 y anotaciones de export', () => {
    const api = setup()
    api.getState().toggleTC(0)
    const { state, data, view } = viewOf(api)
    const cfg = buildExportChartConfig({
      view,
      tcVisibility: state.config.tcVisibility,
      adhesive: 'waterbase',
      defaults: FACTORY_DEFAULTS,
      lang: 'es',
    })
    const sets = cfg.data.datasets as unknown as { label: string; borderWidth: number }[]
    expect(sets.map((d) => d.label)).not.toContain('TC-1')
    expect(sets.every((d) => d.borderWidth === 3)).toBe(true)
    const plugins = cfg.options?.plugins as unknown as {
      annotation: { annotations: Record<string, Record<string, unknown>> }
    }
    const ann = plugins.annotation.annotations
    expect(ann.minLine).toMatchObject({ borderWidth: 3, borderDash: [10, 5], yMin: 55 })
    expect(ann.coolingTargetLine).toMatchObject({ xMin: 58, xMax: data.totalRows - 1, borderWidth: 4, borderDash: [12, 6] })
    expect(cfg.options?.responsive).toBe(false)
  })

  test('la línea de cooling se ajusta al rango temporal', () => {
    const api = setup()
    api.getState().setTimeRangeInput('start', '20')
    api.getState().applyTimeRange()
    const { state, view } = viewOf(api)
    const cfg = buildExportChartConfig({
      view,
      tcVisibility: state.config.tcVisibility,
      adhesive: 'waterbase',
      defaults: FACTORY_DEFAULTS,
      lang: 'es',
    })
    const plugins = cfg.options?.plugins as unknown as {
      annotation: { annotations: Record<string, Record<string, unknown>> }
    }
    expect(plugins.annotation.annotations.coolingTargetLine).toMatchObject({ xMin: 38, xMax: view.range.rows - 1 })
  })
})

describe('legendSlots', () => {
  const legend = (n: number) => ({
    tcs: Array.from({ length: n }, (_, i) => ({ label: `TC-${i + 1}`, color: '#fff' })),
    limits: 'Límites',
    limitsColor: '#22d3ee',
    window: 'Ventana',
    cooling: '🎯 Cooling 35°C',
  })

  test('pocos TC: una línea con los avances del original', () => {
    const slots = legendSlots(legend(6))
    expect(slots.map((s) => s.x)).toEqual([60, 160, 260, 360, 460, 560, 660, 860, 1060])
    expect(new Set(slots.map((s) => s.y))).toEqual(new Set([1180]))
  })

  test('muchos TC: salta de línea sin salirse de la gráfica', () => {
    const slots = legendSlots(legend(20))
    expect(slots.every((s) => s.x + (s.kind === 'tc' ? 100 : 200) <= 1860)).toBe(true)
    expect(slots[slots.length - 1]).toMatchObject({ kind: 'cooling', y: 1204 })
  })
})
