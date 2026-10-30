import { I18N } from '../../../legacy-fixtures/bondline/legacyI18n'
import { BONDLINE_I18N, translate, type BondlineKey } from './i18n'

const ARGS = [55, 12, 30, 'Water Base']

describe.each(['es', 'en'] as const)('diccionario %s', (lang) => {
  const legacy = I18N[lang] as Record<string, unknown>

  test('contiene todas las claves del original con el mismo texto', () => {
    for (const [key, value] of Object.entries(legacy)) {
      const ours = BONDLINE_I18N[lang][key as BondlineKey]
      expect(typeof ours, key).toBe(typeof value)
      if (typeof value === 'function') {
        expect(translate(lang, key as BondlineKey, ...ARGS), key).toBe(
          (value as (...a: unknown[]) => string)(...ARGS),
        )
      } else {
        expect(ours, key).toBe(value)
      }
    }
  })

  test('ES y EN tienen las mismas claves', () => {
    expect(Object.keys(BONDLINE_I18N[lang]).sort()).toEqual(Object.keys(BONDLINE_I18N.es).sort())
  })
})

test('textos nuevos y alerts literales', () => {
  expect(translate('es', 'fileDims', 91, 6)).toBe('91 s × 6 termopares')
  expect(translate('en', 'fileDims', 91, 6)).toBe('91 s × 6 thermocouples')
  expect(translate('es', 'timeEndExceeds', 91)).toBe('El tiempo final no puede exceder 91s')
  expect(translate('en', 'timeEndExceeds', 91)).toBe('End time cannot exceed 91s')
  expect(translate('es', 'timeStartNegative')).toBe('El tiempo de inicio debe ser mayor o igual a 0')
  expect(translate('en', 'timeEndNotAfterStart')).toBe('End time must be greater than start time')
  expect(translate('es', 'defaultsConfirmReset')).toBe('¿Restaurar valores de fábrica?')
  expect(translate('en', 'defaultsConfirmReset')).toBe('Restore factory values?')
  expect(translate('es', 'layoutRealSize')).toBe('Tamaño real')
})

test('fallback como T(): idioma -> ES -> clave', () => {
  expect(translate('es', 'nope' as BondlineKey)).toBe('nope')
})
