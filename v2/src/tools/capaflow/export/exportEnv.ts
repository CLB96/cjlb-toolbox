// Entorno común de las exportaciones de CapaFlow. Las salidas usan el diseño Nebulosa del toolbox (petición del dueño, 2026-10-30);
// el contenido (datos, textos, secciones) es el del original, solo cambia el aspecto.
import { translate, type CapaKey } from '../i18n'
import type { Lang } from '../logic'
import type { CapaPoint, PhotoMarker } from '../store'
import { NEBULA_FONT_SPECS } from './nebulaKit'

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

/** Paleta Nebulosa (oscura/clara) compartida por el resumen ejecutivo, el resumen comparativo y el plano. */
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
  bg: '#160c2e', surface: 'rgba(255,255,255,0.07)', surface2: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.16)', borderLight: 'rgba(255,255,255,0.09)',
  text: '#efe9ff', textSub: '#b3a6d9', textDim: '#9a8fc0',
  accent: '#e2b4ff', accent2: '#72a8ff',
  green: '#59c97f', greenBg: 'rgba(89,201,127,0.14)', greenBorder: 'rgba(89,201,127,0.40)',
  yellow: '#f8b84f', yellowBg: 'rgba(248,184,79,0.14)', yellowBorder: 'rgba(248,184,79,0.40)',
  red: '#ff7683', redBg: 'rgba(255,118,131,0.14)', redBorder: 'rgba(255,118,131,0.40)',
  barA: 'rgba(114,168,255,0.85)', barB: 'rgba(209,107,255,0.18)',
  curve: '#59c97f', specLine: '#ff7683', meanLine: 'rgba(114,168,255,0.85)', targetLine: '#f8b84f',
  grid: 'rgba(255,255,255,0.06)', rowAlt: 'rgba(255,255,255,0.035)',
  headerBg: 'rgba(209,107,255,0.12)',
}

const LIGHT: ExportPalette = {
  bg: '#fbf7ff', surface: 'rgba(255,255,255,0.78)', surface2: '#f3ecff',
  border: 'rgba(37,26,64,0.14)', borderLight: 'rgba(37,26,64,0.08)',
  text: '#251a40', textSub: '#6d6290', textDim: '#8a7fae',
  accent: '#8b3fd9', accent2: '#4f8cff',
  green: '#2f9e57', greenBg: 'rgba(47,158,87,0.10)', greenBorder: 'rgba(47,158,87,0.35)',
  yellow: '#b07000', yellowBg: 'rgba(176,112,0,0.10)', yellowBorder: 'rgba(176,112,0,0.35)',
  red: '#d93a4c', redBg: 'rgba(217,58,76,0.09)', redBorder: 'rgba(217,58,76,0.35)',
  barA: 'rgba(79,140,255,0.8)', barB: 'rgba(139,63,217,0.12)',
  curve: '#2f9e57', specLine: '#d93a4c', meanLine: 'rgba(79,140,255,0.8)', targetLine: '#b07000',
  grid: 'rgba(37,26,64,0.06)', rowAlt: 'rgba(37,26,64,0.035)',
  headerBg: 'rgba(139,63,217,0.08)',
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

/** Receta anti-regresión: Space Grotesk/Inter deben estar listas antes de medir y dibujar texto. */
export async function fontsReady(): Promise<void> {
  try {
    if (document.fonts?.load) await Promise.all(NEBULA_FONT_SPECS.map((f) => document.fonts.load(f).catch(() => [])))
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
