import type { Lang } from './types'

/** Subset of the original TRANSLATIONS dictionary used by the calculation logic (verbatim). */
export const LABELS: Record<Lang, Record<string, string>> = {
  es: {
    'classify.worldClass': 'World Class',
    'classify.capable': 'Capaz',
    'classify.marginal': 'Marginal',
    'classify.notCapable': 'No Capaz',
    'classify.potential': 'Potencial',
    'cc.individuals': 'Individuales',
    'cc.means': 'Medias',
    'cc.ranges': 'Rangos',
    'cc.stddevBot': 'Desv. Est.',
    'cc.movingRange': 'Rango Móvil',
    'cc.noteIMR': 'Datos individuales (subgrupo=1). Se usa gráfica I-MR con rango móvil entre observaciones consecutivas.',
    'cc.noteXR': 'Subgrupos de tamaño n=%s. Constantes: A₂=%.3f, D₃=%.3f, D₄=%.3f',
    'cc.noteXS': 'Subgrupos de tamaño n=%s. Constantes: A₃=%.3f, B₃=%.3f, B₄=%.3f',
    'cc.ooc': 'Fuera de control',
    'cc.inControl': 'Bajo control',
    'rc.runCount': 'Total de rachas',
    'rc.expected': 'Esperado',
    'png.normal': 'Distribución Normal ✓',
    'png.notNormal': 'Posible No-Normalidad',
  },
  en: {
    'classify.worldClass': 'World Class',
    'classify.capable': 'Capable',
    'classify.marginal': 'Marginal',
    'classify.notCapable': 'Not Capable',
    'classify.potential': 'Potential',
    'cc.individuals': 'Individuals',
    'cc.means': 'Means',
    'cc.ranges': 'Ranges',
    'cc.stddevBot': 'Std Dev',
    'cc.movingRange': 'Moving Range',
    'cc.noteIMR': 'Individual data (subgroup=1). I-MR chart using moving range between consecutive observations.',
    'cc.noteXR': 'Subgroup size n=%s. Constants: A₂=%.3f, D₃=%.3f, D₄=%.3f',
    'cc.noteXS': 'Subgroup size n=%s. Constants: A₃=%.3f, B₃=%.3f, B₄=%.3f',
    'cc.ooc': 'Out of control',
    'cc.inControl': 'In control',
    'rc.runCount': 'Total runs',
    'rc.expected': 'Expected',
    'png.normal': 'Normal Distribution ✓',
    'png.notNormal': 'Possible Non-Normality',
  },
}

/** Same lookup as the original `t(key)`: falls back to the key itself. */
export function label(lang: Lang, key: string): string {
  return LABELS[lang][key] || key
}
