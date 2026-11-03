import { describe, expect, it } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { aMatriz, parseGrid, type Cell } from '../logic/parse'
import { calcularEstudio } from '../logic/estudio'
import { construirModeloPng } from '../export/pngModel'

const grid: Cell[][] = csv.trim().split(/\r?\n/).map((linea) => linea.split(',').map((c, i) => {
  if (i === 0 || i === 1) return c
  const n = Number(c)
  return Number.isFinite(n) && c.trim() !== '' ? n : c
}))

const parsed = parseGrid(grid)
const matriz = aMatriz(parsed.lecturas, parsed.diseno) as number[][][]
const resultado = calcularEstudio(matriz, { lsl: 2.4, usl: 2.6 })

const opciones = {
  pieza: 'A-12',
  caracteristica: 'Espesor de skin',
  especificacion: '2.50 ± 0.10 mm',
  lang: 'es' as const,
  nominal: 2.5,
  fecha: new Date('2026-11-02T12:00:00Z'),
}

describe('modelo del PNG', () => {
  it('resume el veredicto y los indicadores', () => {
    const m = construirModeloPng(resultado, parsed.diseno, matriz, opciones)
    expect(m.titulo).toContain('A-12')
    expect(m.veredicto.texto).toBe('ACEPTABLE CONDICIONAL')
    expect(m.veredicto.valor).toBe('19.1 %')
    expect(m.kpis).toHaveLength(4)
    expect(m.kpis[1].valor).toBe('6')
  })

  it('incluye los cinco componentes y las cuatro filas del ANOVA', () => {
    const m = construirModeloPng(resultado, parsed.diseno, matriz, opciones)
    expect(m.componentes).toHaveLength(5)
    expect(m.componentes[0].etiqueta).toContain('Repetibilidad')
    expect(m.anova).toHaveLength(4)
    expect(m.anova[3].p).toBe('—')
  })

  it('calcula el sesgo por operador contra el nominal', () => {
    const m = construirModeloPng(resultado, parsed.diseno, matriz, opciones)
    expect(m.operadores).toHaveLength(3)
    expect(m.operadores[1].sesgo).toMatch(/^-?\d+\.\d µm$/)
  })

  it('traduce las etiquetas al inglés', () => {
    const m = construirModeloPng(resultado, parsed.diseno, matriz, { ...opciones, lang: 'en' })
    expect(m.veredicto.texto).toBe('CONDITIONALLY ACCEPTABLE')
    expect(m.etiquetas.componentes).toBe('Components of variation')
    expect(m.pie).toContain('GageFlow')
  })

  it('sin nominal el sesgo queda vacío', () => {
    const m = construirModeloPng(resultado, parsed.diseno, matriz, { ...opciones, nominal: undefined })
    expect(m.operadores[0].sesgo).toBe('—')
  })
})
