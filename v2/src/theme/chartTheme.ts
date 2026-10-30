import type { ResolvedTheme } from './useTheme'

export type ChartTheme = {
  text: string
  grid: string
  series: string[]
  ok: string
  warn: string
  error: string
  tooltipBg: string
  tooltipTitle: string
  tooltipBody: string
  tooltipBorder: string
}

/* Espejo de tokens.css, solo como respaldo cuando getComputedStyle no ve el CSS
   (jsdom/tests). La fuente de verdad es tokens.css; chartTheme.test.ts comprueba
   que no se desfasen. */
export const FALLBACK_TOKENS: Record<ResolvedTheme, Record<string, string>> = {
  dark: {
    '--fg': '#efe9ff',
    '--fg-muted': '#b3a6d9',
    '--glass-solid': '#241545',
    '--edge': 'rgba(255, 255, 255, 0.16)',
    '--accent-1': '#d16bff',
    '--accent-2': '#6a7bff',
    '--info': '#8fb4ff',
    '--ok': '#7cf0c4',
    '--warn': '#ffd166',
    '--error': '#ff8a9b',
  },
  light: {
    '--fg': '#251a40',
    '--fg-muted': '#6d6290',
    '--glass-solid': '#f3eeff',
    '--edge': 'rgba(255, 255, 255, 0.9)',
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
    tooltipBg: read('--glass-solid'),
    tooltipTitle: read('--fg'),
    tooltipBody: read('--fg-muted'),
    tooltipBorder: read('--edge'),
  }
}
