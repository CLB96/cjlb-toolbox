import { describe, expect, it } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { aMatriz, parseGrid, type Cell } from '../logic/parse'
import { calcularEstudio } from '../logic/estudio'
import { ESTUDIO_INICIAL, validarEstudio } from '../logic/estudioForm'

function csvAGrid(texto: string): Cell[][] {
  return texto.trim().split(/\r?\n/).map((linea) => linea.split(',').map((c, i) => {
    if (i === 0 || i === 1) return c
    const n = Number(c)
    return Number.isFinite(n) && c.trim() !== '' ? n : c
  }))
}

const LECTURAS = parseGrid(csvAGrid(csv))
const MATRIZ = aMatriz(LECTURAS.lecturas, LECTURAS.diseno) as number[][][]
const LIMITES = { lsl: 2.4, usl: 2.6 }

describe('parser', () => {
  it('lee el estudio de ejemplo completo', () => {
    expect(LECTURAS.ok).toBe(true)
    expect(LECTURAS.lecturas).toHaveLength(90)
    expect(LECTURAS.diseno.piezas).toHaveLength(10)
    expect(LECTURAS.diseno.operadores).toHaveLength(3)
    expect(LECTURAS.diseno.ensayos).toEqual([1, 2, 3])
  })

  it('rechaza filas revueltas con valores duplicados', () => {
    const grid = csvAGrid(csv)
    grid.push(['1', 'Operador 1', 1, 2.5])
    const r = parseGrid(grid)
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.codigo === 'DUPLICADO')).toBe(true)
  })

  it('detecta un valor vacío y lo ubica', () => {
    const grid = csvAGrid(csv).map((f) => [...f])
    grid[10][3] = null
    const r = parseGrid(grid)
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.codigo === 'VALOR_VACIO')).toBe(true)
  })
})

describe('motor de cálculo', () => {
  it('reproduce los índices del estudio de referencia', () => {
    const r = calcularEstudio(MATRIZ, LIMITES)
    expect(r.ok).toBe(true)
    expect(r.pctGrrTolerancia).toBeCloseTo(19.125, 2)
    expect(r.pctGrrVariacion).toBeCloseTo(20.641, 2)
    expect(r.ndc).toBe(6)
    expect(r.veredicto).toBe('condicional')
  })

  it('descompone la varianza como AIAG', () => {
    const r = calcularEstudio(MATRIZ, LIMITES)
    expect(r.componentes.ev.seis).toBeCloseTo(0.03382, 4)
    expect(r.componentes.av.seis).toBeCloseTo(0.01730, 4)
    expect(r.componentes.interaccion.seis).toBeCloseTo(0.00444, 4)
    expect(r.componentes.grr.seis).toBeCloseTo(0.03825, 4)
    expect(r.componentes.parte.seis).toBeCloseTo(0.18132, 4)
  })

  it('da el ANOVA esperado', () => {
    const r = calcularEstudio(MATRIZ, LIMITES)
    const pieza = r.anova.find((f) => f.fuente === 'pieza')
    const operador = r.anova.find((f) => f.fuente === 'operador')
    const inter = r.anova.find((f) => f.fuente === 'interaccion')
    expect(pieza?.f).toBeCloseTo(246.94, 1)
    expect(operador?.p).toBeCloseTo(0.002564, 5)
    expect(inter?.p).toBeCloseTo(0.420435, 5)
  })

  it('sin límites informa la variación total', () => {
    const r = calcularEstudio(MATRIZ)
    expect(r.ok).toBe(true)
    expect(r.pctGrrTolerancia).toBeNull()
    expect(r.recomendaciones).toContain('sinLimites')
  })

  it('rechaza matrices incompletas', () => {
    const rota = MATRIZ.map((a) => a.map((b) => [...b]))
    rota[0][0][0] = Number.NaN
    const r = calcularEstudio(rota, LIMITES)
    expect(r.ok).toBe(false)
    expect(r.errores).toContain('valorFaltante')
  })
})

describe('formulario', () => {
  const base = { ...ESTUDIO_INICIAL, pieza: 'A-12', caracteristica: 'Espesor' }

  it('exige pieza y característica', () => {
    const v = validarEstudio(ESTUDIO_INICIAL)
    expect(v.ok).toBe(false)
    expect(v.errores.some((e) => e.campo === 'pieza')).toBe(true)
  })

  it('normaliza números con coma', () => {
    const v = validarEstudio({ ...base, nominal: '2,50', lsl: '2.40', usl: '2,60' })
    expect(v.ok).toBe(true)
    expect(v.estudio?.nominal).toBe(2.5)
    expect(v.estudio?.usl).toBe(2.6)
  })

  it('rechaza límites invertidos', () => {
    const v = validarEstudio({ ...base, lsl: '2.60', usl: '2.40' })
    expect(v.ok).toBe(false)
    expect(v.errores.some((e) => e.codigo === 'lslMayorUsl')).toBe(true)
  })

  it('rechaza operadores duplicados', () => {
    const v = validarEstudio({ ...base, operadores: ['Ana', ' ana ', 'Luis'] })
    expect(v.ok).toBe(false)
    expect(v.errores.some((e) => e.codigo === 'duplicado')).toBe(true)
  })

  it('avisa del nominal fuera de límites', () => {
    const v = validarEstudio({ ...base, nominal: '2.70', lsl: '2.40', usl: '2.60' })
    expect(v.ok).toBe(true)
    expect(v.avisos.some((a) => a.codigo === 'nominalFuera')).toBe(true)
  })
})
