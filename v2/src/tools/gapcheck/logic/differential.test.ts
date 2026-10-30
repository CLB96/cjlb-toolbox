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
import { iterDataset, pointStyle } from './chartStyle'
import { defaultMarkerPositions } from './markers'
import { parseRows } from './parse'
import { computeStats } from './stats'
import { statusOf } from './status'
import { computeTarget } from './target'
import { DEFAULT_TARGET_INPUTS, type CoveringType, type GapPoint, type TargetInputs } from './types'

const COVERINGS: CoveringType[] = ['hard', 'soft']
const real = loadRealRows()

// Regla del dueño (2026-10-30): la primera fila siempre es dato, nunca encabezado.
const legacyNoHeader = (rows: unknown[][]) => legacyProcessData([[], ...rows])

describe('parseRows ≡ legacyProcessData (primera fila como dato)', () => {
  it.skipIf(!real)('Excel real: mismos puntos y KPIs que el original', () => {
    const parsed = parseRows(real!)!
    expect(parsed).toEqual(legacyNoHeader(real!))
    const vp = new Set(parsed.points.map((_, i) => i))
    const vi = new Set(Array.from({ length: parsed.maxIter }, (_, i) => i))
    expect(computeStats(parsed.points, vp, vi, 5)).toEqual(legacyStats(parsed.points, vp, vi, 5))
  })

  it('todas las fixtures sintéticas', () => {
    for (const rows of Object.values(FIXTURES)) {
      expect(parseRows(rows)).toEqual(legacyNoHeader(rows))
    }
  })

  it('una primera fila de texto no se usa como nombres; celdas "12abc" y vacías', () => {
    const named = parseRows([['Punto A', 'Punto B'], [2.1, 2.2], [2.3, 2.4]])
    expect(named?.points.map((p) => p.name)).toEqual(['P1', 'P2'])
    expect(named?.points[0].values).toEqual([2.1, 2.3])
    const got = parseRows([[2.4, '12abc'], [2.44, 1.7]])
    expect(got?.points[0].values).toEqual([2.4, 2.44])
    expect(got?.points[1].values).toEqual([12, 1.7])
    const blanks: unknown[][] = [['5', ' 3 ', ''], ['6', '4', '2'], [' 7', '', '1.5']]
    expect(parseRows(blanks)).toEqual(legacyProcessData(blanks))
  })
})

describe('computeStats ≡ legacyStats', () => {
  it('fixtures con visibilidad total, parcial y vacía', () => {
    for (const rows of Object.values(FIXTURES)) {
      const parsed = legacyProcessData(rows)
      if (!parsed) continue
      const all = new Set(parsed.points.map((_, i) => i))
      const iters = new Set(Array.from({ length: parsed.maxIter }, (_, i) => i))
      const cases: [Set<number>, Set<number>][] = [
        [all, iters],
        [new Set(), iters],
        [new Set([...all].filter((i) => i % 2 === 0)), new Set([0, 99])],
      ]
      for (const [vp, vi] of cases) {
        for (const target of [0, 5]) {
          expect(computeStats(parsed.points, vp, vi, target)).toEqual(legacyStats(parsed.points, vp, vi, target))
        }
      }
    }
  })

  it('valor exactamente igual al objetivo cuenta como cumple', () => {
    const points: GapPoint[] = [
      { name: 'A', values: [1, 5, 3] },
      { name: 'B', values: [5, 2.5] },
    ]
    const vp = new Set([0, 1])
    const vi = new Set([0, 1, 2])
    expect(computeStats(points, vp, vi, 5)).toEqual({
      totalRecords: '2',
      avg: '3.30',
      min: '1',
      max: '5',
      meeting: '5 / 5',
    })
    expect(computeStats(points, vp, vi, 4.99).meeting).toBe('3 / 5')
  })
})

describe('archivos muy grandes', () => {
  it('parseRows y computeStats no lanzan con ~200k filas', () => {
    const N = 200_000
    const values = Array.from({ length: N }, (_, i) => ((i * 7919) % 1000) / 100)
    const parsed = parseRows(values.map((v) => [v, v]))
    expect(parsed?.maxIter).toBe(N)
    const out = computeStats([{ name: 'A', values }], new Set([0]), new Set(values.map((_, i) => i)), 5)
    expect(out.min).toBe('0')
    expect(out.max).toBe('9.99')
    expect(out.meeting.endsWith(` / ${N}`)).toBe(true)
  })
})

describe('computeTarget ≡ legacyComputeGapCheck', () => {
  const CASES: TargetInputs[] = [
    DEFAULT_TARGET_INPUTS,
    { skin: '12.5', pct: '30', skinSoft: '2.5', foam: '8', pctSoft: '40' },
    { skin: '7', pct: '', skinSoft: '', foam: '9.5', pctSoft: '' },
    { skin: '0', pct: '101', skinSoft: '0', foam: '-5', pctSoft: '50' },
  ]
  it('fórmula y valor idénticos en hard y soft', () => {
    for (const covering of COVERINGS) {
      for (const inputs of CASES) {
        const got = computeTarget(covering, inputs)
        const ref = legacyComputeGapCheck({ coveringType: covering, ...inputs })
        expect(got.target).toBe(ref.target)
        expect(got.valueText).toBe(ref.valueText)
        expect(`${got.formula.text}<strong>${got.formula.result}</strong>`).toBe(ref.formulaHtml)
      }
    }
    expect(computeTarget('hard', DEFAULT_TARGET_INPUTS).valueText).toBe('5.00')
    expect(computeTarget('soft', DEFAULT_TARGET_INPUTS).valueText).toBe('35.00')
  })
})

describe('compressionTick, statusOf, pointStyle, iterDataset, marcadores', () => {
  it('compressionTick ≡ legacy (incl. guardas de cero)', () => {
    const inputsList: TargetInputs[] = [
      DEFAULT_TARGET_INPUTS,
      { ...DEFAULT_TARGET_INPUTS, skin: '0', foam: '0' },
      { ...DEFAULT_TARGET_INPUTS, skin: '', skinSoft: '', foam: '' },
    ]
    for (const covering of COVERINGS) {
      for (const inputs of inputsList) {
        for (const v of [0, 1.7, 2.25]) {
          expect(compressionTick(v, covering, inputs)).toBe(legacyCompressionTick(v, { coveringType: covering, ...inputs }))
        }
      }
    }
    expect(compressionTick(3, 'hard', { ...DEFAULT_TARGET_INPUTS, skin: '0' })).toBe('0%')
  })

  it('statusOf y pointStyle ≡ legacy en los umbrales', () => {
    for (const t of [0, 5]) {
      for (const y of [-1, 4.99, 5, 5.5, 5.51, 11.56]) {
        expect(statusOf(y, t)).toBe(legacyStatus(y, t))
        expect(pointStyle(y, t)).toEqual(legacyPointStyle(y, t))
      }
    }
  })

  it('iterDataset ≡ legacy, incl. filas irregulares', () => {
    const parsed = parseRows(FIXTURES.ragged)!
    const vp = new Set(parsed.points.map((_, i) => i))
    for (let it = 0; it < parsed.maxIter + 1; it++) {
      expect(iterDataset(parsed.points, vp, it)).toEqual(legacyIterDataset(parsed.points, vp, it))
    }
  })

  it('defaultMarkerPositions ≡ legacy', () => {
    for (const count of [0, 1, 7, 15, 40]) {
      expect(defaultMarkerPositions(count)).toEqual(legacyDefaultMarkerPositions(count))
    }
  })
})
