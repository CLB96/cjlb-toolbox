import { afterEach, describe, expect, it } from 'vitest'
import { fmtDate } from './dates'

const tz = process.env.TZ
afterEach(() => {
  process.env.TZ = tz
})

describe('fechas', () => {
  it('guarda la fecha local también en husos positivos (mejora A3)', () => {
    process.env.TZ = 'Asia/Tokyo'
    expect(fmtDate(new Date(2026, 9, 30))).toBe('2026-10-30')
    expect(fmtDate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})
