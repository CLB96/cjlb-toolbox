/**
 * Modelo del PNG: qué se dibuja y con qué texto. Separado del canvas para poder
 * probarlo sin DOM.
 */
import type { EstudioResultado } from '../logic/types'
import type { Diseno } from '../logic/parse'
import { TEXTOS } from '../i18n'
import { textoSesgo } from '../logic/unidades'

export interface OpcionesPng {
  pieza: string
  caracteristica: string
  especificacion: string
  lang: 'es' | 'en'
  nominal?: number
  unidad?: string
  fecha?: Date
}

export interface ModeloPng {
  titulo: string
  subtitulo: string
  fecha: string
  veredicto: { texto: string; valor: string; detalle: string; color: string }
  kpis: { etiqueta: string; valor: string; nota: string; color: string }[]
  componentes: { etiqueta: string; mm: string; pct: number; texto: string; color: string }[]
  anova: { fuente: string; gl: string; ss: string; ms: string; f: string; p: string }[]
  operadores: { nombre: string; media: string; sesgo: string }[]
  etiquetas: {
    componentes: string
    anova: string
    operadores: string
    fuente: string
    gl: string
    ss: string
    ms: string
    f: string
    p: string
    media: string
    sesgo: string
  }
  pie: string
}

const COLOR = { ok: '#7cf0c4', warn: '#ffd166', mal: '#ff8a9b', info: '#8fb4ff', acento: '#d16bff' }

const pct = (n: number, d = 1) => `${n.toFixed(d)} %`
const num = (n: number, d = 3) => n.toFixed(d)

function colorVeredicto(v: EstudioResultado['veredicto']): string {
  if (v === 'aceptable') return COLOR.ok
  if (v === 'condicional') return COLOR.warn
  return COLOR.mal
}

export function construirModeloPng(
  resultado: EstudioResultado,
  diseno: Diseno,
  matriz: number[][][],
  opciones: OpcionesPng,
): ModeloPng {
  const d = TEXTOS[opciones.lang]
  const fecha = opciones.fecha ?? new Date()
  const grr = resultado.pctGrrTolerancia ?? resultado.pctGrrVariacion
  const conTol = resultado.pctGrrTolerancia !== null
  const c = resultado.componentes
  const unidad = opciones.unidad ?? 'mm'

  const veredictoTexto = {
    aceptable: d.vAceptable,
    condicional: d.vCondicional,
    noAceptable: d.vNoAceptable,
  }[resultado.veredicto]

  const detalleVeredicto = {
    aceptable: d.vAceptableTexto,
    condicional: d.vCondicionalTexto,
    noAceptable: d.vNoAceptableTexto,
  }[resultado.veredicto]

  const kpis = [
    { etiqueta: d.kpiGrr, valor: conTol ? pct(grr) : '—', nota: d.limite, color: colorVeredicto(resultado.veredicto) },
    { etiqueta: d.kpiNdc, valor: String(resultado.ndc), nota: d.minimo, color: COLOR.ok },
    { etiqueta: d.kpiEv, valor: `${num(c.ev.seis)} ${unidad}`, nota: pct(c.ev.pctTolerancia ?? 0), color: COLOR.info },
    { etiqueta: d.kpiAv, valor: `${num(c.av.seis)} ${unidad}`, nota: pct(c.av.pctTolerancia ?? 0), color: COLOR.acento },
  ]

  const componentes = [
    { etiqueta: d.compEv, comp: c.ev, color: COLOR.info },
    { etiqueta: d.compAv, comp: c.av, color: COLOR.acento },
    { etiqueta: d.compInt, comp: c.interaccion, color: COLOR.warn },
    { etiqueta: d.compGrr, comp: c.grr, color: '#6a7bff' },
    { etiqueta: d.compPv, comp: c.parte, color: COLOR.ok },
  ].map(({ etiqueta, comp, color }) => ({
    etiqueta,
    color,
    mm: `${num(comp.seis)} ${unidad}`,
    pct: comp.pctTolerancia ?? comp.pctContribucion,
    texto: pct(comp.pctTolerancia ?? comp.pctContribucion),
  }))

  const nombreFuente: Record<string, string> = {
    pieza: d.filaPieza, operador: d.filaOperador, interaccion: d.filaInteraccion, error: d.filaError,
  }

  const anova = resultado.anova.map((f) => ({
    fuente: nombreFuente[f.fuente] ?? f.fuente,
    gl: String(f.gl),
    ss: f.ss.toFixed(6),
    ms: f.ms.toFixed(6),
    f: f.f === null ? '—' : f.f.toFixed(2),
    p: f.p === null ? '—' : f.p < 0.0001 ? '< 0.0001' : f.p.toFixed(4),
  }))

  const operadores = diseno.operadores.map((op, j) => {
    const valores = matriz.map((fila) => fila[j]).flat()
    const media = valores.reduce((a, b) => a + b, 0) / valores.length
    const sesgo = opciones.nominal === undefined ? null : media - opciones.nominal
    return {
      nombre: op,
      media: media.toFixed(4),
      sesgo: sesgo === null ? '—' : textoSesgo(sesgo, unidad),
    }
  })

  return {
    titulo: `${d.titulo} · ${opciones.pieza || '—'}`,
    subtitulo: opciones.caracteristica,
    fecha: fecha.toLocaleDateString(opciones.lang === 'es' ? 'es-MX' : 'en-US'),
    veredicto: {
      texto: veredictoTexto,
      valor: conTol ? pct(grr) : pct(resultado.pctGrrVariacion),
      detalle: detalleVeredicto,
      color: colorVeredicto(resultado.veredicto),
    },
    kpis,
    componentes,
    anova,
    operadores,
    etiquetas: {
      componentes: d.componentes,
      anova: d.anova,
      operadores: d.porOperador,
      fuente: d.fuente,
      gl: d.gl,
      ss: d.ss,
      ms: d.ms,
      f: d.f,
      p: d.p,
      media: d.media,
      sesgo: d.sesgo,
    },
    pie: `CJLB Toolbox · GageFlow · ${opciones.especificacion}`,
  }
}
