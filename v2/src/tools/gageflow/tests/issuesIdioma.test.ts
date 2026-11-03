import { describe, expect, it } from 'vitest'
import { issueTexto, avisoTexto, MENSAJES_ISSUE } from '../i18nIssues'
import { parseGrid, type Cell } from '../logic/parse'
import { compararDiseno, type EstudioNormalizado } from '../logic/estudioForm'

const CAB: Cell[] = ['Pieza', 'Operador', 'Ensayo', 'Valor']

function filas(n: number, operadores = ['Ana', 'Luis'], ensayos = [1, 2]): Cell[][] {
  const salida: Cell[][] = [CAB]
  for (let p = 1; p <= n; p++) {
    for (const o of operadores) for (const e of ensayos) salida.push([String(p), o, e, 2.5 + p / 100])
  }
  return salida
}

const textos = (grid: Cell[][], lang: 'es' | 'en') =>
  parseGrid(grid).issues.map((i) => issueTexto(i, lang))

describe('avisos del lector en cada idioma', () => {
  it('ambos idiomas tienen las mismas claves', () => {
    expect(Object.keys(MENSAJES_ISSUE.en).sort()).toEqual(Object.keys(MENSAJES_ISSUE.es).sort())
  })

  it('ambos idiomas usan las mismas variables en cada mensaje', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const k of Object.keys(MENSAJES_ISSUE.es) as (keyof typeof MENSAJES_ISSUE.es)[]) {
      expect(vars(MENSAJES_ISSUE.en[k])).toEqual(vars(MENSAJES_ISSUE.es[k]))
    }
  })

  it('conserva el texto original en español con sus datos', () => {
    const grid = filas(5)
    grid[3][3] = 'abc'
    expect(textos(grid, 'es')[0]).toBe('"abc" no es un número. Quita unidades y símbolos.')
  })

  it('traduce el mismo aviso al inglés con sus datos', () => {
    const grid = filas(5)
    grid[3][3] = 'abc'
    expect(textos(grid, 'en')[0]).toBe('"abc" is not a number. Remove units and symbols.')
  })

  it('nombra las columnas que faltan en el idioma activo', () => {
    const grid: Cell[][] = [['Pieza', 'Operador', 'Valor'], ['1', 'Ana', 2.5]]
    expect(textos(grid, 'es')[0]).toBe('Faltan columnas obligatorias: ensayo. La hoja debe tener Pieza, Operador, Ensayo y Valor.')
    expect(textos(grid, 'en')[0]).toContain(': trial.')
  })

  it('lista los huecos del diseño en el idioma activo', () => {
    const grid = filas(5).filter((f) => !(f[0] === '2' && f[1] === 'Luis' && f[2] === 2))
    expect(textos(grid, 'es')[0]).toBe('Faltan 1 lecturas (2 / Luis / ensayo 2).')
    expect(textos(grid, 'en')[0]).toContain('2 / Luis / trial 2')
  })

  it('abrevia los huecos a partir de cinco', () => {
    const cinco = filas(5).filter((f) => !(f[1] === 'Luis' && f[2] === 2))
    expect(textos(cinco, 'es')[0]).toMatch(/^Faltan 5 lecturas \(.*ensayo 2\)\.$/)
    const siete = filas(7).filter((f) => !(f[1] === 'Luis' && f[2] === 2))
    expect(textos(siete, 'es')[0]).toMatch(/^Faltan 7 lecturas \(.*…\)\.$/)
  })

  it('el plural de ensayos faltantes respeta el original', () => {
    const uno = filas(5, ['Ana', 'Luis'], [1, 3])
    const dos = filas(5, ['Ana', 'Luis'], [1, 4])
    expect(textos(uno, 'es').join()).toContain('Los ensayos deben ir de 1 a 3; falta 2.')
    expect(textos(dos, 'es').join()).toContain('Los ensayos deben ir de 1 a 4; faltan 2, 3.')
  })

  it('la hoja vacía dice que está vacía', () => {
    expect(textos([], 'es')).toEqual(['La hoja está vacía.'])
    expect(textos([], 'en')).toEqual(['The sheet is empty.'])
  })

  it('ningún mensaje queda con variables sin rellenar', () => {
    const casos: Cell[][][] = [
      [],
      [['x', 'y'], [1, 2]],
      [CAB, ['', 'Ana', 1, 2.5]],
      [CAB, ['1', '', 1, 2.5]],
      [CAB, ['1', 'Ana', 99, 2.5]],
      [CAB, ['1', 'Ana', 1, null]],
      filas(1, ['Ana'], [1]),
    ]
    for (const c of casos) {
      for (const lang of ['es', 'en'] as const) {
        for (const t of textos(c, lang)) expect(t).not.toMatch(/\{\w+\}/)
      }
    }
  })

  it('los avisos de diseño salen en el idioma activo', () => {
    const estudio = { piezas: ['1'], operadores: ['Ana', 'Luis'], ensayos: 2 } as unknown as EstudioNormalizado
    const a = compararDiseno(estudio, { piezas: 10, operadores: ['Ana', 'Luis', 'Eva'], ensayos: 3 })
    expect(a.map((x) => avisoTexto(x, 'es'))).toEqual([
      'El archivo tiene 10 piezas y el formulario 1.',
      'El archivo tiene 3 operadores y el formulario 2.',
      'El archivo tiene 3 ensayos y el formulario 2.',
    ])
    expect(avisoTexto(a[0], 'en')).toBe('The file has 10 parts and the form 1.')
  })
})
