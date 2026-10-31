// Auxiliar de pruebas: jsdom no trae canvas; este contexto registra cada llamada y asignación.
export interface CtxCall {
  name: string
  args: unknown[]
}

export interface RecordingCtx {
  ctx: CanvasRenderingContext2D
  calls: CtxCall[]
  /** Valores asignados a propiedades (strokeStyle, fillStyle...) en orden. */
  sets: { prop: string; value: unknown }[]
  count(name: string): number
}

export function recordingCtx(): RecordingCtx {
  const calls: CtxCall[] = []
  const sets: { prop: string; value: unknown }[] = []
  const state: Record<string, unknown> = {}
  const gradient = { addColorStop: () => undefined }
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop in target) return target[prop]
      if (prop === 'measureText') return (text: string) => ({ width: text.length * 6 })
      if (prop === 'createLinearGradient') return () => gradient
      return (...args: unknown[]) => {
        calls.push({ name: prop, args })
      }
    },
    set(target, prop: string, value) {
      sets.push({ prop, value })
      target[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, calls, sets, count: (name) => calls.filter((c) => c.name === name).length }
}

/** Canvas de 600 px de ancho con un contexto de registro. */
export function fakeCanvas(width = 600, height = 200): { canvas: HTMLCanvasElement; rec: RecordingCtx } {
  const rec = recordingCtx()
  const canvas = document.createElement('canvas')
  Object.defineProperty(canvas, 'offsetWidth', { value: width, configurable: true })
  canvas.height = height
  canvas.getContext = (() => rec.ctx) as unknown as HTMLCanvasElement['getContext']
  return { canvas, rec }
}
