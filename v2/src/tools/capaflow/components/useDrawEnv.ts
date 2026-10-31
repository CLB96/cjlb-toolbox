import { useMemo } from 'react'
import { getChartTheme } from '../../../theme/chartTheme'
import { useTheme } from '../../../theme/useTheme'
import type { DrawEnv } from '../draw/canvas'
import { translate, useCapaT } from '../i18n'

/** Tema y textos que necesitan los dibujos de canvas (el original leía currentTheme/currentLang). */
export function useDrawEnv(): DrawEnv {
  const { resolved } = useTheme()
  const { lang } = useCapaT()
  return useMemo(
    () => ({
      isDark: resolved === 'dark',
      lang,
      tr: (key) => translate(lang, key),
    }),
    [resolved, lang],
  )
}

/** colorForCpk() devuelve variables CSS del original; el canvas necesita el color ya resuelto. */
export function useResolveCssColor(): (cssVar: string) => string {
  const { resolved } = useTheme()
  return (cssVar) => {
    const ct = getChartTheme(resolved)
    if (cssVar === 'var(--accent-green)') return ct.ok
    if (cssVar === 'var(--accent-yellow)') return ct.warn
    if (cssVar === 'var(--accent-red)') return ct.error
    return ct.series[0]!
  }
}
