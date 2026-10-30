import { FIXTURES } from '../../../../legacy-fixtures/gapcheck/fixtures'
import { loadRealRows } from '../../../../legacy-fixtures/gapcheck/realFixture'
import {
  legacyCompressionTick,
  legacyIterDataset,
  legacyPointStyle,
} from '../../../../legacy-fixtures/gapcheck/legacyReference'
import { parseRows } from '../logic/parse'
import { PALETTE_SOLID, hexToRgba } from '../logic/chartStyle'
import { DEFAULT_TARGET_INPUTS, type TargetInputs } from '../logic/types'
import { buildChartConfig, type ChartInput, type GapcheckChartTheme } from './chartConfig'

const THEME: GapcheckChartTheme = {
  text: '#b3a6d9',
  grid: 'rgba(255, 255, 255, 0.10)',
  tooltipBg: '#241545',
  tooltipTitle: '#efe9ff',
  tooltipBody: '#b3a6d9',
  tooltipBorder: 'rgba(255, 255, 255, 0.16)',
}

const real = loadRealRows()
const parsed = parseRows(real ?? FIXTURES.plain)!
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

function input(over: Partial<ChartInput> = {}): ChartInput {
  return {
    points: parsed.points,
    maxIter: parsed.maxIter,
    visiblePoints: range(parsed.points.length),
    visibleIters: range(parsed.maxIter),
    appliedTarget: 2.2,
    appliedCovering: 'hard',
    appliedInputs: { ...DEFAULT_TARGET_INPUTS },
    lang: 'es',
    theme: THEME,
    onToggleIter: () => undefined,
    ...over,
  }
}

type Any = any
const opts = (c: ReturnType<typeof buildChartConfig>) => c.options as Any

describe('buildChartConfig', () => {
  it(`usa el fixture ${real ? 'real' : 'sintético (falta el Excel real)'}`, () => {
    expect(parsed.points.length).toBeGreaterThan(0)
  })

  it('es un scatter responsive sin relación de aspecto', () => {
    const c = buildChartConfig(input())
    expect(c.type).toBe('scatter')
    expect(opts(c).responsive).toBe(true)
    expect(opts(c).maintainAspectRatio).toBe(false)
  })

  it('crea un dataset por iteración con la paleta original', () => {
    const c = buildChartConfig(input())
    expect(c.data.datasets).toHaveLength(parsed.maxIter)
    c.data.datasets.forEach((ds: Any, j) => {
      const color = PALETTE_SOLID[j % 15]
      expect(ds.label).toBe(`Iter ${j + 1}`)
      expect(ds.borderColor).toBe(color)
      expect(ds.backgroundColor).toBe(hexToRgba(color, 0.82))
      expect(ds.showLine).toBe(false)
    })
  })

  it('datos y arrays de estilo idénticos al original para cada iteración', () => {
    const target = 2.2
    const visiblePoints = range(parsed.points.length).filter((i) => i % 3 !== 1)
    const c = buildChartConfig(input({ appliedTarget: target, visiblePoints }))
    c.data.datasets.forEach((ds: Any, j) => {
      const expected = legacyIterDataset(parsed.points, new Set(visiblePoints), j)
      expect(ds.data).toEqual(expected)
      const styles = expected.map((p) => legacyPointStyle(p.y, target))
      expect(ds.pointStyle).toEqual(styles.map((s) => s.style))
      expect(ds.pointRadius).toEqual(styles.map((s) => s.radius))
      expect(ds.pointHoverRadius).toEqual(styles.map((s) => s.hoverRadius))
      expect(ds.borderWidth).toEqual(styles.map((s) => s.borderWidth))
    })
    const all = c.data.datasets.flatMap((ds: Any) => ds.pointStyle)
    expect(all).toContain('crossRot')
    expect(all).toContain('circle')
  })

  it('una iteración oculta deja datos y arrays vacíos', () => {
    const c = buildChartConfig(input({ visibleIters: [1] }))
    const ds = c.data.datasets[0] as Any
    expect(ds.data).toEqual([])
    expect(ds.pointStyle).toEqual([])
    expect(ds.pointRadius).toEqual([])
    expect(ds.pointHoverRadius).toEqual([])
    expect(ds.borderWidth).toEqual([])
    expect((c.data.datasets[1] as Any).data.length).toBeGreaterThan(0)
  })

  it('línea objetivo gapLine con los valores del original', () => {
    const c = buildChartConfig(input({ appliedTarget: 2.2 }))
    expect(opts(c).plugins.annotation.annotations.gapLine).toEqual({
      type: 'line',
      yMin: 2.2,
      yMax: 2.2,
      borderColor: '#43b36b',
      borderWidth: 2.5,
      borderDash: [6, 3],
      label: {
        display: true,
        content: 'GapCheck: 2.20 mm',
        position: 'end',
        backgroundColor: '#43b36b',
        color: '#fff',
        font: { size: 11, weight: '700' },
      },
    })
  })

  it('sin línea objetivo si el objetivo es <= 0', () => {
    for (const t of [0, -1]) {
      const c = buildChartConfig(input({ appliedTarget: t }))
      expect(opts(c).plugins.annotation.annotations).toEqual({})
    }
  })

  it('eje x lineal de 0 a N+1 con nombres de punto', () => {
    const x = opts(buildChartConfig(input())).scales.x
    expect(x.type).toBe('linear')
    expect(x.min).toBe(0)
    expect(x.max).toBe(parsed.points.length + 1)
    expect(x.ticks.stepSize).toBe(1)
    expect(x.ticks.maxRotation).toBe(45)
    expect(x.ticks.callback(0)).toBe('')
    expect(x.ticks.callback(1)).toBe(parsed.points[0].name)
    expect(x.ticks.callback(parsed.points.length)).toBe(parsed.points[parsed.points.length - 1].name)
    expect(x.ticks.callback(parsed.points.length + 1)).toBe('')
    expect(x.grid.color).toBe(THEME.grid)
    expect(x.ticks.color).toBe(THEME.text)
  })

  it('eje izquierdo en mm con títulos literales ES/EN', () => {
    const y = opts(buildChartConfig(input())).scales.y
    expect(y.position).toBe('left')
    expect(y.beginAtZero).toBe(false)
    expect(y.ticks.callback(2.5)).toBe('2.50 mm')
    expect(y.title.text).toBe('Medición de Espesor (mm)')
    expect(y.title.color).toBe(THEME.text)
    expect(y.title.font).toEqual({ size: 12, weight: '700' })
    const yEn = opts(buildChartConfig(input({ lang: 'en' }))).scales.y
    expect(yEn.title.text).toBe('Thickness Measurement (mm)')
  })

  it('eje derecho espeja los ticks del izquierdo y usa el covering aplicado (R1)', () => {
    const applied: TargetInputs = { skin: '4', pct: '50', skinSoft: '1.5', foam: '3', pctSoft: '40' }
    for (const covering of ['hard', 'soft'] as const) {
      const r = opts(buildChartConfig(input({ appliedCovering: covering, appliedInputs: applied })))
        .scales.yPercentage
      expect(r.position).toBe('right')
      expect(r.grid.display).toBe(false)
      const chart = { scales: { y: { min: 1.5, max: 3, ticks: [{ value: 1.5 }, { value: 2 }, { value: 2.5 }] } } }
      expect(r.min({ chart })).toBe(1.5)
      expect(r.max({ chart })).toBe(3)
      const axis = { chart, ticks: [] as { value: number }[] }
      r.afterBuildTicks(axis)
      expect(axis.ticks.map((t) => t.value)).toEqual([1.5, 2, 2.5])
      for (const v of [1.5, 2, 2.5]) {
        expect(r.ticks.callback(v)).toBe(
          legacyCompressionTick(v, { coveringType: covering, ...applied }),
        )
      }
    }
    expect(opts(buildChartConfig(input())).scales.yPercentage.title.text).toBe('Compresión Real (%)')
    expect(opts(buildChartConfig(input({ lang: 'en' }))).scales.yPercentage.title.text).toBe(
      'Actual Compression (%)',
    )
  })

  it('tooltip con nombre del punto y valor crudo en mm, colores del tema', () => {
    const tt = opts(buildChartConfig(input())).plugins.tooltip
    expect(tt.callbacks.title([])).toBe('')
    expect(tt.callbacks.title([{ parsed: { x: 2 } }])).toBe(parsed.points[1].name)
    expect(tt.callbacks.title([{ parsed: { x: 999 } }])).toBe('P999')
    expect(tt.callbacks.label({ dataset: { label: 'Iter 3' }, parsed: { y: 2.15 } })).toBe(
      ' Iter 3: 2.15 mm',
    )
    expect(tt.backgroundColor).toBe(THEME.tooltipBg)
    expect(tt.titleColor).toBe(THEME.tooltipTitle)
    expect(tt.bodyColor).toBe(THEME.tooltipBody)
    expect(tt.borderColor).toBe(THEME.tooltipBorder)
    expect(tt).toMatchObject({ borderWidth: 1, padding: 12, cornerRadius: 10, displayColors: true })
  })

  it('leyenda filtrada por iteraciones visibles y su clic alterna la iteración (R3)', () => {
    const onToggleIter = vi.fn()
    const legend = opts(buildChartConfig(input({ visibleIters: [0, 2], onToggleIter }))).plugins.legend
    expect(legend).toMatchObject({ display: true, position: 'bottom' })
    expect(legend.labels).toMatchObject({
      color: THEME.text,
      font: { size: 12, weight: '600' },
      padding: 15,
      usePointStyle: true,
      pointStyleWidth: 14,
    })
    expect(legend.labels.filter({ datasetIndex: 0 })).toBe(true)
    expect(legend.labels.filter({ datasetIndex: 1 })).toBe(false)
    legend.onClick({}, { datasetIndex: 2 })
    expect(onToggleIter).toHaveBeenCalledWith(2)
  })
})
