describe('firebase init', () => {
  it('no falla sin variables de entorno cuando se usan emuladores', async () => {
    vi.stubEnv('VITE_USE_EMULATORS', 'true')
    vi.resetModules()
    const mod = await import('./firebase')
    expect(mod.app.options.projectId).toBe('demo-cjlb-toolbox')
    vi.unstubAllEnvs()
  })
})
