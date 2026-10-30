import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
type Snapshot = { mode: ThemeMode; resolved: ResolvedTheme }

const STORAGE_KEY = 'cjlb.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const listeners = new Set<() => void>()
let mode: ThemeMode | null = null
let snapshot: Snapshot | null = null
let systemBound = false

function isMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system'
}

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (isMode(v)) return v
  } catch {
    // almacenamiento bloqueado: se usa el valor por defecto (sistema)
  }
  return 'system'
}

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

function resolve(m: ThemeMode): ResolvedTheme {
  if (m === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return m
}

function currentMode(): ThemeMode {
  if (mode === null) mode = readStored()
  return mode
}

function emit() {
  snapshot = null
  document.documentElement.dataset.theme = getSnapshot().resolved
  listeners.forEach((l) => l())
}

function bindSystem() {
  if (systemBound || typeof window.matchMedia !== 'function') return
  systemBound = true
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (currentMode() === 'system') emit()
  })
}

function getSnapshot(): Snapshot {
  const m = currentMode()
  const resolved = resolve(m)
  if (!snapshot || snapshot.mode !== m || snapshot.resolved !== resolved) {
    snapshot = { mode: m, resolved }
  }
  document.documentElement.dataset.theme = snapshot.resolved
  return snapshot
}

function subscribe(cb: () => void) {
  bindSystem()
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function setMode(next: ThemeMode) {
  mode = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // sin persistencia: el tema sigue aplicándose en esta sesión
  }
  emit()
}

export function useTheme(): Snapshot & { setMode: (m: ThemeMode) => void } {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { ...snap, setMode }
}

/** Solo para tests: reinicia el estado del módulo. */
export function __resetThemeForTests() {
  mode = null
  snapshot = null
}
