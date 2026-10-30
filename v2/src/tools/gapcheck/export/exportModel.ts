import type { Lang } from '../../../i18n/useI18n'
import { PALETTE_SOLID } from '../logic/chartStyle'
import type { KpiTexts } from '../logic/types'
import { STATIC_TEXTS } from '../i18n'
import { selectKpis, type GapcheckState } from '../store'

export type ExportBadge = 'PTS' | 'OK' | 'AVG' | 'MIN' | 'MAX'

export interface ExportCard {
  badge: ExportBadge
  value: string
  sub: string
}

export interface ExportMarker {
  pointIndex: number
  /** % relativo a la imagen (R4). */
  x: number
  y: number
  color: string
  label: string
}

export interface ExportModel {
  title: string
  dateLine: string
  /** Orden del export original: fila 1 PTS, OK, [objetivo]; fila 2 AVG, MIN, MAX. */
  cards: ExportCard[]
  target: { label: string; value: string }
  hasLayout: boolean
  markers: ExportMarker[]
  markerSize: number
  fileName: string
}

/** Textos literales de exportToPNG (gapcheck/index.html 1839-2079, inventario §9). */
const EXPORT_TEXTS = {
  es: {
    title: 'Gapcheck Análisis',
    target: 'GAPCHECK OBJETIVO',
    PTS: 'Puntos Medidos',
    OK: 'Cumplen Objetivo',
    AVG: 'Promedio Global',
    MIN: 'Valor más bajo',
    MAX: 'Valor más alto',
  },
  en: {
    title: 'Gapcheck Analysis',
    target: 'GAPCHECK TARGET',
    PTS: 'Measured Pts',
    OK: 'Meeting Target',
    AVG: 'Global Average',
    MIN: 'Lowest Value',
    MAX: 'Highest Value',
  },
} as const

const CARD_FIELDS: readonly (readonly [ExportBadge, keyof KpiTexts])[] = [
  ['PTS', 'totalRecords'],
  ['OK', 'meeting'],
  ['AVG', 'avg'],
  ['MIN', 'min'],
  ['MAX', 'max'],
]

/** Nombre de archivo original: fecha UTC de toISOString. */
export function exportFileName(now: Date): string {
  return `Gapcheck-Export-${now.toISOString().split('T')[0]}.png`
}

function visibleMarkers(state: GapcheckState): ExportMarker[] {
  if (!state.layout.image) return []
  const visible = new Set(state.visiblePoints)
  return state.layout.markers
    .filter((m) => visible.has(m.pointIndex) && state.points[m.pointIndex] !== undefined)
    .map((m) => ({
      pointIndex: m.pointIndex,
      x: m.x,
      y: m.y,
      color: PALETTE_SOLID[m.pointIndex % PALETTE_SOLID.length],
      label: state.points[m.pointIndex].name,
    }))
}

/**
 * Contenido del PNG (puro). null si no hay datos (el original avisa "No hay datos para exportar.").
 * Objetivo y covering: los aplicados con "Actualizar Comparación", igual que tarjetas y gráfica.
 */
export function buildExportModel(state: GapcheckState, lang: Lang, now: Date): ExportModel | null {
  if (state.points.length === 0) return null
  const texts = EXPORT_TEXTS[lang]
  const kpis = selectKpis(state)
  const covering = state.appliedCovering === 'hard' ? STATIC_TEXTS.hard : STATIC_TEXTS.soft
  return {
    title: texts.title,
    dateLine: now.toLocaleString() + `   •   Covering: ${covering}`,
    cards: CARD_FIELDS.map(([badge, field]) => ({ badge, value: kpis[field], sub: texts[badge] })),
    target: { label: texts.target, value: state.appliedTarget.toFixed(2) + ' mm' },
    hasLayout: state.layout.image !== null,
    markers: visibleMarkers(state),
    markerSize: state.layout.markerSize,
    fileName: exportFileName(now),
  }
}
