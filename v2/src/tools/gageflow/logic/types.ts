/** Tipos del estudio Gage R&R. */

export interface Limites {
  lsl?: number
  usl?: number
  nominal?: number
}

export type Veredicto = 'aceptable' | 'condicional' | 'noAceptable'

export type CodigoError =
  | 'desbalanceado' | 'pocosDatos' | 'pocosOperadores' | 'pocosEnsayos'
  | 'sinVariacion' | 'valorFaltante' | 'sinLimites'

export type Recomendacion =
  | 'repetibilidad' | 'reproducibilidad' | 'interaccion'
  | 'pocasPiezas' | 'pocosEnsayos' | 'sinLimites'

export interface FilaAnova {
  fuente: 'pieza' | 'operador' | 'interaccion' | 'error'
  gl: number
  ss: number
  ms: number
  f: number | null
  p: number | null
}

export interface Componente {
  /** Varianza del componente (mm²). */
  varianza: number
  sd: number
  /** 6 sigma. */
  seis: number
  /** Porcentaje del ancho de tolerancia (null si no hay límites). */
  pctTolerancia: number | null
  /** Porcentaje de la varianza total. */
  pctContribucion: number
}

export interface Componentes {
  ev: Componente
  av: Componente
  interaccion: Componente
  grr: Componente
  parte: Componente
  total: { sd: number; seis: number }
}

export interface XbarR {
  ev: number
  av: number
  grr: number
  pctTolerancia: number | null
}

export interface EstudioResultado {
  ok: boolean
  errores: CodigoError[]
  piezas: number
  operadores: number
  ensayos: number
  anchoTolerancia: number | null
  anova: FilaAnova[]
  componentes: Componentes
  pctGrrTolerancia: number | null
  pctGrrVariacion: number
  ndc: number
  veredicto: Veredicto
  recomendaciones: Recomendacion[]
  xbarR: XbarR | null
}
