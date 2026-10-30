import { FACTORY_DEFAULTS, type BondlineDefaults, type TempRange } from './types'

export interface DefaultsForm {
  wbMin: string
  wbMax: string
  hmMin: string
  hmMax: string
  cooling: string
}

/** Igual que saveDefaults del original: parseFloat(x) || valor de fábrica (sin chequeo min<max). */
export function parseDefaultsForm(form: DefaultsForm): BondlineDefaults {
  const f = FACTORY_DEFAULTS
  return {
    waterbase: { min: parseFloat(form.wbMin) || f.waterbase.min, max: parseFloat(form.wbMax) || f.waterbase.max },
    hotmelt: { min: parseFloat(form.hmMin) || f.hotmelt.min, max: parseFloat(form.hmMax) || f.hotmelt.max },
    coolingTarget: parseFloat(form.cooling) || f.coolingTarget,
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isRange(v: unknown): v is TempRange {
  return isRecord(v) && Number.isFinite(v.min) && Number.isFinite(v.max)
}

/** Preferencia ilegible o con forma incompleta -> valores de fábrica (R1). */
export function normalizeDefaults(raw: unknown): BondlineDefaults {
  if (isRecord(raw) && isRange(raw.waterbase) && isRange(raw.hotmelt) && Number.isFinite(raw.coolingTarget)) {
    return {
      waterbase: { min: raw.waterbase.min, max: raw.waterbase.max },
      hotmelt: { min: raw.hotmelt.min, max: raw.hotmelt.max },
      coolingTarget: raw.coolingTarget as number,
    }
  }
  return {
    waterbase: { ...FACTORY_DEFAULTS.waterbase },
    hotmelt: { ...FACTORY_DEFAULTS.hotmelt },
    coolingTarget: FACTORY_DEFAULTS.coolingTarget,
  }
}
