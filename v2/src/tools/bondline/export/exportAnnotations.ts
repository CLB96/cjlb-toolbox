import type { Annotation } from '../logic/annotations'
import { visibleEventX } from '../logic/events'
import { ACTIVATION_DURATION, type AdhesiveType } from '../logic/types'
import type { BondlineView } from '../useBondlineView'

export interface ExportAnnotationInput {
  view: BondlineView
  adhesive: AdhesiveType
  coolingTarget: number
  t: (key: 'annotMin' | 'annotMax' | 'annotWindow', value: number) => string
}

const pad = (v: number, h: number) => ({ top: v, bottom: v, left: h, right: h })

/**
 * Anotaciones del PNG (downloadChart, inventario 7.6): tema oscuro fijo, trazos y fuentes
 * mayores que los de pantalla. La línea de cooling se ajusta al rango como en pantalla (mejora A5).
 */
export function buildExportAnnotations(input: ExportAnnotationInput): Record<string, Annotation> {
  const { view, adhesive, coolingTarget, t } = input
  const { cfg, range } = view
  const lc = adhesive === 'hotmelt' ? 'rgba(248,184,79,' : 'rgba(34,211,238,'
  const gc = 'rgba(89,201,127,'

  const limit = (value: number, content: string, yAdjust: number): Annotation => ({
    type: 'line',
    yMin: value,
    yMax: value,
    borderColor: lc + '0.9)',
    borderWidth: 3,
    borderDash: [10, 5],
    label: {
      display: true,
      content,
      position: 'start',
      backgroundColor: lc + '0.60)',
      color: lc + '1)',
      font: { size: 14, weight: '700' },
      padding: pad(6, 10),
      borderRadius: 8,
      yAdjust,
    },
  })

  const out: Record<string, Annotation> = {
    minLine: limit(cfg.min, t('annotMin', cfg.min), 20),
    maxLine: limit(cfg.max, t('annotMax', cfg.max), -20),
  }

  if (view.activationStart !== null) {
    const adjStart = view.activationStart - range.start
    const adjEnd = view.activationStart + ACTIVATION_DURATION - range.start
    if (adjEnd >= 0 && adjStart < range.rows) {
      out.activationWindow = {
        type: 'box',
        xMin: Math.max(0, adjStart),
        xMax: Math.min(range.rows - 1, adjEnd),
        yMin: cfg.min,
        yMax: cfg.max,
        backgroundColor: gc + '0.12)',
        borderColor: gc + '0.6)',
        borderWidth: 3,
        borderDash: [8, 4],
        label: {
          display: true,
          content: t('annotWindow', ACTIVATION_DURATION),
          position: { x: 'center', y: 'start' },
          color: '#9ae5b1',
          font: { size: 14, weight: '800' },
          padding: pad(5, 10),
          backgroundColor: gc + '0.18)',
          borderRadius: 8,
        },
      }
    }
  }

  view.events.forEach((evt, idx) => {
    const x = visibleEventX(evt, range)
    if (x === null) return
    out[`event_${idx}`] = {
      type: 'line',
      xMin: x,
      xMax: x,
      borderColor: evt.color,
      borderWidth: 3,
      borderDash: [6, 6],
      label: {
        display: true,
        content: evt.label,
        position: 'start',
        backgroundColor: evt.color + '44',
        color: evt.color,
        font: { size: 11, weight: '700' },
        padding: pad(4, 7),
        borderRadius: 7,
        rotation: 270,
        yAdjust: -10,
      },
    }
  })

  const coolingX = view.cooling.coolingStart - range.start
  if (view.cooling.show && coolingX < range.rows) {
    const purple = 'rgba(167,139,250,'
    out.coolingTargetLine = {
      type: 'line',
      xMin: Math.max(0, coolingX),
      xMax: range.rows - 1,
      yMin: coolingTarget,
      yMax: coolingTarget,
      borderColor: purple + '0.95)',
      borderWidth: 4,
      borderDash: [12, 6],
      label: {
        display: true,
        content: `🎯 ${coolingTarget}°C`,
        position: 'end',
        backgroundColor: purple + '0.22)',
        color: purple + '1)',
        font: { size: 12, weight: '800' },
        padding: pad(5, 9),
        borderRadius: 8,
        yAdjust: -18,
      },
    }
  }
  return out
}
