import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FALLBACK_TOKENS, getChartTheme } from './chartTheme'

function blockFor(css: string, selector: string): string {
  const start = css.indexOf(selector)
  return css.slice(start, css.indexOf('}', start))
}

describe('chartTheme', () => {
  it('falls back to token values when CSS is not loaded', () => {
    const t = getChartTheme('dark')
    expect(t.ok).toBe(FALLBACK_TOKENS.dark['--ok'])
    expect(t.series).toHaveLength(5)
  })

  it('fallback mirror matches tokens.css for both themes', () => {
    const css = readFileSync('src/theme/tokens.css', 'utf8')
    for (const theme of ['dark', 'light'] as const) {
      const block = blockFor(css, `:root[data-theme='${theme}']`)
      for (const [name, value] of Object.entries(FALLBACK_TOKENS[theme])) {
        expect(block).toContain(`${name}: ${value};`)
      }
    }
  })
})
