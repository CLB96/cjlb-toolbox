import type { Lang } from './logic/types'

/**
 * Textos de Bondline. `fileReadError`: alert literal del original (solo ES); el EN es nuevo (R10).
 */
export const BONDLINE_TEXT: Record<Lang, { fileReadError: string }> = {
  es: { fileReadError: 'Error al leer el archivo. Por favor intenta de nuevo.' },
  en: { fileReadError: 'Error reading the file. Please try again.' },
}

/** Texto del toast para un rechazo de `importWorkbook`. */
export function fileReadErrorText(lang: Lang): string {
  return BONDLINE_TEXT[lang].fileReadError
}
