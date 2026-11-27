import { bulges, contentOpacity, menuShapePath, ORB, stepSpring } from './elasticMenu'

function simulate(target: number, steps = 600, dt = 1 / 60) {
  let s = { p: 0, v: 0 }
  let max = 0
  for (let i = 0; i < steps; i++) {
    s = stepSpring(s, target, dt)
    max = Math.max(max, s.p)
  }
  return { s, max }
}

test('el resorte llega al menú, se pasa un poco y se asienta', () => {
  const { s, max } = simulate(1)
  expect(max).toBeGreaterThan(1.02)
  expect(s.p).toBeCloseTo(1, 2)
  expect(Math.abs(s.v)).toBeLessThan(0.01)
})

test('el resorte vuelve al círculo', () => {
  let s = { p: 1, v: 0 }
  for (let i = 0; i < 600; i++) s = stepSpring(s, 0, 1 / 60)
  expect(s.p).toBeCloseTo(0, 2)
})

test('en reposo no hay abombamiento y con velocidad se abomba sin pasar del máximo', () => {
  expect(bulges(0, 230, 318)).toEqual({ bx: 0, by: 0 })
  const fast = bulges(50, 230, 318)
  expect(fast.bx).toBe(26)
  expect(fast.by).toBe(26)
  expect(bulges(-50, 230, 318).bx).toBe(-26)
})

test('con p = 0 el trazo es el círculo del logo y con p = 1 el cuadro completo', () => {
  const circle = menuShapePath(0, 0, 0, 230, 318)
  expect(circle.startsWith('M20.0 0H20.0')).toBe(true)
  const full = menuShapePath(1, 0, 0, 230, 318)
  expect(full).toContain(`H${(230 - 14).toFixed(1)}`)
  expect(ORB).toBe(40)
})

test('el contenido aparece cuando el cuadro ya casi tiene su tamaño', () => {
  expect(contentOpacity(0.3)).toBe(0)
  expect(contentOpacity(0.7)).toBeGreaterThan(0)
  expect(contentOpacity(1)).toBe(1)
})
