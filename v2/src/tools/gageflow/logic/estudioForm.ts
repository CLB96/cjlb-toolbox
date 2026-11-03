/**
 * Formulario del estudio: qué se captura en la app y qué se valida aquí.
 *
 * La validación vive en el formulario, no en el motor de cálculo: el motor
 * recibe límites ya coherentes. Los números llegan como texto (son inputs) y se
 * normalizan en `validarEstudio`.
 */

export type Metodo = 'anova' | 'xbarR' | 'ambos'
export type Confianza = 90 | 95 | 99

export interface EstudioForm {
  pieza: string
  caracteristica: string
  unidad: string
  nominal: string
  lsl: string
  usl: string
  resolucion: string
  metodo: Metodo
  confianza: Confianza
  piezas: number
  operadores: string[]
  ensayos: number
}

export interface EstudioNormalizado {
  pieza: string
  caracteristica: string
  unidad: string
  nominal: number | null
  lsl: number | null
  usl: number | null
  resolucion: number | null
  metodo: Metodo
  confianza: Confianza
  piezas: string[]
  operadores: string[]
  ensayos: number
}

export type CampoEstudio =
  | 'pieza' | 'caracteristica' | 'unidad' | 'nominal' | 'lsl' | 'usl'
  | 'resolucion' | 'metodo' | 'confianza' | 'piezas' | 'operadores' | 'ensayos'

export type CodigoForm =
  | 'requerido' | 'muyLargo' | 'noNumerico' | 'fueraDeRango'
  | 'lslMayorUsl' | 'nominalFuera' | 'duplicado' | 'resolucionGruesa'
  | 'toleranciaIncompleta' | 'sinOperadores'

export interface ProblemaForm {
  campo: CampoEstudio
  codigo: CodigoForm
  mensaje: string
}

export interface ValidacionForm {
  ok: boolean
  errores: ProblemaForm[]
  avisos: ProblemaForm[]
  estudio: EstudioNormalizado | null
}

export const LIMITES_FORM = {
  piezas: { min: 2, max: 100 },
  operadores: { min: 2, max: 20 },
  ensayos: { min: 2, max: 10 },
  texto: 80,
} as const

export const ESTUDIO_INICIAL: EstudioForm = {
  pieza: '',
  caracteristica: '',
  unidad: 'mm',
  nominal: '',
  lsl: '',
  usl: '',
  resolucion: '0.001',
  metodo: 'anova',
  confianza: 95,
  piezas: 10,
  operadores: ['Operador 1', 'Operador 2', 'Operador 3'],
  ensayos: 3,
}

const numero = (texto: string): number | null => {
  const t = texto.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const clave = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

export function validarEstudio(form: EstudioForm): ValidacionForm {
  const errores: ProblemaForm[] = []
  const avisos: ProblemaForm[] = []
  const err = (campo: CampoEstudio, codigo: CodigoForm, mensaje: string) =>
    errores.push({ campo, codigo, mensaje })
  const avi = (campo: CampoEstudio, codigo: CodigoForm, mensaje: string) =>
    avisos.push({ campo, codigo, mensaje })

  const texto = (campo: 'pieza' | 'caracteristica' | 'unidad', valor: string) => {
    const v = valor.trim()
    if (!v) err(campo, 'requerido', 'Este campo es obligatorio.')
    else if (v.length > LIMITES_FORM.texto) err(campo, 'muyLargo', 'Máximo 80 caracteres.')
    return v
  }

  const pieza = texto('pieza', form.pieza)
  const caracteristica = texto('caracteristica', form.caracteristica)
  const unidad = texto('unidad', form.unidad)

  const leerNumero = (campo: 'nominal' | 'lsl' | 'usl' | 'resolucion', valor: string) => {
    if (!valor.trim()) return null
    const n = numero(valor)
    if (n === null) err(campo, 'noNumerico', 'Escribe un número.')
    return n
  }

  const nominal = leerNumero('nominal', form.nominal)
  const lsl = leerNumero('lsl', form.lsl)
  const usl = leerNumero('usl', form.usl)
  const resolucion = leerNumero('resolucion', form.resolucion)

  if (lsl !== null && usl !== null && usl <= lsl) {
    err('usl', 'lslMayorUsl', 'El límite superior debe ser mayor que el inferior.')
  }
  if ((lsl === null) !== (usl === null)) {
    avi('usl', 'toleranciaIncompleta',
      'Con un solo límite no hay %GRR de tolerancia; se usará la variación total.')
  }
  if (lsl !== null && usl !== null && nominal !== null && (nominal < lsl || nominal > usl)) {
    avi('nominal', 'nominalFuera', 'El nominal queda fuera de los límites.')
  }
  if (resolucion !== null && resolucion <= 0) {
    err('resolucion', 'fueraDeRango', 'La resolución debe ser mayor que cero.')
  }
  if (lsl !== null && usl !== null && resolucion !== null && resolucion > (usl - lsl) / 10) {
    avi('resolucion', 'resolucionGruesa',
      'La resolución es gruesa para esta tolerancia: conviene al menos 10 divisiones.')
  }

  const rango = (campo: 'piezas' | 'ensayos', valor: number) => {
    const { min, max } = LIMITES_FORM[campo]
    if (!Number.isInteger(valor) || valor < min || valor > max) {
      err(campo, 'fueraDeRango', `Debe ser un entero entre ${min} y ${max}.`)
    }
  }
  rango('piezas', form.piezas)
  rango('ensayos', form.ensayos)

  const operadores = form.operadores.map((o) => o.trim())
  if (operadores.length < LIMITES_FORM.operadores.min ||
      operadores.length > LIMITES_FORM.operadores.max) {
    err('operadores', 'fueraDeRango',
      `Debe haber entre ${LIMITES_FORM.operadores.min} y ${LIMITES_FORM.operadores.max} operadores.`)
  }
  const vistos = new Set<string>()
  operadores.forEach((o, i) => {
    if (!o) err('operadores', 'requerido', `El operador ${i + 1} no tiene nombre.`)
    else if (o.length > LIMITES_FORM.texto) err('operadores', 'muyLargo', 'Máximo 80 caracteres.')
    else if (vistos.has(clave(o))) err('operadores', 'duplicado', `«${o}» está repetido.`)
    else vistos.add(clave(o))
  })
  if (operadores.length === 0) err('operadores', 'sinOperadores', 'Añade al menos dos operadores.')

  const ok = errores.length === 0
  if (!ok) return { ok: false, errores, avisos, estudio: null }

  const piezas = Array.from({ length: form.piezas }, (_, i) => String(i + 1))
  return {
    ok: true, errores: [], avisos,
    estudio: {
      pieza, caracteristica, unidad, nominal, lsl, usl, resolucion,
      metodo: form.metodo, confianza: form.confianza,
      piezas, operadores, ensayos: form.ensayos,
    },
  }
}

export interface AvisoDiseno {
  campo: 'piezas' | 'operadores' | 'ensayos'
  archivo: number
  formulario: number
}

/** Avisos cuando el archivo trae un diseño distinto al del formulario. */
export function compararDiseno(estudio: EstudioNormalizado, real: {
  piezas: number; operadores: readonly string[]; ensayos: number
}): AvisoDiseno[] {
  const comparados: AvisoDiseno[] = [
    { campo: 'piezas', archivo: real.piezas, formulario: estudio.piezas.length },
    { campo: 'operadores', archivo: real.operadores.length, formulario: estudio.operadores.length },
    { campo: 'ensayos', archivo: real.ensayos, formulario: estudio.ensayos },
  ]
  return comparados.filter((a) => a.archivo !== a.formulario)
}
