/** Problemas que encuentra el lector. Son datos: el texto se redacta en `i18nIssues.ts`. */
import type { FilaDiseno } from './disenoLecturas'

export type IssueCode =
  | 'SIN_DATOS' | 'SIN_ENCABEZADO' | 'COLUMNAS' | 'COLUMNAS_EXTRA' | 'SIN_VALORES'
  | 'PIEZA_VACIA' | 'OPERADOR_VACIO' | 'ENSAYO_INVALIDO' | 'ENSAYOS_INCOMPLETOS'
  | 'VALOR_VACIO' | 'VALOR_NO_NUMERICO' | 'DUPLICADO'
  | 'DESBALANCEADO' | 'POCAS_PIEZAS' | 'POCOS_OPERADORES' | 'POCOS_ENSAYOS'
  | 'MAXIMO' | 'ANCHO_SIN_CONFIRMAR'

export type Severidad = 'error' | 'aviso'

export type IssueClave =
  | 'sinDatos' | 'sinEncabezado' | 'columnas' | 'columnasExtra' | 'sinValores'
  | 'piezaVacia' | 'operadorVacio' | 'ensayoInvalido'
  | 'valorVacio' | 'valorVacioResto' | 'valorNoNumerico' | 'celdaNoNumerica' | 'duplicado'
  | 'maximoLecturas' | 'maximoPiezas' | 'maximoOperadores'
  | 'pocasLecturas' | 'minimoPiezas' | 'piezasRecomendadas' | 'minimoOperadores' | 'minimoEnsayos'
  | 'ensayosIncompletosUno' | 'ensayosIncompletosVarios' | 'desbalanceado' | 'anchoSinConfirmar'

export type CampoColumna = 'pieza' | 'operador' | 'ensayo' | 'valor'

export interface Issue {
  fila: number | null
  codigo: IssueCode
  severidad: Severidad
  clave: IssueClave
  vars?: Record<string, string | number>
  /** Columnas obligatorias que no están en la hoja. */
  faltan?: CampoColumna[]
  /** Primeras lecturas que faltan para completar el diseño. */
  huecos?: FilaDiseno[]
}

export interface Resumen {
  piezas: number
  operadores: string[]
  ensayos: number
  lecturas: number
  faltantes: number
}
