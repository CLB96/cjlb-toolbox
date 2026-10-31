// Entorno común de las exportaciones de CapaFlow. Las salidas conservan el aspecto ORIGINAL (paleta propia, sin Nebulosa).
import { translate, type CapaKey } from '../i18n'
import type { Lang } from '../logic'
import type { CapaPoint, PhotoMarker } from '../store'

export interface ExportEnv {
  lang: Lang
  isDark: boolean
  t: (key: CapaKey) => string
}

export function makeExportEnv(lang: Lang, isDark: boolean): ExportEnv {
  return { lang, isDark, t: (key) => translate(lang, key) }
}

/** Todo lo que necesitan el resumen comparativo, el ZIP y el plano: el proyecto tal como está en el store. */
export interface ProjectExportData {
  points: CapaPoint[]
  markers: Record<number, PhotoMarker>
  photo: Blob | null
  projectName: string
}

/** Paleta del original (`_drawPNG`, `generateComparativeSummary`): idéntica en ambas salidas. */
export interface ExportPalette {
  bg: string
  surface: string
  surface2: string
  border: string
  borderLight: string
  text: string
  textSub: string
  textDim: string
  accent: string
  accent2: string
  green: string
  greenBg: string
  greenBorder: string
  yellow: string
  yellowBg: string
  yellowBorder: string
  red: string
  redBg: string
  redBorder: string
  barA: string
  barB: string
  curve: string
  specLine: string
  meanLine: string
  targetLine: string
  grid: string
  rowAlt: string
  headerBg: string
}

const DARK: ExportPalette = {
  bg: '#050d2a', surface: '#0c1a3e', surface2: '#0f2050',
  border: 'rgba(255,255,255,0.11)', borderLight: 'rgba(255,255,255,0.06)',
  text: '#eef2ff', textSub: 'rgba(230,235,255,0.65)', textDim: 'rgba(200,210,255,0.35)',
  accent: '#00E5FF', accent2: '#4FC3F7',
  green: '#4ade80', greenBg: 'rgba(74,222,128,0.1)', greenBorder: 'rgba(74,222,128,0.3)',
  yellow: '#fbbf24', yellowBg: 'rgba(251,191,36,0.1)', yellowBorder: 'rgba(251,191,36,0.3)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.3)',
  barA: 'rgba(79,195,247,0.8)', barB: 'rgba(0,229,255,0.15)',
  curve: '#4ade80', specLine: '#f87171', meanLine: 'rgba(79,195,247,0.75)', targetLine: '#fbbf24',
  grid: 'rgba(255,255,255,0.04)', rowAlt: 'rgba(255,255,255,0.025)',
  headerBg: 'rgba(0,229,255,0.07)',
}

const LIGHT: ExportPalette = {
  bg: '#f0f3f8', surface: '#ffffff', surface2: '#f7f9fc',
  border: 'rgba(30,60,120,0.13)', borderLight: 'rgba(30,60,120,0.07)',
  text: '#1a2340', textSub: '#4a5580', textDim: '#9aa5c0',
  accent: '#0067bb', accent2: '#2196F3',
  green: '#16a34a', greenBg: 'rgba(22,163,74,0.08)', greenBorder: 'rgba(22,163,74,0.3)',
  yellow: '#b45309', yellowBg: 'rgba(180,83,9,0.08)', yellowBorder: 'rgba(180,83,9,0.3)',
  red: '#dc2626', redBg: 'rgba(220,38,38,0.08)', redBorder: 'rgba(220,38,38,0.3)',
  barA: 'rgba(33,150,243,0.75)', barB: 'rgba(100,160,240,0.1)',
  curve: '#16a34a', specLine: '#dc2626', meanLine: 'rgba(33,150,243,0.7)', targetLine: '#b45309',
  grid: 'rgba(30,60,120,0.05)', rowAlt: 'rgba(30,60,120,0.03)',
  headerBg: 'rgba(0,103,187,0.06)',
}

export const exportPalette = (isDark: boolean): ExportPalette => (isDark ? DARK : LIGHT)

/** `fmt` del original: toFixed o raya. */
export const fmt = (v: number | null | undefined, d = 3): string =>
  v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(d) : '—'

export const cpkColorOf = (P: ExportPalette, v: number | null): string =>
  v === null ? P.accent : v >= 1.33 ? P.green : v >= 1.0 ? P.yellow : P.red

/** Fecha del nombre de archivo: UTC, como el original. */
export const stamp = (): string => new Date().toISOString().slice(0, 10)

export const localDate = (lang: Lang): string =>
  new Date().toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })

export function newCanvas(width: number, height: number): { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } {
  const cv = document.createElement('canvas')
  cv.width = width
  cv.height = height
  const c = cv.getContext('2d')
  if (!c) throw new Error('Canvas 2D no disponible')
  return { cv, c }
}

/** Receta anti-regresión: las fuentes del sistema deben estar listas antes de medir y dibujar texto. */
export async function fontsReady(): Promise<void> {
  try {
    await document.fonts?.ready
  } catch {
    /* sin API de fuentes: se sigue igual */
  }
}

/** Descarga con un <a> temporal, igual que el original. */
export function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = href
  link.click()
}

export function loadImage(blob: Blob | null): Promise<HTMLImageElement | null> {
  if (!blob) return Promise.resolve(null)
  const url = URL.createObjectURL(blob)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

export const dataUrlToBase64 = (url: string): string => url.replace(/^data:image\/png;base64,/, '')
