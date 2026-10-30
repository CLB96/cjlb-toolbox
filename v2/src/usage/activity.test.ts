import { createActivityTracker } from './activity'

const IDLE = 300_000
function setup() {
  let t = 1_000_000
  const tracker = createActivityTracker({ idleMs: IDLE, now: () => t })
  return { tracker, advance: (ms: number) => (t += ms) }
}

test('cuenta el tiempo transcurrido si hubo interacción reciente', () => {
  const { tracker, advance } = setup()
  tracker.recordInteraction()
  advance(60_000)
  expect(tracker.collect(true)).toBe(60)
})

test('sin interacción solo cuenta hasta idleMs y después aporta 0', () => {
  const { tracker, advance } = setup()
  tracker.recordInteraction()
  advance(60_000)
  tracker.collect(true)
  advance(6 * 60_000)
  const secs = tracker.collect(true)
  expect(secs).toBeLessThanOrEqual(300)
  expect(secs).toBe(240)
  advance(60_000)
  expect(tracker.collect(true)).toBe(0)
})

test('pestaña oculta aporta 0 y reinicia el tramo', () => {
  const { tracker, advance } = setup()
  tracker.recordInteraction()
  advance(60_000)
  expect(tracker.collect(false)).toBe(0)
  advance(10_000)
  expect(tracker.collect(true)).toBe(10)
})

test('un salto de reloj de 8 h sin interacción aporta como máximo idleMs', () => {
  const { tracker, advance } = setup()
  tracker.recordInteraction()
  advance(8 * 3600_000)
  expect(tracker.collect(true)).toBeLessThanOrEqual(300)
})

test('un reloj que retrocede no aporta segundos negativos', () => {
  const { tracker, advance } = setup()
  tracker.recordInteraction()
  advance(-5_000)
  expect(tracker.collect(true)).toBe(0)
})
