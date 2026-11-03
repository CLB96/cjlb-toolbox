/** Textos de los problemas del lector y de los avisos de diseño. */
import type { Lang } from '../../i18n/useI18n'
import type { AvisoDiseno } from './logic/estudioForm'
import type { CampoColumna, Issue, IssueClave } from './logic/issues'

type Mensajes = Record<IssueClave, string>

const es: Mensajes = {
  sinDatos: 'La hoja está vacía.',
  sinEncabezado: 'No encontré los encabezados Pieza, Operador, Ensayo y Valor. Descarga la plantilla y pega tus datos ahí.',
  columnas: 'Faltan columnas obligatorias: {faltan}. La hoja debe tener Pieza, Operador, Ensayo y Valor.',
  columnasExtra: 'Hay datos fuera de las cuatro columnas ({extras} celdas); se ignoran.',
  sinValores: 'Ninguna de las {vacios} filas preparadas tiene valor todavía.',
  piezaVacia: 'Falta la pieza.',
  operadorVacio: 'Falta el operador.',
  ensayoInvalido: 'Ensayo "{ensayo}" no válido: debe ser un entero de 1 a {max}.',
  valorVacio: 'Falta el valor de la pieza {pieza}, {operador}, ensayo {ensayo}.',
  valorVacioResto: '… y {resto} lecturas más sin valor.',
  valorNoNumerico: '"{valor}" no es un número. Quita unidades y símbolos.',
  celdaNoNumerica: '"{valor}" no es un número.',
  duplicado: 'Lectura repetida: {pieza} / {operador} / ensayo {ensayo} ya está en la fila {previa}.',
  maximoLecturas: 'Máximo {max} lecturas por estudio.',
  maximoPiezas: 'Máximo {max} piezas por estudio.',
  maximoOperadores: 'Máximo {max} operadores por estudio.',
  pocasLecturas: 'Solo hay {lecturas} lecturas; se necesitan al menos 10.',
  minimoPiezas: 'Se necesitan al menos 2 piezas distintas.',
  piezasRecomendadas: 'Con {piezas} piezas el ndc sale muy bajo; lo recomendable son 10.',
  minimoOperadores: 'Se necesitan al menos 2 operadores para medir reproducibilidad.',
  minimoEnsayos: 'Se necesitan al menos 2 ensayos por operador y pieza.',
  ensayosIncompletosUno: 'Los ensayos deben ir de 1 a {ultimo}; falta {huecos}.',
  ensayosIncompletosVarios: 'Los ensayos deben ir de 1 a {ultimo}; faltan {huecos}.',
  desbalanceadoUno: 'Falta {faltantes} lectura ({huecos}).',
  desbalanceado: 'Faltan {faltantes} lecturas ({huecos}).',
  anchoSinConfirmar: 'Detecté una hoja AIAG con {operadores} operadores y {ensayos} ensayos. Confirma para convertirla.',
}

const en: Mensajes = {
  sinDatos: 'The sheet is empty.',
  sinEncabezado: 'Could not find the Part, Operator, Trial and Value headers. Download the template and paste your data there.',
  columnas: 'Required columns are missing: {faltan}. The sheet must have Part, Operator, Trial and Value.',
  columnasExtra: 'There is data outside the four columns ({extras} cells); it is ignored.',
  sinValores: 'None of the {vacios} prepared rows has a value yet.',
  piezaVacia: 'The part is missing.',
  operadorVacio: 'The operator is missing.',
  ensayoInvalido: 'Trial "{ensayo}" is not valid: it must be a whole number from 1 to {max}.',
  valorVacio: 'The value is missing for part {pieza}, {operador}, trial {ensayo}.',
  valorVacioResto: '… and {resto} more readings without a value.',
  valorNoNumerico: '"{valor}" is not a number. Remove units and symbols.',
  celdaNoNumerica: '"{valor}" is not a number.',
  duplicado: 'Repeated reading: {pieza} / {operador} / trial {ensayo} is already in row {previa}.',
  maximoLecturas: 'Maximum {max} readings per study.',
  maximoPiezas: 'Maximum {max} parts per study.',
  maximoOperadores: 'Maximum {max} operators per study.',
  pocasLecturas: 'There are only {lecturas} readings; at least 10 are needed.',
  minimoPiezas: 'At least 2 different parts are needed.',
  piezasRecomendadas: 'With {piezas} parts the ndc comes out very low; 10 are recommended.',
  minimoOperadores: 'At least 2 operators are needed to measure reproducibility.',
  minimoEnsayos: 'At least 2 trials per operator and part are needed.',
  ensayosIncompletosUno: 'Trials must run from 1 to {ultimo}; {huecos} is missing.',
  ensayosIncompletosVarios: 'Trials must run from 1 to {ultimo}; {huecos} are missing.',
  desbalanceadoUno: '{faltantes} reading is missing ({huecos}).',
  desbalanceado: '{faltantes} readings are missing ({huecos}).',
  anchoSinConfirmar: 'An AIAG sheet with {operadores} operators and {ensayos} trials was detected. Confirm to convert it.',
}

export const MENSAJES_ISSUE: Record<Lang, Mensajes> = { es, en }

const CAMPOS: Record<Lang, Record<CampoColumna, string>> = {
  es: { pieza: 'pieza', operador: 'operador', ensayo: 'ensayo', valor: 'valor' },
  en: { pieza: 'part', operador: 'operator', ensayo: 'trial', valor: 'value' },
}

const AVISOS: Record<Lang, Record<AvisoDiseno['campo'], string>> = {
  es: {
    piezas: 'El archivo tiene {archivo} piezas y el formulario {formulario}.',
    operadores: 'El archivo tiene {archivo} operadores y el formulario {formulario}.',
    ensayos: 'El archivo tiene {archivo} ensayos y el formulario {formulario}.',
  },
  en: {
    piezas: 'The file has {archivo} parts and the form {formulario}.',
    operadores: 'The file has {archivo} operators and the form {formulario}.',
    ensayos: 'The file has {archivo} trials and the form {formulario}.',
  },
}

const ETIQUETAS: Record<Lang, { fila: string; unaFila: string; filas: string }> = {
  es: { fila: 'fila {n}: ', unaFila: '1 fila', filas: '{n} filas' },
  en: { fila: 'row {n}: ', unaFila: '1 row', filas: '{n} rows' },
}

/** Hasta cinco huecos a la vista; si hay más, se indica con puntos suspensivos. */
const MAX_HUECOS = 5

function rellenar(plantilla: string, vars: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (m, nombre: string) => (nombre in vars ? String(vars[nombre]) : m))
}

function textoHuecos(issue: Issue, lang: Lang): string {
  const huecos = issue.huecos ?? []
  const nombre = CAMPOS[lang].ensayo
  const lista = huecos.slice(0, MAX_HUECOS).map((h) => `${h.pieza} / ${h.operador} / ${nombre} ${h.ensayo}`)
  return `${lista.join('; ')}${huecos.length > MAX_HUECOS ? '…' : ''}`
}

export function issueTexto(issue: Issue, lang: Lang): string {
  const vars: Record<string, string | number> = { ...issue.vars }
  if (issue.faltan) vars.faltan = issue.faltan.map((c) => CAMPOS[lang][c]).join(', ')
  if (issue.huecos) vars.huecos = textoHuecos(issue, lang)
  return rellenar(MENSAJES_ISSUE[lang][issue.clave], vars)
}

export function avisoTexto(aviso: AvisoDiseno, lang: Lang): string {
  return rellenar(AVISOS[lang][aviso.campo], { archivo: aviso.archivo, formulario: aviso.formulario })
}

export function prefijoFila(fila: number, lang: Lang): string {
  return rellenar(ETIQUETAS[lang].fila, { n: fila })
}

export function totalFilas(total: number, lang: Lang): string {
  return total === 1 ? ETIQUETAS[lang].unaFila : rellenar(ETIQUETAS[lang].filas, { n: total })
}
