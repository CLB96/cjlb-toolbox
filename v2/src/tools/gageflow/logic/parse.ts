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

export type Cell = string | number | boolean | null | undefined
export type Grid = readonly (readonly Cell[])[]

export interface Reading {
  pieza: string
  operador: string
  ensayo: number
  valor: number
  /** Fila de Excel (1-based), para señalar el error al usuario. */
  fila: number
}

/** Diseño resuelto y ordenado: la base del cálculo y de la tabla. */
export interface Diseno {
  piezas: string[]
  operadores: string[]
  ensayos: number[]
}

export type IssueCode =
  | 'SIN_DATOS' | 'SIN_ENCABEZADO' | 'COLUMNAS' | 'COLUMNAS_EXTRA' | 'SIN_VALORES'
  | 'PIEZA_VACIA' | 'OPERADOR_VACIO' | 'ENSAYO_INVALIDO' | 'ENSAYOS_INCOMPLETOS'
  | 'VALOR_VACIO' | 'VALOR_NO_NUMERICO' | 'DUPLICADO'
  | 'DESBALANCEADO' | 'POCAS_PIEZAS' | 'POCOS_OPERADORES' | 'POCOS_ENSAYOS'
  | 'MAXIMO' | 'ANCHO_SIN_CONFIRMAR'

export type Severidad = 'error' | 'aviso'

export interface Issue {
  fila: number | null
  codigo: IssueCode
  severidad: Severidad
  mensaje: string
}

export interface ParseOptions {
  /** El usuario ya confirmó que la hoja AIAG detectada es correcta. */
  confirmarAncho?: boolean
  maxLecturas?: number
}

export interface Resumen {
  piezas: number
  operadores: string[]
  ensayos: number
  lecturas: number
  faltantes: number
}

export interface ParseResult {
  ok: boolean
  layout: 'long' | 'wide' | 'desconocido'
  lecturas: Reading[]
  issues: Issue[]
  resumen: Resumen
  /** Diseño resuelto y ordenado, aunque todavía no haya valores. */
  diseno: Diseno
  /** Solo en 'wide': lo que se convertiría, para el diálogo de confirmación. */
  ancho?: { operadores: string[]; ensayos: number }
}

/** Cuántos errores iguales se listan antes de resumirlos. */
const MAX_MENSAJES_VALOR = 10
const MAX_PIEZAS = 100
const MAX_OPERADORES = 20
const MAX_ENSAYOS = 10

const ALIAS = {
  pieza: ['pieza', 'piezas', 'part', 'parts', 'parte', 'n pieza', 'no pieza', 'nro pieza', 'nopieza', 'id'],
  operador: ['operador', 'operadores', 'operator', 'op', 'inspector', 'medidor'],
  ensayo: ['ensayo', 'ensayos', 'trial', 'trials', 'run', 'repeticion', 'intento'],
  valor: ['valor', 'valores', 'value', 'values', 'medicion', 'medida', 'resultado', 'lectura'],
} as const

type Campo = keyof typeof ALIAS

/** minúsculas, sin acentos ni signos: "Nº Pieza" y "No. PIEZA" son lo mismo. */
export function normalizar(texto: Cell): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Clave de comparación de etiquetas: sin mayúsculas ni espacios de más. */
export function claveEtiqueta(texto: Cell): string {
  return String(texto ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** "Operador 2" antes que "Operador 10"; "A-2" antes que "A-10". */
export function compararNatural(a: string, b: string): number {
  const trozos = (s: string) => s.match(/\d+|\D+/g) ?? ['']
  const ta = trozos(a)
  const tb = trozos(b)
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const na = /^\d+$/.test(ta[i])
    const nb = /^\d+$/.test(tb[i])
    if (na && nb) {
      const d = Number(ta[i]) - Number(tb[i])
      if (d !== 0) return d
    } else {
      const c = ta[i].localeCompare(tb[i], 'es', { sensitivity: 'base' })
      if (c !== 0) return c
    }
  }
  return ta.length - tb.length
}

function campoDe(celda: Cell): Campo | null {
  const t = normalizar(celda)
  if (!t) return null
  for (const campo of Object.keys(ALIAS) as Campo[]) {
    if ((ALIAS[campo] as readonly string[]).includes(t)) return campo
  }
  return null
}

/** Acepta 2.501, 2,501, "2 501", " 2.501 ". Devuelve null si no es un número. */
export function aNumero(celda: Cell): number | null {
  if (typeof celda === 'number') return Number.isFinite(celda) ? celda : null
  if (typeof celda !== 'string') return null
  let t = celda.replace(/\s|\u00a0/g, '')
  if (!t) return null
  const punto = t.lastIndexOf('.')
  const coma = t.lastIndexOf(',')
  if (punto >= 0 && coma >= 0) {
    // El separador que aparece al final es el decimal; el otro es de miles.
    t = punto > coma ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.')
  } else if (coma >= 0) {
    t = t.replace(/,/g, '.')
  }
  if (!/^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function filaVacia(fila: readonly Cell[] | undefined): boolean {
  if (!fila) return true
  return fila.every((c) => c === null || c === undefined || String(c).trim() === '')
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

interface FilaDiseno {
  pieza: string
  operador: string
  ensayo: number
}

const disenoVacio = (): Diseno => ({ piezas: [], operadores: [], ensayos: [] })

/** Ordena y deduplica a partir de las filas, en cualquier orden que lleguen. */
export function construirDiseno(filas: readonly FilaDiseno[]): Diseno {
  const piezas = new Map<string, string>()
  const operadores = new Map<string, string>()
  const ensayos = new Set<number>()
  for (const f of filas) {
    if (!piezas.has(claveEtiqueta(f.pieza))) piezas.set(claveEtiqueta(f.pieza), f.pieza.trim())
    if (!operadores.has(claveEtiqueta(f.operador))) operadores.set(claveEtiqueta(f.operador), f.operador.trim())
    ensayos.add(f.ensayo)
  }
  return {
    piezas: [...piezas.values()].sort(compararNatural),
    operadores: [...operadores.values()].sort(compararNatural),
    ensayos: [...ensayos].sort((a, b) => a - b),
  }
}

/** Coloca cada lectura en [pieza][operador][ensayo-1]. Huecos quedan en null. */
export function aMatriz(lecturas: readonly Reading[], diseno: Diseno): (number | null)[][][] {
  const p = new Map(diseno.piezas.map((v, i) => [claveEtiqueta(v), i]))
  const o = new Map(diseno.operadores.map((v, i) => [claveEtiqueta(v), i]))
  const e = new Map(diseno.ensayos.map((v, i) => [v, i]))
  const m: (number | null)[][][] = diseno.piezas.map(() =>
    diseno.operadores.map(() => diseno.ensayos.map(() => null)))
  for (const l of lecturas) {
    const i = p.get(claveEtiqueta(l.pieza))
    const j = o.get(claveEtiqueta(l.operador))
    const k = e.get(l.ensayo)
    if (i === undefined || j === undefined || k === undefined) continue
    m[i][j][k] = l.valor
  }
  return m
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
    issues.push({
      fila: enc.indice + 1, codigo: 'COLUMNAS', severidad: 'error', mensaje:
        `Faltan columnas obligatorias: ${faltan.join(', ')}. La hoja debe tener Pieza, Operador, Ensayo y Valor.`,
    })
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

    if (!pieza) { issues.push({ fila: nFila, codigo: 'PIEZA_VACIA', severidad: 'error', mensaje: 'Falta la pieza.' }); continue }
    if (!operador) { issues.push({ fila: nFila, codigo: 'OPERADOR_VACIO', severidad: 'error', mensaje: 'Falta el operador.' }); continue }
    const ensayo = aNumero(ensayoCelda)
    if (ensayo === null || !Number.isInteger(ensayo) || ensayo < 1 || ensayo > MAX_ENSAYOS) {
      issues.push({ fila: nFila, codigo: 'ENSAYO_INVALIDO', severidad: 'error', mensaje: `Ensayo "${String(ensayoCelda ?? '')}" no válido: debe ser un entero de 1 a ${MAX_ENSAYOS}.` })
      continue
    }
    salida.filas.push({ pieza, operador, ensayo })

    if (valorCelda === null || valorCelda === undefined || String(valorCelda).trim() === '') {
      vacios += 1
      if (mensajesVacios.length < MAX_MENSAJES_VALOR) {
        mensajesVacios.push({ fila: nFila, codigo: 'VALOR_VACIO', severidad: 'error', mensaje: `Falta el valor de la pieza ${pieza}, ${operador}, ensayo ${ensayo}.` })
      }
      continue
    }
    const valor = aNumero(valorCelda)
    if (valor === null) {
      issues.push({ fila: nFila, codigo: 'VALOR_NO_NUMERICO', severidad: 'error', mensaje: `"${String(valorCelda)}" no es un número. Quita unidades y símbolos.` })
      continue
    }
    const clave = `${claveEtiqueta(pieza)}\u0000${claveEtiqueta(operador)}\u0000${ensayo}`
    const previa = vistos.get(clave)
    if (previa !== undefined) {
      issues.push({ fila: nFila, codigo: 'DUPLICADO', severidad: 'error', mensaje: `Lectura repetida: ${pieza} / ${operador} / ensayo ${ensayo} ya está en la fila ${previa}.` })
      continue
    }
    vistos.set(clave, nFila)
    if (lecturas.length >= max) {
      issues.push({ fila: nFila, codigo: 'MAXIMO', severidad: 'error', mensaje: `Máximo ${max} lecturas por estudio.` })
      break
    }
    if (!extraAvisado && fila.slice(anchoUtil).some((c) => String(c ?? '').trim() !== '')) {
      extraAvisado = true
      extras = fila.slice(anchoUtil).filter((c) => String(c ?? '').trim() !== '').length
      issues.push({ fila: nFila, codigo: 'COLUMNAS_EXTRA', severidad: 'aviso', mensaje: `Hay datos fuera de las cuatro columnas (${extras} celdas); se ignoran.` })
    }
    lecturas.push({ pieza, operador, ensayo, valor, fila: nFila })
  }

  if (vacios > 0) {
    if (lecturas.length === 0) {
      issues.push({
        fila: null, codigo: 'SIN_VALORES', severidad: 'error',
        mensaje: `Ninguna de las ${vacios} filas preparadas tiene valor todavía.`,
      })
    } else {
      issues.push(...mensajesVacios)
      if (vacios > mensajesVacios.length) {
        issues.push({
          fila: null, codigo: 'VALOR_VACIO', severidad: 'error',
          mensaje: `… y ${vacios - mensajesVacios.length} lecturas más sin valor.`,
        })
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
        issues.push({ fila: i + 1, codigo: valor === null ? 'VALOR_NO_NUMERICO' : 'PIEZA_VACIA', severidad: 'error', mensaje: valor === null ? `"${String(celda)}" no es un número.` : 'Falta la pieza.' })
        continue
      }
      lecturas.push({ pieza, operador: actual, ensayo, valor, fila: i + 1 })
    }
  }
  return lecturas
}

function validarDiseno(lecturas: Reading[], diseno: Diseno, issues: Issue[]): Resumen {
  const { piezas, operadores, ensayos } = diseno
  const claves = new Set(lecturas.map((l) => `${claveEtiqueta(l.pieza)}\u0000${claveEtiqueta(l.operador)}\u0000${l.ensayo}`))
  const esperadas = piezas.length * operadores.length * ensayos.length
  const faltantes = Math.max(0, esperadas - claves.size)

  if (lecturas.length < 10) {
    issues.push({ fila: null, codigo: 'POCAS_PIEZAS', severidad: 'error', mensaje: `Solo hay ${lecturas.length} lecturas; se necesitan al menos 10.` })
  }
  if (piezas.length < 2) {
    issues.push({ fila: null, codigo: 'POCAS_PIEZAS', severidad: 'error', mensaje: 'Se necesitan al menos 2 piezas distintas.' })
  } else if (piezas.length < 5) {
    issues.push({ fila: null, codigo: 'POCAS_PIEZAS', severidad: 'aviso', mensaje: `Con ${piezas.length} piezas el ndc sale muy bajo; lo recomendable son 10.` })
  }
  if (operadores.length < 2) {
    issues.push({ fila: null, codigo: 'POCOS_OPERADORES', severidad: 'error', mensaje: 'Se necesitan al menos 2 operadores para medir reproducibilidad.' })
  }
  if (ensayos.length < 2) {
    issues.push({ fila: null, codigo: 'POCOS_ENSAYOS', severidad: 'error', mensaje: 'Se necesitan al menos 2 ensayos por operador y pieza.' })
  }
  if (piezas.length > MAX_PIEZAS) {
    issues.push({ fila: null, codigo: 'MAXIMO', severidad: 'error', mensaje: `Máximo ${MAX_PIEZAS} piezas por estudio.` })
  }
  if (operadores.length > MAX_OPERADORES) {
    issues.push({ fila: null, codigo: 'MAXIMO', severidad: 'error', mensaje: `Máximo ${MAX_OPERADORES} operadores por estudio.` })
  }
  // Los ensayos deben ser 1..r: un salto suele ser una fila perdida, no un diseño.
  const huecosEnsayo = Array.from({ length: ensayos[ensayos.length - 1] ?? 0 }, (_, i) => i + 1)
    .filter((n) => !ensayos.includes(n))
  if (huecosEnsayo.length > 0) {
    issues.push({
      fila: null, codigo: 'ENSAYOS_INCOMPLETOS', severidad: 'error',
      mensaje: `Los ensayos deben ir de 1 a ${ensayos[ensayos.length - 1]}; falta${huecosEnsayo.length > 1 ? 'n' : ''} ${huecosEnsayo.join(', ')}.`,
    })
  }
  if (faltantes > 0 && issues.every((i) => i.codigo !== 'VALOR_VACIO')) {
    const huecos: string[] = []
    const presentes = new Set(lecturas.map((l) => `${claveEtiqueta(l.pieza)}\u0000${claveEtiqueta(l.operador)}\u0000${l.ensayo}`))
    for (const p of piezas) for (const o of operadores) for (const e of ensayos) {
      if (!presentes.has(`${claveEtiqueta(p)}\u0000${claveEtiqueta(o)}\u0000${e}`)) huecos.push(`${p} / ${o} / ensayo ${e}`)
    }
    issues.push({ fila: null, codigo: 'DESBALANCEADO', severidad: 'error', mensaje: `Faltan ${faltantes} lecturas (${huecos.slice(0, 5).join('; ')}${huecos.length > 5 ? '…' : ''}).` })
  }
  return { piezas: piezas.length, operadores, ensayos: ensayos.length, lecturas: lecturas.length, faltantes }
}

export function parseGrid(grid: Grid, opts: ParseOptions = {}): ParseResult {
  const max = opts.maxLecturas ?? 5000
  const filas = recortar(grid)
  const issues: Issue[] = []
  const resumenVacio: Resumen = { piezas: 0, operadores: [], ensayos: 0, lecturas: 0, faltantes: 0 }

  if (filas.length === 0) {
    return {
      ok: false, layout: 'desconocido', lecturas: [], issues: [{ fila: null, codigo: 'SIN_DATOS', severidad: 'error', mensaje: 'La hoja está vacía.' }],
      resumen: resumenVacio, diseno: disenoVacio(),
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
    return { ok: issues.every((i) => i.severidad !== 'error'), layout: 'long', lecturas: out.lecturas, issues, resumen, diseno }
  }

  const ancho = detectarAncho(filas)
  if (ancho) {
    const operadores = ancho.operadores
    const ensayos = Math.max(0, ...filas[1].map((c) => Number(String(c ?? '').match(/(\d+)/)?.[1] ?? 0)))
    if (!opts.confirmarAncho) {
      return {
        ok: false, layout: 'wide', lecturas: [],
        issues: [{ fila: 1, codigo: 'ANCHO_SIN_CONFIRMAR', severidad: 'error', mensaje: `Detecté una hoja AIAG con ${operadores.length} operadores y ${ensayos} ensayos. Confirma para convertirla.` }],
        resumen: resumenVacio, diseno: disenoVacio(), ancho: { operadores: operadores.sort(compararNatural), ensayos },
      }
    }
    const lecturas = parseAncho(filas, issues)
    const diseno = construirDiseno(lecturas)
    const resumen = lecturas.length
      ? validarDiseno(lecturas, diseno, issues)
      : { piezas: 0, operadores: diseno.operadores, ensayos: diseno.ensayos.length, lecturas: 0, faltantes: 0 }
    return { ok: issues.every((i) => i.severidad !== 'error'), layout: 'wide', lecturas, issues, resumen, diseno }
  }

  return {
    ok: false, layout: 'desconocido', lecturas: [], resumen: resumenVacio, diseno: disenoVacio(),
    issues: [{
      fila: null, codigo: 'SIN_ENCABEZADO', severidad: 'error',
      mensaje: 'No encontré los encabezados Pieza, Operador, Ensayo y Valor. Descarga la plantilla y pega tus datos ahí.',
    }],
  }
}
