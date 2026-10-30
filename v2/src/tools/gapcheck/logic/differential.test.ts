import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/gapcheck/fixtures'
import { loadRealRows } from '../../../../legacy-fixtures/gapcheck/realFixture'
import {
  legacyCompressionTick,
  legacyComputeGapCheck,
  legacyDefaultMarkerPositions,
  legacyIterDataset,
  legacyPointStyle,
  legacyProcessData,
  legacyStats,
  legacyStatus,
} from '../../../../legacy-fixtures/gapcheck/legacyReference'
import { compressionTick } from './axis'
import { hexToRgba, iterDataset, PALETTE_SOLID, POINT_COLORS, pointStyle } from './chartStyle'
import { defaultMarkerPositions } from './markers'
import { parseRows } from './parse'
import { computeStats } from './stats'
import { statusOf } from './status'
import { computeTarget } from './target'
import { DEFAULT_TARGET_INPUTS, type CoveringType, type GapPoint, type TargetInputs } from './types'

const real = loadRealRows()
const allFixtures: Record<string, unknown[][]> = { ...FIXTURES }
if (real) allFixtures.real = real

const COVERINGS: CoveringType[] = ['hard', 'soft']
const GRID = ['10', '50', '', '0', '12.5', '101', '-5']

// Regla del dueño (2026-10-30): la primera fila siempre es dato, nunca encabezado.
// Equivale al original con una fila vacía delante (sin cabecera detectable).
const legacyNoHeader = (rows: unknown[][]) => legacyProcessData([[], ...rows])

describe('parseRows ≡ legacyProcessData (primera fila como dato)', () => {
  for (const [name, rows] of Object.entries(allFixtures)) {
    it(`fixture ${name}`, () => {
      expect(parseRows(rows)).toEqual(legacyNoHeader(rows))
    })
  }

  it('una primera fila de texto no se usa como nombres: los puntos son P1…Pn', () => {
    const rows: unknown[][] = [['Punto A', 'Punto B'], [2.1, 2.2], [2.3, 2.4]]
    const got = parseRows(rows)
    expect(got?.points.map((p) => p.name)).toEqual(['P1', 'P2'])
    expect(got?.points[0].values).toEqual([2.1, 2.3])
  })

  it('la primera fila numérica cuenta como primera iteración', () => {
    const rows: unknown[][] = [[2.4, '12abc'], [2.44, 1.7]]
    const got = parseRows(rows)
    expect(got?.points[0].values).toEqual([2.4, 2.44])
    expect(got?.points[1].values).toEqual([12, 1.7])
  })

  it('primera fila solo con strings numéricos (sin cabecera)', () => {
    const rows: unknown[][] = [['5', ' 3 ', ''], ['6', '4', '2'], [' 7', '', '1.5']]
    const got = parseRows(rows)
    expect(got).toEqual(legacyProcessData(rows))
    expect(got?.points.map((p) => p.name)).toEqual(['P1', 'P2', 'P3'])
    expect(got?.points[0].values).toEqual([5, 6, 7])
  })

  it('ragged produce los mismos puntos', () => {
    expect(parseRows(FIXTURES.ragged)).toEqual(legacyProcessData(FIXTURES.ragged))
    expect(parseRows(FIXTURES.ragged)).not.toBeNull()
  })
})

function visibilityCases(points: GapPoint[], maxIter: number) {
  const all = new Set(points.map((_, i) => i))
  const allIters = new Set(Array.from({ length: maxIter }, (_, i) => i))
  return [
    ['todo', all, allIters],
    ['ningún punto', new Set<number>(), allIters],
    ['ninguna iteración', all, new Set<number>()],
    ['puntos pares', new Set([...all].filter((i) => i % 2 === 0)), allIters],
    ['solo iteración 1', all, new Set([0])],
    ['iteraciones fuera de rango', all, new Set([0, 99, 100])],
    ['subconjunto mixto', new Set([...all].filter((i) => i % 3 !== 1)), new Set([1, 2])],
  ] as const
}

describe('computeStats ≡ legacyStats', () => {
  for (const [name, rows] of Object.entries(allFixtures)) {
    const parsed = legacyProcessData(rows)
    if (!parsed) continue
    for (const [label, vp, vi] of visibilityCases(parsed.points, parsed.maxIter)) {
      for (const target of [0, 2, 5, 1000]) {
        it(`${name} / ${label} / target ${target}`, () => {
          expect(computeStats(parsed.points, vp, vi, target)).toEqual(
            legacyStats(parsed.points, vp, vi, target),
          )
        })
      }
    }
  }

  it('camino positivo sintético, con un valor exactamente igual al objetivo', () => {
    const points: GapPoint[] = [
      { name: 'A', values: [1, 5, 3] },
      { name: 'B', values: [5, 2.5] },
    ]
    const vp = new Set([0, 1])
    const vi = new Set([0, 1, 2])
    const out = computeStats(points, vp, vi, 5)
    expect(out).toEqual({
      totalRecords: '2',
      avg: '3.30',
      min: '1',
      max: '5',
      meeting: '5 / 5',
    })
    expect(out).toEqual(legacyStats(points, vp, vi, 5))
    // 5 === target cuenta como cumple; 5 > 4.99 no
    expect(computeStats(points, vp, vi, 4.99).meeting).toBe('3 / 5')
  })

  it('valores undefined en los datos se ignoran igual que el original', () => {
    const points = [{ name: 'A', values: [1, undefined as unknown as number, 3] }]
    const vp = new Set([0])
    const vi = new Set([0, 1, 2])
    expect(computeStats(points, vp, vi, 2)).toEqual(legacyStats(points, vp, vi, 2))
  })
})

describe('archivos muy grandes', () => {
  const N = 200_000
  const values = Array.from({ length: N }, (_, i) => ((i * 7919) % 1000) / 100)

  it('computeStats no lanza con ~200k valores y da min/max/avg correctos', () => {
    const points: GapPoint[] = [{ name: 'A', values }]
    const vp = new Set([0])
    const vi = new Set(values.map((_, i) => i))
    const out = computeStats(points, vp, vi, 5)
    expect(out.min).toBe('0')
    expect(out.max).toBe('9.99')
    expect(out.meeting.endsWith(` / ${N}`)).toBe(true)
  })

  it('mismos valores que el original sobre un trozo pequeño del mismo conjunto', () => {
    const slice = values.slice(0, 500)
    const points: GapPoint[] = [{ name: 'A', values: slice }]
    const vp = new Set([0])
    const vi = new Set(slice.map((_, i) => i))
    expect(computeStats(points, vp, vi, 5)).toEqual(legacyStats(points, vp, vi, 5))
  })

  it('parseRows no lanza con ~200k filas', () => {
    const rows: unknown[][] = [['A', 'B'], ...values.map((v) => [v, v])]
    const got = parseRows(rows)
    expect(got?.maxIter).toBe(N)
    expect(got?.points).toHaveLength(2)
  })
})

describe('computeTarget ≡ legacyComputeGapCheck', () => {
  for (const covering of COVERINGS) {
    for (const a of GRID) {
      for (const b of GRID) {
        it(`${covering} a="${a}" b="${b}"`, () => {
          const inputs: TargetInputs = {
            skin: a,
            pct: b,
            skinSoft: a,
            foam: b,
            pctSoft: b === '' ? '50' : b,
          }
          const got = computeTarget(covering, inputs)
          const ref = legacyComputeGapCheck({ coveringType: covering, ...inputs })
          expect(got.target).toBe(ref.target)
          expect(got.valueText).toBe(ref.valueText)
          expect(`${got.formula.text}<strong>${got.formula.result}</strong>`).toBe(ref.formulaHtml)
        })
      }
    }
  }

  const DISTINCT: TargetInputs[] = [
    { skin: '12.5', pct: '30', skinSoft: '2.5', foam: '8', pctSoft: '40' },
    { skin: '7', pct: '', skinSoft: '', foam: '9.5', pctSoft: '' },
    { skin: '', pct: '20', skinSoft: '3', foam: '', pctSoft: '65' },
    { skin: '4', pct: '15', skinSoft: '', foam: '6', pctSoft: '25' },
    { skin: '9', pct: '60', skinSoft: '1.5', foam: '11', pctSoft: '' },
  ]
  for (const covering of COVERINGS) {
    DISTINCT.forEach((inputs, n) => {
      it(`campos distintos ${covering} #${n}`, () => {
        const got = computeTarget(covering, inputs)
        const ref = legacyComputeGapCheck({ coveringType: covering, ...inputs })
        expect(got.target).toBe(ref.target)
        expect(got.valueText).toBe(ref.valueText)
        expect(`${got.formula.text}<strong>${got.formula.result}</strong>`).toBe(ref.formulaHtml)
      })
    })
  }

  it('valores por defecto', () => {
    expect(computeTarget('hard', DEFAULT_TARGET_INPUTS).valueText).toBe('5.00')
    expect(computeTarget('soft', DEFAULT_TARGET_INPUTS).valueText).toBe('35.00')
  })
})

describe('compressionTick ≡ legacyCompressionTick', () => {
  const values = [0, 1, 1.7, 2.25, 5, 9.99]
  const inputsList: TargetInputs[] = [
    DEFAULT_TARGET_INPUTS,
    { ...DEFAULT_TARGET_INPUTS, skin: '0' },
    { ...DEFAULT_TARGET_INPUTS, foam: '0' },
    { ...DEFAULT_TARGET_INPUTS, skin: '', skinSoft: '', foam: '' },
    { ...DEFAULT_TARGET_INPUTS, skin: '12.5', skinSoft: '3', foam: '7.5' },
  ]
  for (const covering of COVERINGS) {
    inputsList.forEach((inputs, n) => {
      for (const v of values) {
        it(`${covering} inputs#${n} v=${v}`, () => {
          expect(compressionTick(v, covering, inputs)).toBe(
            legacyCompressionTick(v, { coveringType: covering, ...inputs }),
          )
        })
      }
    })
  }

  it('guardas de cero devuelven 0%', () => {
    expect(compressionTick(3, 'hard', { ...DEFAULT_TARGET_INPUTS, skin: '0' })).toBe('0%')
    expect(compressionTick(3, 'soft', { ...DEFAULT_TARGET_INPUTS, foam: '0' })).toBe('0%')
  })
})

describe('statusOf, pointStyle, iterDataset', () => {
  const targets = [0, 5, 10.5]
  const ys = [-1, 0, 4.99, 5, 5.01, 5.5, 5.51, 10, 11.55, 11.56, 100]

  it('statusOf ≡ legacyStatus', () => {
    for (const t of targets) for (const y of ys) expect(statusOf(y, t)).toBe(legacyStatus(y, t))
  })

  it('pointStyle ≡ legacyPointStyle', () => {
    for (const t of targets) for (const y of ys) expect(pointStyle(y, t)).toEqual(legacyPointStyle(y, t))
  })

  for (const [name, rows] of Object.entries(allFixtures)) {
    const parsed = legacyProcessData(rows)
    if (!parsed) continue
    it(`iterDataset ${name}`, () => {
      for (const [, vp] of visibilityCases(parsed.points, parsed.maxIter)) {
        for (let it = 0; it < parsed.maxIter + 2; it++) {
          expect(iterDataset(parsed.points, vp, it)).toEqual(legacyIterDataset(parsed.points, vp, it))
        }
      }
    })
  }

  it('iterDataset con ragged (FIXTURES.ragged) y valores undefined', () => {
    const parsed = parseRows(FIXTURES.ragged)!
    const vp = new Set(parsed.points.map((_, i) => i))
    expect(iterDataset(parsed.points, vp, 1)).toEqual(legacyIterDataset(parsed.points, vp, 1))
    const holes = [{ name: 'H', values: [1, undefined as unknown as number, 3] }]
    expect(iterDataset(holes, new Set([0]), 1)).toEqual(legacyIterDataset(holes, new Set([0]), 1))
    expect(iterDataset(holes, new Set([0]), 1)).toEqual([])
  })
})

describe('defaultMarkerPositions ≡ legacy', () => {
  for (let count = 0; count <= 40; count++) {
    it(`count ${count}`, () => {
      expect(defaultMarkerPositions(count)).toEqual(legacyDefaultMarkerPositions(count))
    })
  }
})

describe('constantes de color', () => {
  it('paletas literales del inventario', () => {
    expect(PALETTE_SOLID).toHaveLength(15)
    expect(POINT_COLORS).toHaveLength(15)
    expect(PALETTE_SOLID.join()).toBe(
      '#4f8cff,#8b5cf6,#43b36b,#f59e0b,#ef5b67,#06b6d4,#ec4899,#84cc16,#f97316,#6366f1,#14b8a6,#a855f7,#0ea5e9,#d97706,#10b981',
    )
    expect(POINT_COLORS.join()).toBe(
      '#4f8cff,#ef5b67,#43b36b,#8b5cf6,#f59e0b,#06b6d4,#ec4899,#84cc16,#f97316,#6366f1,#14b8a6,#a855f7,#0ea5e9,#d97706,#10b981',
    )
  })

  it('hexToRgba sin espacios', () => {
    expect(hexToRgba('#4f8cff', 0.82)).toBe('rgba(79,140,255,0.82)')
  })
})
