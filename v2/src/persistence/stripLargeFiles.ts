export const MAX_FILE_BYTES = 20 * 1024 * 1024

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

function byteSize(v: unknown): number | null {
  if (typeof Blob !== 'undefined' && v instanceof Blob) return v.size
  if (v instanceof ArrayBuffer) return v.byteLength
  if (ArrayBuffer.isView(v)) return v.byteLength
  return null
}

/**
 * Copia inmutable de `value` sustituyendo por null todo Blob/File, ArrayBuffer o typed array
 * de más de 20 MB. Recorre objetos planos, arrays, Map y Set; los ciclos se conservan
 * (cada objeto original se copia una sola vez).
 */
export function stripLargeFiles<T>(value: T): { value: T; skipped: boolean } {
  let skipped = false
  const visited = new WeakMap<object, unknown>()

  const walk = (v: unknown): unknown => {
    const size = byteSize(v)
    if (size !== null) {
      if (size <= MAX_FILE_BYTES) return v
      skipped = true
      return null
    }
    if (typeof v !== 'object' || v === null) return v
    const seen = visited.get(v)
    if (seen !== undefined) return seen
    if (Array.isArray(v)) {
      const out: unknown[] = []
      visited.set(v, out)
      v.forEach((x) => out.push(walk(x)))
      return out
    }
    if (v instanceof Map) {
      const out = new Map<unknown, unknown>()
      visited.set(v, out)
      v.forEach((x, k) => out.set(walk(k), walk(x)))
      return out
    }
    if (v instanceof Set) {
      const out = new Set<unknown>()
      visited.set(v, out)
      v.forEach((x) => out.add(walk(x)))
      return out
    }
    if (isPlainObject(v)) {
      const out: Record<string, unknown> = Object.create(Object.getPrototypeOf(v))
      visited.set(v, out)
      for (const [k, x] of Object.entries(v)) out[k] = walk(x)
      return out
    }
    return v
  }

  return { value: walk(value) as T, skipped }
}
