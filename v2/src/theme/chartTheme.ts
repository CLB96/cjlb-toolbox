import type { ResolvedTheme } from './useTheme'

export type ChartTheme = {
  text: string
  grid: string
  series: string[]
  ok: string
  warn: string
  error: string
}

/* Espejo de tokens.css, solo como respaldo cuando getComputedStyle no ve el CSS
   (jsdom/tests). La fuente de verdad es tokens.css; chartTheme.test.ts comprueba
   que no se desfasen. */
export const FALLBACK_TOKENS: Record<ResolvedTheme, Record<string, string>> = {
  dark: {
    '--fg-muted': '#b3a6d9',
    '--accent-1': '#d16bff',
    '--accent-2': '#6a7bff',
    '--info': '#8fb4ff',
    '--ok': '#7cf0c4',
    '--warn': '#ffd166',
    '--error': '#ff8a9b',
  },
  light: {
    '--fg-muted': '#6d6290',
    '--accent-1': '#9b3fe0',
    '--accent-2': '#4a5fe8',
    '--info': '#2a4fc4',
    '--ok': '#0f7a56',
    '--warn': '#8a5a00',
    '--error': '#b3263e',
  },
}

export function getChartTheme(resolved: ResolvedTheme): ChartTheme {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string) =>
    style.getPropertyValue(name).trim() || FALLBACK_TOKENS[resolved][name]
  return {
    text: read('--fg-muted'),
    grid: resolved === 'dark' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(37, 26, 64, 0.12)',
    series: [read('--accent-1'), read('--accent-2'), read('--ok'), read('--warn'), read('--info')],
    ok: read('--ok'),
    warn: read('--warn'),
    error: read('--error'),
  }
}
