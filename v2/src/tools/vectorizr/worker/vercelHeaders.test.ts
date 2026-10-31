// @vitest-environment node
// La CSP con 'unsafe-eval' solo debe llegar al worker y a opencv.js, nunca a la página (S5).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface HeaderRule { source: string; headers: { key: string; value: string }[] }
const config = JSON.parse(readFileSync(new URL('../../../../vercel.json', import.meta.url), 'utf8')) as { headers: HeaderRule[] }
const csp = (rule: HeaderRule) => rule.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''

describe('vercel.json headers', () => {
  it('the general page CSP has no eval permission', () => {
    const general = config.headers.find((r) => r.source === '/(.*)')!
    expect(csp(general)).not.toMatch(/unsafe-eval|wasm-unsafe-eval/)
    expect(config.headers.indexOf(general)).toBe(0)
  })

  it.each(['/vendor/opencv/(.*)', '/assets/opencv.worker-(.*)'])('%s gets the worker CSP after the general rule', (source) => {
    const rule = config.headers.find((r) => r.source === source)!
    expect(csp(rule)).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self' data:; object-src 'none'; base-uri 'self'",
    )
    expect(config.headers.indexOf(rule)).toBeGreaterThan(0)
  })

  it('opencv.js is cached as immutable', () => {
    const rule = config.headers.find((r) => r.source === '/vendor/opencv/(.*)')!
    expect(rule.headers).toContainEqual({ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' })
  })
})

describe('Permissions-Policy', () => {
  it('allows the camera only for the site itself ("📷 Tomar foto"), still blocks microphone and geolocation', () => {
    const general = config.headers.find((r) => r.source === '/(.*)')!
    const pp = general.headers.find((h) => h.key === 'Permissions-Policy')?.value
    expect(pp).toBe('camera=(self), microphone=(), geolocation=()')
  })
})
