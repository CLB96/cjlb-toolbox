import { useSyncExternalStore } from 'react'
import { en } from './en'
import { es, type MessageKey } from './es'

export type Lang = 'es' | 'en'
export type { MessageKey }
type Vars = Record<string, string | number>

const STORAGE_KEY = 'cjlb.lang'
const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { es, en }

const listeners = new Set<() => void>()
let lang: Lang | null = null

function isLang(v: unknown): v is Lang {
  return v === 'es' || v === 'en'
}

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (isLang(v)) return v
  } catch {
    // almacenamiento bloqueado: se usa el idioma por defecto
  }
  return 'es'
}

function getSnapshot(): Lang {
  if (lang === null) lang = readStored()
  document.documentElement.lang = lang
  return lang
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function setLang(next: Lang) {
  lang = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // sin persistencia: el idioma sigue aplicándose en esta sesión
  }
  document.documentElement.lang = next
  listeners.forEach((l) => l())
}

function translate(current: Lang, key: MessageKey, vars?: Vars): string {
  const template = DICTIONARIES[current][key]
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars && name in vars ? String(vars[name]) : match,
  )
}

export function useI18n(): {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: MessageKey, vars?: Vars) => string
} {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { lang: current, setLang, t: (key, vars) => translate(current, key, vars) }
}

/** Solo para tests: reinicia el estado del módulo. */
export function __resetI18nForTests() {
  lang = null
}
