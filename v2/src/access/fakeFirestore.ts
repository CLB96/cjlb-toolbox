// Firestore falso en memoria para tests (solo lo que usa accessService).
export const store = new Map<string, Record<string, unknown>>()

type Ref = { path: string; id: string }
type Q = { col: string; field: string; value: unknown }

export function resetStore(): void {
  store.clear()
}

function matching(q: Q) {
  return [...store.entries()]
    .filter(([p, d]) => p.startsWith(`${q.col}/`) && d[q.field] === q.value)
    .map(([, d]) => ({ data: () => d }))
}

export const fake = {
  doc: (_db: unknown, col: string, id: string): Ref => ({ path: `${col}/${id}`, id }),
  collection: (_db: unknown, col: string) => ({ col }),
  where: (field: string, _op: string, value: unknown) => ({ field, value }),
  query: (c: { col: string }, w: { field: string; value: unknown }): Q => ({ ...c, ...w }),
  serverTimestamp: () => ({ toMillis: () => 1700000000000 }),
  setDoc: async (ref: Ref, data: Record<string, unknown>) => {
    if (store.has(ref.path)) throw Object.assign(new Error('denied'), { code: 'permission-denied' })
    store.set(ref.path, data)
  },
  getDoc: async (ref: Ref) => ({
    exists: () => store.has(ref.path),
    data: () => store.get(ref.path),
  }),
  getDocs: async (q: Q) => ({ docs: matching(q) }),
  onSnapshot: (q: Q, next: (s: { size: number }) => void) => {
    next({ size: matching(q).length })
    return () => {}
  },
  writeBatch: () => {
    const ops: Array<() => void> = []
    return {
      set: (ref: Ref, data: Record<string, unknown>) => void ops.push(() => void store.set(ref.path, data)),
      update: (ref: Ref, data: Record<string, unknown>) =>
        void ops.push(() => void store.set(ref.path, { ...store.get(ref.path), ...data })),
      commit: async () => ops.forEach((o) => o()),
    }
  },
}
