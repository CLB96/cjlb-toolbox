/**
 * Contrato de entrada del estudio Gage R&R.
 *
 * Trabaja sobre una rejilla (filas x columnas) ya extraída del Excel, sin
 * dependencias: así se puede probar y reutilizar desde la app o desde un CLI.
 *
 * Reglas de lectura:
 * - Las columnas se localizan por su encabezado, no por su posición.
 * - Las filas pueden venir en cualquier orden: el diseño se deduce de los
 *   valores de pieza, operador y ensayo, no del orden en que aparecen.
 * - Las etiquetas se comparan sin distinguir mayúsculas ni espacios sobrantes.
 *
 * Formatos aceptados:
 * - 'long': canónico. Encabezados Pieza | Operador | Ensayo | Valor.
 * - 'wide': hoja clásica AIAG (bloques Operador x Ensayo). Se detecta, pero
 *   exige confirmación explícita antes de convertirla.
 */

import { aNumero, claveEtiqueta, compararNatural, filaVacia, normalizar, type Cell, type Grid } from './celdas'
import { construirDiseno, disenoVacio, type Diseno, type FilaDiseno, type Reading } from './disenoLecturas'
import type { CampoColumna, Issue, Resumen } from './issues'
import { validarDiseno } from './parseValidar'

export { aNumero, claveEtiqueta, compararNatural, normalizar, type Cell, type Grid } from './celdas'
export { aMatriz, construirDiseno, type Diseno, type Reading } from './disenoLecturas'
export type { Issue, IssueCode, Resumen, Severidad } from './issues'

export interface ParseOptions {
  /** El usuario ya confirmó que la hoja AIAG detectada es correcta. */
  confirmarAncho?: boolean
  maxLecturas?: number
}

export interface ParseResult {
  ok: boolean
  layout: 'long' | 'wide' | 'desconocido'
  lecturas: Reading[]
  issues: Issue[]
  resumen: Resumen
  /** Filas con datos, sin contar encabezados. */
  filas: number
  /** Diseño resuelto y ordenado, aunque todavía no haya valores. */
  diseno: Diseno
  /** Solo en 'wide': lo que se convertiría, para el diálogo de confirmación. */
  ancho?: { operadores: string[]; ensayos: number }
}

/** Cuántos errores iguales se listan antes de resumirlos. */
const MAX_MENSAJES_VALOR = 10
const MAX_ENSAYOS = 10

const ALIAS = {
  pieza: ['pieza', 'piezas', 'part', 'parts', 'parte', 'n pieza', 'no pieza', 'nro pieza', 'nopieza', 'id'],
  operador: ['operador', 'operadores', 'operator', 'op', 'inspector', 'medidor'],
  ensayo: ['ensayo', 'ensayos', 'trial', 'trials', 'run', 'repeticion', 'intento'],
  valor: ['valor', 'valores', 'value', 'values', 'medicion', 'medida', 'resultado', 'lectura'],
} as const

type Campo = CampoColumna

function campoDe(celda: Cell): Campo | null {
  const t = normalizar(celda)
  if (!t) return null
  for (const campo of Object.keys(ALIAS) as Campo[]) {
    if ((ALIAS[campo] as readonly string[]).includes(t)) return campo
  }
  return null
}

function recortar(grid: Grid): Cell[][] {
  const filas = grid.map((f) => [...f])
  while (filas.length && filaVacia(filas[filas.length - 1])) filas.pop()
  const ancho = filas.reduce((m, f) => Math.max(m, f.length), 0)
  for (const f of filas) while (f.length < ancho) f.push(null)
  return filas
}

function buscarEncabezado(filas: Cell[][]): { indice: number; mapa: Partial<Record<Campo, number>> } | null {
  for (let i = 0; i < Math.min(5, filas.length); i++) {
    const mapa: Partial<Record<Campo, number>> = {}
    filas[i].forEach((celda, col) => {
      const campo = campoDe(celda)
      if (campo && mapa[campo] === undefined) mapa[campo] = col
    })
    if (Object.keys(mapa).length >= 3) return { indice: i, mapa }
  }
  return null
}

function detectarAncho(filas: Cell[][]): { operadores: string[] } | null {
  if (filas.length < 3) return null
  const [cab, sub] = filas
  if (campoDe(cab[0]) !== 'pieza') return null
  const etiquetas = sub.map((c) => String(c ?? '').trim())
  const hayEnsayos = etiquetas.filter((e) => /^(ensayo|trial|e|r)?\s*[._-]?\s*\d+$/i.test(e)).length >= 2
  if (!hayEnsayos) return null
  const operadores: string[] = []
  let actual = ''
  for (let c = 1; c < Math.max(cab.length, sub.length); c++) {
    const nombre = String(cab[c] ?? '').trim()
    if (nombre) actual = nombre
    if (etiquetas[c]) {
      if (!actual) return null
      if (operadores[operadores.length - 1] !== actual) operadores.push(actual)
    }
  }
  if (operadores.length < 2) return null
  return { operadores }
}

interface LargoOut {
  lecturas: Reading[]
  filas: FilaDiseno[]
  vacios: number
}

function parseLargo(filas: Cell[][], enc: { indice: number; mapa: Partial<Record<Campo, number>> },
  issues: Issue[], max: number): LargoOut {
  const salida: LargoOut = { lecturas: [], filas: [], vacios: 0 }
  const faltan = (['pieza', 'operador', 'ensayo', 'valor'] as Campo[]).filter((c) => enc.mapa[c] === undefined)
  if (faltan.length) {
    issues.push({ fila: enc.indice + 1, codigo: 'COLUMNAS', severidad: 'error', clave: 'columnas', faltan })
    return salida
  }
  const col = enc.mapa as Record<Campo, number>
  const lecturas: Reading[] = []
  const vistos = new Map<string, number>()
  const mensajesVacios: Issue[] = []
  let vacios = 0
  let extraAvisado = false
  let extras = 0
  const anchoUtil = Math.max(...Object.values(col)) + 1

  for (let i = enc.indice + 1; i < filas.length; i++) {
    const fila = filas[i]
    if (filaVacia(fila)) continue
    const nFila = i + 1
    const pieza = String(fila[col.pieza] ?? '').trim()
    const operador = String(fila[col.operador] ?? '').trim()
    const ensayoCelda = fila[col.ensayo]
    const valorCelda = fila[col.valor]

    if (!pieza) { issues.push({ fila: nFila, codigo: 'PIEZA_VACIA', severidad: 'error', clave: 'piezaVacia' }); continue }
    if (!operador) { issues.push({ fila: nFila, codigo: 'OPERADOR_VACIO', severidad: 'error', clave: 'operadorVacio' }); continue }
    const ensayo = aNumero(ensayoCelda)
    if (ensayo === null || !Number.isInteger(ensayo) || ensayo < 1 || ensayo > MAX_ENSAYOS) {
      issues.push({ fila: nFila, codigo: 'ENSAYO_INVALIDO', severidad: 'error', clave: 'ensayoInvalido', vars: { ensayo: String(ensayoCelda ?? ''), max: MAX_ENSAYOS } })
      continue
    }
    salida.filas.push({ pieza, operador, ensayo })

    if (valorCelda === null || valorCelda === undefined || String(valorCelda).trim() === '') {
      vacios += 1
      if (mensajesVacios.length < MAX_MENSAJES_VALOR) {
        mensajesVacios.push({ fila: nFila, codigo: 'VALOR_VACIO', severidad: 'error', clave: 'valorVacio', vars: { pieza, operador, ensayo } })
      }
      continue
    }
    const valor = aNumero(valorCelda)
    if (valor === null) {
      issues.push({ fila: nFila, codigo: 'VALOR_NO_NUMERICO', severidad: 'error', clave: 'valorNoNumerico', vars: { valor: String(valorCelda) } })
      continue
    }
    const clave = `${claveEtiqueta(pieza)}\u0000${claveEtiqueta(operador)}\u0000${ensayo}`
    const previa = vistos.get(clave)
    if (previa !== undefined) {
      issues.push({ fila: nFila, codigo: 'DUPLICADO', severidad: 'error', clave: 'duplicado', vars: { pieza, operador, ensayo, previa } })
      continue
    }
    vistos.set(clave, nFila)
    if (lecturas.length >= max) {
      issues.push({ fila: nFila, codigo: 'MAXIMO', severidad: 'error', clave: 'maximoLecturas', vars: { max } })
      break
    }
    if (!extraAvisado && fila.slice(anchoUtil).some((c) => String(c ?? '').trim() !== '')) {
      extraAvisado = true
      extras = fila.slice(anchoUtil).filter((c) => String(c ?? '').trim() !== '').length
      issues.push({ fila: nFila, codigo: 'COLUMNAS_EXTRA', severidad: 'aviso', clave: 'columnasExtra', vars: { extras } })
    }
    lecturas.push({ pieza, operador, ensayo, valor, fila: nFila })
  }

  if (vacios > 0) {
    if (lecturas.length === 0) {
      issues.push({ fila: null, codigo: 'SIN_VALORES', severidad: 'error', clave: 'sinValores', vars: { vacios } })
    } else {
      issues.push(...mensajesVacios)
      if (vacios > mensajesVacios.length) {
        issues.push({ fila: null, codigo: 'VALOR_VACIO', severidad: 'error', clave: 'valorVacioResto', vars: { resto: vacios - mensajesVacios.length } })
      }
    }
  }

  return { lecturas, filas: salida.filas, vacios }
}

function parseAncho(filas: Cell[][], issues: Issue[]): Reading[] {
  const cab = filas[0]
  const sub = filas[1]
  const lecturas: Reading[] = []
  let actual = ''
  let ensayo = 0
  for (let c = 1; c < cab.length; c++) {
    const nombre = String(cab[c] ?? '').trim()
    if (nombre) { actual = nombre; ensayo = 0 }
    const etiqueta = String(sub[c] ?? '').trim()
    if (!etiqueta) continue
    const m = etiqueta.match(/(\d+)/)
    ensayo = m ? Number(m[1]) : ensayo + 1
    for (let i = 2; i < filas.length; i++) {
      const celda = filas[i][c]
      if (celda === null || celda === undefined || String(celda).trim() === '') continue
      const pieza = String(filas[i][0] ?? '').trim()
      const valor = aNumero(celda)
      if (!pieza || valor === null) {
        issues.push(valor === null
          ? { fila: i + 1, codigo: 'VALOR_NO_NUMERICO', severidad: 'error', clave: 'celdaNoNumerica', vars: { valor: String(celda) } }
          : { fila: i + 1, codigo: 'PIEZA_VACIA', severidad: 'error', clave: 'piezaVacia' })
        continue
      }
      lecturas.push({ pieza, operador: actual, ensayo, valor, fila: i + 1 })
    }
  }
  return lecturas
}

export function parseGrid(grid: Grid, opts: ParseOptions = {}): ParseResult {
  const contar = (desde: number, filas: Cell[][]) => filas.slice(desde).filter((f) => !filaVacia(f)).length
  const max = opts.maxLecturas ?? 5000
  const filas = recortar(grid)
  const issues: Issue[] = []
  const resumenVacio: Resumen = { piezas: 0, operadores: [], ensayos: 0, lecturas: 0, faltantes: 0 }

  if (filas.length === 0) {
    return {
      ok: false, layout: 'desconocido', lecturas: [], issues: [{ fila: null, codigo: 'SIN_DATOS', severidad: 'error', clave: 'sinDatos' }],
      resumen: resumenVacio, filas: 0, diseno: disenoVacio(),
    }
  }

  const enc = buscarEncabezado(filas)
  if (enc) {
    const out = parseLargo(filas, enc, issues, max)
    const diseno = construirDiseno(out.filas)
    const bloqueado = issues.some((i) => i.codigo === 'COLUMNAS')
    // Sin columnas o sin ninguna lectura no se valida el diseño: sería ruido en cascada.
    const resumen: Resumen = bloqueado || out.lecturas.length === 0
      ? { piezas: diseno.piezas.length, operadores: diseno.operadores, ensayos: diseno.ensayos.length, lecturas: 0, faltantes: out.vacios }
      : validarDiseno(out.lecturas, diseno, issues)
    return { ok: issues.every((i) => i.severidad !== 'error'), layout: 'long', lecturas: out.lecturas, issues, resumen, filas: contar(enc.indice + 1, filas), diseno }
  }

  const ancho = detectarAncho(filas)
  if (ancho) {
    const operadores = ancho.operadores
    const ensayos = Math.max(0, ...filas[1].map((c) => Number(String(c ?? '').match(/(\d+)/)?.[1] ?? 0)))
    if (!opts.confirmarAncho) {
      return {
        ok: false, layout: 'wide', lecturas: [],
        issues: [{ fila: 1, codigo: 'ANCHO_SIN_CONFIRMAR', severidad: 'error', clave: 'anchoSinConfirmar', vars: { operadores: operadores.length, ensayos } }],
        resumen: resumenVacio, filas: contar(2, filas), diseno: disenoVacio(), ancho: { operadores: operadores.sort(compararNatural), ensayos },
      }
    }
    const lecturas = parseAncho(filas, issues)
    const diseno = construirDiseno(lecturas)
    const resumen = lecturas.length
      ? validarDiseno(lecturas, diseno, issues)
      : { piezas: 0, operadores: diseno.operadores, ensayos: diseno.ensayos.length, lecturas: 0, faltantes: 0 }
    return { ok: issues.every((i) => i.severidad !== 'error'), layout: 'wide', lecturas, issues, resumen, filas: contar(2, filas), diseno }
  }

  return {
    ok: false, layout: 'desconocido', lecturas: [], resumen: resumenVacio, filas: contar(0, filas), diseno: disenoVacio(),
    issues: [{ fila: null, codigo: 'SIN_ENCABEZADO', severidad: 'error', clave: 'sinEncabezado' }],
  }
}
