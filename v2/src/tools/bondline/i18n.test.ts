import { I18N } from '../../../legacy-fixtures/bondline/legacyI18n'
import { BONDLINE_I18N, translate, type BondlineKey } from './i18n'

const ARGS = [55, 12, 30, 'Water Base']

test('ES y EN contienen todas las claves del original con el mismo texto', () => {
  for (const lang of ['es', 'en'] as const) {
    const legacy = I18N[lang] as Record<string, unknown>
    for (const [key, value] of Object.entries(legacy)) {
      const ours = BONDLINE_I18N[lang][key as BondlineKey]
      expect(typeof ours, key).toBe(typeof value)
      if (typeof value === 'function') {
        expect(translate(lang, key as BondlineKey, ...ARGS), key).toBe((value as (...a: unknown[]) => string)(...ARGS))
      } else {
        expect(ours, key).toBe(value)
      }
    }
    expect(Object.keys(BONDLINE_I18N[lang]).sort()).toEqual(Object.keys(BONDLINE_I18N.es).sort())
  }
})

test('textos nuevos, alerts literales y fallback a la clave', () => {
  expect(translate('es', 'fileDims', 91, 6)).toBe('91 s × 6 termopares')
  expect(translate('en', 'timeEndExceeds', 91)).toBe('End time cannot exceed 91s')
  expect(translate('es', 'defaultsConfirmReset')).toBe('¿Restaurar valores de fábrica?')
  expect(translate('es', 'layoutRealSize')).toBe('Tamaño real')
  expect(translate('es', 'nope' as BondlineKey)).toBe('nope')
})
