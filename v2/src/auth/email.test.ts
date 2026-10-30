import { normalizeEmail } from './email'

describe('normalizeEmail', () => {
  it('recorta y pasa a minúsculas', () => {
    expect(normalizeEmail('  Ana@X.COM ')).toBe('ana@x.com')
  })
})
