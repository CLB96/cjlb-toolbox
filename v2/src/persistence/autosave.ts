export interface AutosaveOptions {
  intervalMs: number
  save(): Promise<void>
  onError(e: unknown): void
}

export interface Autosave {
  markDirty(): void
  flush(): Promise<void>
  dispose(): void
}

export function createAutosave({ intervalMs, save, onError }: AutosaveOptions): Autosave {
  let dirty = false
  let disposed = false
  let chain: Promise<void> = Promise.resolve()

  const run = (): Promise<void> => {
    chain = chain.then(async () => {
      if (!dirty) return
      dirty = false
      try {
        await save()
      } catch (e) {
        dirty = true
        onError(e)
      }
    })
    return chain
  }

  const onHide = () => {
    if (document.visibilityState === 'hidden') void run()
  }
  const onPageHide = () => {
    void run()
  }

  const timer = setInterval(() => {
    if (dirty) void run()
  }, intervalMs)
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onPageHide)

  return {
    markDirty() {
      if (!disposed) dirty = true
    },
    flush: run,
    dispose() {
      disposed = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
    },
  }
}
