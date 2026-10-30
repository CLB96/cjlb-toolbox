import { parseHash } from './routes'

test('parseHash reconoce rutas válidas', () => {
  expect(parseHash('#/gapcheck')).toBe('gapcheck')
  expect(parseHash('#/usage')).toBe('usage')
})

test('parseHash devuelve home para desconocidas o vacías', () => {
  expect(parseHash('#/xyz')).toBe('home')
  expect(parseHash('')).toBe('home')
})
