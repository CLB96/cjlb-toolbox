import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContourPoint } from '../types'
import { flattenContour } from './contourPath'
import { downloadBlob } from './download'
import { choosePdfPage, layoutPdf, PDF_MARGIN } from './exportPdf'

const p = (x: number, y: number, type: ContourPoint['type'] = 'line'): ContourPoint => ({ id: `${x},${y}`, x, y, type })

describe('flattenContour', () => {
  it('line-only contours keep exactly their points', () => {
    const pts = [p(0, 0), p(10, 0), p(10, 5)]
    expect(flattenContour(pts)).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }])
  })
  it('a bezier segment is sampled and passes through its end points', () => {
    const pts = [p(0, 0, 'bezier'), p(10, 0), p(10, 10), p(0, 10)]
    const flat = flattenContour(pts)
    expect(flat[0]).toEqual({ x: 0, y: 0 })
    expect(flat.length).toBe(4 + 15)
    expect(flat[16]).toEqual({ x: 10, y: 0 })
  })
  it('open contours do not sample the closing segment', () => {
    const pts = [p(0, 0), p(10, 0), p(10, 10, 'bezier')]
    expect(flattenContour(pts, false)).toHaveLength(3)
    expect(flattenContour(pts, true)).toHaveLength(3 + 15)
  })
})

describe('choosePdfPage (S7)', () => {
  const m = 2 * PDF_MARGIN
  it.each([
    [100, 100, 'A4', 'portrait', 210, 297],
    [210 - m, 297 - m, 'A4', 'portrait', 210, 297],
    [250, 150, 'A4', 'landscape', 297, 210],
    [200, 300, 'A3', 'portrait', 297, 420],
    [380, 250, 'A3', 'landscape', 420, 297],
    [380, 500, 'A2', 'portrait', 420, 594],
    [700, 500, 'A1', 'landscape', 841, 594],
    [800, 1100, 'A0', 'portrait', 841, 1189],
  ] as const)('%s×%s mm → %s %s', (w, h, name, orientation, width, height) => {
    expect(choosePdfPage(w, h)).toEqual({ name, orientation, width, height })
  })
  it('beyond A0 → custom page of drawing + margins', () => {
    expect(choosePdfPage(1500, 900)).toEqual({ name: 'custom', orientation: 'landscape', width: 1530, height: 930 })
  })
  it('layoutPdf puts the bbox minimum at the margin and never clips', () => {
    const layout = layoutPdf([p(500, 1000), p(1000, 1000), p(1000, 1300)], 1, [])!
    expect(layout.page.name).toBe('A2')
    const xs = layout.polylines.flat().map((q) => q.x); const ys = layout.polylines.flat().map((q) => q.y)
    expect(Math.min(...xs)).toBe(PDF_MARGIN); expect(Math.min(...ys)).toBe(PDF_MARGIN)
    expect(Math.max(...xs)).toBeLessThanOrEqual(layout.page.width - PDF_MARGIN)
    expect(Math.max(...ys)).toBeLessThanOrEqual(layout.page.height - PDF_MARGIN)
  })
})

describe('downloadBlob', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
  it('clicks a link and revokes the object URL after a tick, not synchronously', () => {
    vi.useFakeTimers()
    const create = vi.fn(() => 'blob:x'); const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadBlob(new Blob(['a']), 'f.svg')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revoke).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:x')
  })
})

describe('loadImageFromBlob', () => {
  afterEach(() => vi.restoreAllMocks())
  it('keeps the object URL alive so <img src> keeps showing the image', async () => {
    const { loadImageFromBlob } = await import('./imageNormalize')
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:img'), revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement) {
      queueMicrotask(() => this.onload?.(new Event('load')))
    })
    await loadImageFromBlob(new Blob(['x']))
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
