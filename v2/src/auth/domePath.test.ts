import { DOME, domeMinWidth, domePath } from './domePath'

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

test('el contorno ocupa el ancho y alto dados y la cúpula llega hasta arriba', () => {
  const d = domePath(400, 500)
  const xs = numbers(d.replace(/A[\d.,\s]+? 0 [01] [01] /g, 'A '))
  expect(d.startsWith('M0,')).toBe(true)
  expect(d.endsWith('Z')).toBe(true)
  expect(Math.max(...xs)).toBe(500)
  expect(d).toContain(`A${DOME.radius},${DOME.radius} 0 0 1`)
  // el borde superior del cuadro queda a la altura del radio de la cúpula
  expect(d).toContain(`,${DOME.radius + DOME.corner}`)
})

test('la cúpula queda centrada: sus extremos son simétricos', () => {
  const d = domePath(360, 480)
  const dome = d.match(/A74,74 0 0 1 ([\d.]+),([\d.]+)/)
  const start = d.match(/A12,12 0 0 0 ([\d.]+),([\d.]+) A74/)
  expect(dome && start).toBeTruthy()
  expect(Number(start![1]) + Number(dome![1])).toBeCloseTo(360, 1)
  expect(start![2]).toBe(dome![2])
})

test('el contorno del borde se mete medio píxel hacia adentro', () => {
  const d = domePath(400, 500, 0.5)
  expect(d.startsWith('M0.5,')).toBe(true)
  expect(d).toContain('A73.5,73.5 0 0 1')
  expect(d).toContain('L399.5,')
})

test('el ancho mínimo deja lugar a la cúpula y a las dos esquinas', () => {
  expect(domeMinWidth()).toBeGreaterThan(2 * (DOME.radius + DOME.corner))
  expect(domeMinWidth()).toBeLessThan(260)
})
