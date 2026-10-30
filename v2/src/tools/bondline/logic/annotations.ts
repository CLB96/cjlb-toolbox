import type { AdhesiveCfg } from './activation'
import type { CoolingCheck } from './cooling'
import { visibleEventX, type ActiveEvent } from './events'
import type { EffectiveRange } from './range'
import { ACTIVATION_DURATION, type AdhesiveType } from './types'

/** Configuración de una anotación de chartjs-plugin-annotation (objeto plano, sin DOM). */
export type Annotation = Record<string, unknown>
export type Translate = (key: string, ...args: (number | string)[]) => string

export interface AnnotationInput {
  activationStart: number | null
  range: Pick<EffectiveRange, 'start' | 'rows'>
  cfg: AdhesiveCfg
  adhesive: AdhesiveType
  events: ActiveEvent[]
  cooling: CoolingCheck
  coolingTarget: number
  dark: boolean
  t: Translate
}

const LABEL_PADDING = { top: 4, bottom: 4, left: 8, right: 8 }

/** Anotaciones del gráfico: copia de renderChart del original (colores por tema y adhesivo). */
export function buildAnnotations(input: AnnotationInput): Record<string, Annotation> {
  const { activationStart, range, cfg, adhesive, events, cooling, coolingTarget, dark, t } = input
  const isHM = adhesive === 'hotmelt'
  const lc = isHM
    ? dark ? 'rgba(248,184,79,' : 'rgba(245,158,11,'
    : dark ? 'rgba(34,211,238,' : 'rgba(6,182,212,'
  const gc = dark ? 'rgba(89,201,127,' : 'rgba(67,179,107,'

  const limitLine = (value: number, content: string, yAdjust: number): Annotation => ({
    type: 'line',
    yMin: value,
    yMax: value,
    borderColor: lc + '0.8)',
    borderWidth: 2,
    borderDash: [8, 4],
    label: {
      display: true,
      content,
      position: 'start',
      backgroundColor: lc + '0.60)',
      color: lc + '1)',
      font: { size: 11, weight: '700' },
      padding: { ...LABEL_PADDING },
      borderRadius: 8,
      yAdjust,
    },
  })

  const annotations: Record<string, Annotation> = {
    minLine: limitLine(cfg.min, t('annotMin', cfg.min), 15),
    maxLine: limitLine(cfg.max, t('annotMax', cfg.max), -15),
  }

  if (activationStart !== null) {
    const adjStart = activationStart - range.start
    const adjEnd = activationStart + ACTIVATION_DURATION - range.start
    if (adjEnd >= 0 && adjStart < range.rows) {
      annotations.activationWindow = {
        type: 'box',
        xMin: Math.max(0, adjStart),
        xMax: Math.min(range.rows - 1, adjEnd),
        yMin: cfg.min,
        yMax: cfg.max,
        backgroundColor: gc + '0.08)',
        borderColor: gc + '0.45)',
        borderWidth: 2,
        borderDash: [6, 3],
        label: {
          display: true,
          content: t('annotWindow', ACTIVATION_DURATION),
          position: { x: 'center', y: 'start' },
          color: dark ? '#9ae5b1' : '#217543',
          font: { size: 11, weight: '800' },
          padding: { ...LABEL_PADDING },
          backgroundColor: gc + '0.14)',
          borderRadius: 8,
        },
      }
    }
  }

  events.forEach((evt, idx) => {
    const x = visibleEventX(evt, range)
    if (x === null) return
    annotations[`event_${idx}`] = {
      type: 'line',
      xMin: x,
      xMax: x,
      borderColor: evt.color,
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        display: true,
        content: evt.label,
        position: 'start',
        backgroundColor: evt.color + '33',
        color: evt.color,
        font: { size: 10, weight: '700' },
        padding: { top: 3, bottom: 3, left: 6, right: 6 },
        borderRadius: 6,
        rotation: 270,
        yAdjust: -8,
      },
    }
  })

  if (cooling.show) {
    const adjustedStart = cooling.coolingStart - range.start
    if (adjustedStart < range.rows) {
      const purple = dark ? 'rgba(167,139,250,' : 'rgba(139,92,246,'
      annotations.coolingTargetLine = {
        type: 'line',
        xMin: Math.max(0, adjustedStart),
        xMax: range.rows - 1,
        yMin: coolingTarget,
        yMax: coolingTarget,
        borderColor: purple + '0.9)',
        borderWidth: 3,
        borderDash: [10, 5],
        label: {
          display: true,
          content: `🎯 ${coolingTarget}°C`,
          position: 'end',
          backgroundColor: purple + '0.18)',
          color: purple + '1)',
          font: { size: 11, weight: '800' },
          padding: { ...LABEL_PADDING },
          borderRadius: 8,
          yAdjust: -15,
        },
      }
    }
  }

  return annotations
}
