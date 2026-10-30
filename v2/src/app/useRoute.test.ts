import { parseHash } from './routes'

test('parseHash reconoce rutas válidas', () => {
  expect(parseHash('#/gapcheck')).toBe('gapcheck')
  expect(parseHash('#/usage')).toBe('usage')
})
