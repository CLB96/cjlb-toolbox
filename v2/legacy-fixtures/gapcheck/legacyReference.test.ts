import { describe, expect, it } from 'vitest'
import { FIXTURES } from './fixtures'
import {
  legacyComputeGapCheck,
  legacyDefaultMarkerPositions,
  legacyIterDataset,
  legacyProcessData,
  legacyStats,
  legacyStatus,
  legacyPointStyle,
  legacyCompressionTick,
} from './legacyReference'
import { loadRealRows } from './realFixture'

const real = loadRealRows()
const DEFAULTS = { skin: '10', pct: '50', skinSoft: '10', foam: '50', pctSoft: '50' }

describe('legacyProcessData', () => {
  it.skipIf(!real)('da 20 puntos x 10 iteraciones con el Excel real', () => {
    const r = legacyProcessData(real!)
    expect(r?.points).toHaveLength(20)
    expect(r?.maxIter).toBe(10)
  })

  it('maneja las fixtures sintéticas', () => {
    expect(legacyProcessData(FIXTURES.empty)).toBeNull()
    expect(legacyProcessData(FIXTURES.textOnlyColumn)?.points.map((p) => p.name)).toEqual(['N'])
    expect(legacyProcessData(FIXTURES.numericHeader)?.points[0].values).toEqual([1, 1.1, 1.4])
    expect(legacyProcessData(FIXTURES.blanks)?.points.map((p) => p.name)).toEqual(['P1', 'P3'])
    expect(legacyProcessData(FIXTURES.numericStrings)?.points[0].values).toEqual([1, 2, 3.2, 12])
    expect(legacyProcessData(FIXTURES.single)?.maxIter).toBe(1)
    expect(legacyProcessData(FIXTURES.header)?.points.map((p) => p.name)).toEqual(['A1', 'B2', 'P3', 'D4'])
  })
})

describe('legacyStats', () => {
  it.skipIf(!real)('reproduce los textos medidos en el original', () => {
    const { points, maxIter } = legacyProcessData(real!)!
    const all = new Set(points.map((_, i) => i))
    const iters = new Set(Array.from({ length: maxIter }, (_, i) => i))
    expect(legacyStats(points, all, iters, 5)).toEqual({
      totalRecords: '20', avg: '2.25', min: '1.7', max: '2.65', meeting: '200 / 200',
    })
  })

  it('devuelve ceros si no hay valores visibles', () => {
    const { points } = legacyProcessData(FIXTURES.plain)!
    expect(legacyStats(points, new Set(), new Set([0]), 5)).toEqual({
      totalRecords: '0', avg: '0', min: '0', max: '0', meeting: '0 / 0',
    })
  })
})

describe('legacyComputeGapCheck', () => {
  it('hard por defecto', () => {
    const r = legacyComputeGapCheck({ coveringType: 'hard', ...DEFAULTS })
    expect(r.target).toBe(5)
    expect(r.valueText).toBe('5.00')
    expect(r.formulaHtml).toBe('Skin × (1 - 50%)  →  10 × 0.50 = <strong>5.00 mm</strong>')
  })

  it('soft por defecto', () => {
    const r = legacyComputeGapCheck({ coveringType: 'soft', ...DEFAULTS })
    expect(r.valueText).toBe('35.00')
    expect(r.formulaHtml).toBe('Skin + Foam × (1 - 50%)  →  10 + 50 × 0.50 = <strong>35.00 mm</strong>')
  })

  it('entradas vacías o inválidas valen 0', () => {
    const r = legacyComputeGapCheck({ coveringType: 'hard', ...DEFAULTS, skin: '', pct: 'abc' })
    expect(r.valueText).toBe('0.00')
  })
})

describe('helpers', () => {
  it('status, estilo, dataset, ticks y marcadores', () => {
    expect(legacyStatus(5, 5)).toBe('met')
    expect(legacyStatus(5.5, 5)).toBe('warning')
    expect(legacyStatus(5.6, 5)).toBe('notMet')
    expect(legacyPointStyle(6, 5)).toEqual({ style: 'crossRot', radius: 9, hoverRadius: 12, borderWidth: 3 })
    const { points } = legacyProcessData(FIXTURES.header)!
    expect(legacyIterDataset(points, new Set([0, 1]), 0)).toEqual([{ x: 1, y: 1.5 }, { x: 2, y: 2.5 }])
    const base = { coveringType: 'hard' as const, skin: '10', skinSoft: '10', foam: '50' }
    expect(legacyCompressionTick(5, base)).toBe('50%')
    expect(legacyCompressionTick(35, { ...base, coveringType: 'soft' })).toBe('50%')
    expect(legacyDefaultMarkerPositions(2)).toEqual([{ x: 20, y: 50 }, { x: 50, y: 50 }])
    expect(legacyDefaultMarkerPositions(20)).toHaveLength(20)
  })
})
