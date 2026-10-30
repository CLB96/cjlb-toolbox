import {
  legacyActiveEvents,
  legacyAnnotations,
  legacyCoolingInput,
} from '../../../../legacy-fixtures/bondline/legacyReference'
import { translate, type BondlineT } from '../i18n'
import { initialConfig } from '../store'
import { computeView } from '../useBondlineView'
import { ADHESIVES, NO_EVENTS, calcOf, repRangesFor, repSheets, validSheets } from '../logic/testHelpers'
import { FACTORY_DEFAULTS, TC_COLORS, type EventInputs, type Lang } from '../logic/types'
import { buildChartConfig, type BondlineChartTheme } from './chartConfig'

const THEME: BondlineChartTheme = {
  text: '#txt',
  grid: '#grid',
  tooltipBg: '#bg',
  tooltipTitle: '#title',
  tooltipBody: '#body',
  tooltipBorder: '#border',
}

const tFor = (lang: Lang): BondlineT => (key, ...args) => translate(lang, key, ...args)

const EVENT_SETS: { name: string; events: EventInputs }[] = [
  { name: 'sin sucesos', events: NO_EVENTS },
  {
    name: 'prensa + cooling',
    events: { ...NO_EVENTS, eventPressStart: '30', eventManipStart: '50', eventCoolingStart: '85', eventCoolingEnd: '110', eventPressEnd: '500' },
  },
  { name: 'solo cooling cerrado', events: { ...NO_EVENTS, eventCoolingClosed: '60' } },
]

type Config = ReturnType<typeof buildChartConfig>
const annotationsOf = (c: Config) =>
  (c.options?.plugins as { annotation: { annotations: Record<string, Record<string, unknown>> } })
    .annotation.annotations
const stripHover = (anns: Record<string, Record<string, unknown>>) =>
  Object.fromEntries(
    Object.entries(anns).map(([k, { enter: _e, leave: _l, ...rest }]) => [k, rest]),
  )

test('anotaciones, etiquetas, eje Y y datos ≡ legacy (configuración representativa)', () => {
  const coolingTarget = 35
  for (const sheet of repSheets.slice(0, 2)) {
    for (const adhesive of ADHESIVES) {
      const ranges = repRangesFor(sheet.legacy)
      const combos: [typeof ranges[number]['tr'], EventInputs, Lang, boolean][] = [
        [ranges[0].tr, EVENT_SETS[1].events, 'es', false],
        [ranges[1].tr, EVENT_SETS[2].events, 'en', true],
      ]
      for (const [tr, events, lang, dark] of combos) {
        const { lc, cfg } = calcOf(sheet.legacy, adhesive, tr)
        const cool = legacyCoolingInput(
          { start: events.eventCoolingStart, closed: events.eventCoolingClosed, end: events.eventCoolingEnd },
          coolingTarget,
        )
        const view = computeView(sheet.legacy, { ...initialConfig(), adhesive, timeRange: tr, events }, FACTORY_DEFAULTS, lang)
        const config = buildChartConfig({
          view,
          tcVisibility: sheet.legacy.columns.map(() => true),
          adhesive,
          coolingTarget,
          lang,
          dark,
          theme: THEME,
          t: tFor(lang),
        })
        const want = legacyAnnotations(lc, cfg, adhesive, legacyActiveEvents(events, lang), cool, dark, lang)
        expect(stripHover(annotationsOf(config))).toEqual(want)
        expect(config.data.labels).toEqual(lc.labels)
        const y = (config.options?.scales as { y: { min: number; max: number } }).y
        expect([y.min, y.max]).toEqual([lc.yMin, view.yMax]) // yMax: 80 o más (mejora A11)
        config.data.datasets.forEach((ds, i) => expect(ds.data).toEqual(lc.trimmedColumns[i]))
      }
    }
  }
})

describe('buildChartConfig (§5A/§5B)', () => {
  const sheet = validSheets.find((s) => s.name === 'plain')!
  const view = (lang: Lang = 'es', events: EventInputs = NO_EVENTS, timeRange = initialConfig().timeRange) =>
    computeView(sheet.legacy, { ...initialConfig(), events, timeRange }, FACTORY_DEFAULTS, lang)
  const build = (over: Partial<Parameters<typeof buildChartConfig>[0]> = {}) =>
    buildChartConfig({
      view: view(),
      tcVisibility: [true, false, true, true],
      adhesive: 'waterbase',
      coolingTarget: 35,
      lang: 'es',
      dark: false,
      theme: THEME,
      t: tFor('es'),
      ...over,
    })

  test('un dataset por TC con el estilo del original; TC oculta -> hidden; visibilidad de otra longitud -> todas', () => {
    const c = build()
    expect(c.type).toBe('line')
    expect(c.data.datasets).toHaveLength(4)
    c.data.datasets.forEach((ds, i) => {
      expect(ds).toMatchObject({
        label: `TC-${i + 1}`,
        borderColor: TC_COLORS[i % 20],
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: true,
        hidden: i === 1,
      })
    })
    expect(build({ tcVisibility: [] }).data.datasets.every((d) => d.hidden === false)).toBe(true)
  })

  test('opciones, ejes, tooltip y colores de tema (R7)', () => {
    const c = build()
    const o = c.options as Record<string, any>
    expect(o).toMatchObject({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
    })
    expect(o.scales.x).toMatchObject({
      title: { display: true, text: 'Tiempo (segundos)', color: '#txt', font: { size: 13, weight: '600' } },
      ticks: { color: '#txt', font: { size: 11 }, maxTicksLimit: 30 },
      grid: { color: '#grid' },
    })
    expect(o.scales.y).toMatchObject({
      title: { display: true, text: 'Temperatura (°C)', color: '#txt', font: { size: 13, weight: '600' } },
      ticks: { color: '#txt', font: { size: 11 } },
      grid: { color: '#grid' },
    })
    expect(o.scales.y.ticks.callback(42)).toBe('42°C')
    expect(o.plugins.legend).toEqual({ display: false })
    expect(o.plugins.tooltip).toMatchObject({
      backgroundColor: '#bg',
      titleColor: '#title',
      bodyColor: '#body',
      borderColor: '#border',
      borderWidth: 1,
      titleFont: { weight: '800' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
    })
    const cb = o.plugins.tooltip.callbacks
    expect(cb.title([{ label: '17' }])).toBe('t = 17s')
    expect(cb.label({ dataset: { label: 'TC-2' }, parsed: { y: 61.234 } })).toBe(' TC-2: 61.2°C')
    expect(cb.label({ dataset: { label: 'TC-2' }, parsed: { y: null } })).toBe(' TC-2: —°C')
  })

  test('textos de anotación ES/EN, sucesos fuera de rango, 🎯 objetivo y hover', () => {
    const es = annotationsOf(build())
    expect((es.minLine.label as { content: string }).content).toBe('Temp Mín: 55°C')
    expect((es.activationWindow.label as { content: string }).content).toBe('Ventana de Activación (30s)')
    const en = annotationsOf(build({ view: view('en'), lang: 'en', t: tFor('en') }))
    expect((en.activationWindow.label as { content: string }).content).toBe('Activation Window (30s)')
    const events = { ...NO_EVENTS, eventPressStart: '10', eventManipStart: '40', eventCoolingStart: '85' }
    const anns = annotationsOf(build({ view: view('es', events, { active: true, start: 20, end: null }), coolingTarget: 33 }))
    expect(anns.event_0).toBeUndefined()
    expect(anns.event_1).toMatchObject({ xMin: 20, xMax: 20 })
    expect((anns.coolingTargetLine.label as { content: string }).content).toBe('🎯 33°C')
    const hover = annotationsOf(build({ view: view('es', { ...NO_EVENTS, eventPressStart: '30' }) }))
    const element = { options: { borderWidth: 2 } }
    ;(hover.event_0.enter as (c: { element: typeof element }) => void)({ element })
    expect(element.options.borderWidth).toBe(3)
    ;(hover.event_0.leave as (c: { element: typeof element }) => void)({ element })
    expect(element.options.borderWidth).toBe(2)
  })
})
