import { describe, expect, it } from 'vitest'
import {
  aMatriz, aNumero, claveEtiqueta, compararNatural, construirDiseno, normalizar, parseGrid, type Cell,
} from '../logic/parse'

const CAB: Cell[] = ['Pieza', 'Operador', 'Ensayo', 'Valor']

function filas(n: number, operadores = ['Ana', 'Luis'], ensayos = [1, 2]): Cell[][] {
  const salida: Cell[][] = [CAB]
  for (let p = 1; p <= n; p++) {
    for (const o of operadores) for (const e of ensayos) salida.push([String(p), o, e, 2.5 + p / 100])
  }
  return salida
}

const codigos = (grid: Cell[][]) => parseGrid(grid).issues.map((i) => i.codigo)

describe('números y etiquetas', () => {
  it.each([
    [2.501, 2.501], ['2.501', 2.501], ['2,501', 2.501], [' 2.501 ', 2.501],
    ['1.234,5', 1234.5], ['1,234.5', 1234.5], ['-0,5', -0.5], ['.5', 0.5],
  ])('aNumero lee %s', (entrada, esperado) => {
    expect(aNumero(entrada)).toBe(esperado)
  })

  it.each([['2.5 mm'], ['abc'], [''], [null], [true], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    'aNumero rechaza %s', (entrada) => {
      expect(aNumero(entrada)).toBeNull()
    },
  )

  it('normaliza acentos, mayúsculas y signos', () => {
    expect(normalizar('  Nº. PIEZA ')).toBe('n pieza')
    expect(normalizar('Medición')).toBe('medicion')
  })

  it('compara etiquetas sin mayúsculas ni espacios de más', () => {
    expect(claveEtiqueta('  Operador   1 ')).toBe(claveEtiqueta('operador 1'))
  })

  it('ordena de forma natural', () => {
    expect(['A-10', 'A-2', 'A-1'].sort(compararNatural)).toEqual(['A-1', 'A-2', 'A-10'])
  })
})

describe('formato largo', () => {
  it('acepta encabezados en inglés y en otro orden', () => {
    const r = parseGrid([['Value', 'Trial', 'Operator', 'Part'], [2.5, 1, 'Ana', 'P1']])
    expect(r.lecturas[0]).toMatchObject({ pieza: 'P1', operador: 'Ana', ensayo: 1, valor: 2.5 })
  })

  it('encuentra el encabezado aunque haya filas de título', () => {
    const r = parseGrid([['Estudio X'], [], CAB, ['1', 'Ana', 1, 2.5]])
    expect(r.layout).toBe('long')
    expect(r.lecturas[0].fila).toBe(4)
  })

  it('el orden de las filas no cambia la matriz', () => {
    const base = filas(5)
    const revuelta = [base[0], ...base.slice(1).reverse()]
    const a = parseGrid(base)
    const b = parseGrid(revuelta)
    expect(aMatriz(b.lecturas, b.diseno)).toEqual(aMatriz(a.lecturas, a.diseno))
  })

  it('une operadores escritos con distinta caja o espacios', () => {
    const grid = filas(5)
    grid[2][1] = '  ANA '
    grid[1][1] = 'Ana'
    const r = parseGrid(grid)
    expect(r.diseno.operadores).toHaveLength(2)
    expect(r.ok).toBe(true)
  })

  it('acepta decimales con coma en el valor', () => {
    const grid = filas(5)
    grid[1][3] = '2,75'
    expect(parseGrid(grid).lecturas[0].valor).toBe(2.75)
  })

  it('ignora las filas en blanco', () => {
    const grid = filas(5)
    grid.splice(3, 0, [null, null, null, null])
    expect(parseGrid(grid).ok).toBe(true)
  })

  it('avisa una sola vez de datos fuera de las cuatro columnas', () => {
    const grid = filas(5).map((f, i) => (i === 0 ? f : [...f, 'nota']))
    const extra = parseGrid(grid).issues.filter((i) => i.codigo === 'COLUMNAS_EXTRA')
    expect(extra).toHaveLength(1)
    expect(extra[0].severidad).toBe('aviso')
    expect(parseGrid(grid).ok).toBe(true)
  })

  it('señala la fila de Excel del valor no numérico', () => {
    const grid = filas(5)
    grid[4][3] = '2.5 mm'
    const i = parseGrid(grid).issues.find((x) => x.codigo === 'VALOR_NO_NUMERICO')
    expect(i?.fila).toBe(5)
  })

  it.each([[0], [11], [1.5], ['x']])('rechaza el ensayo %s', (ensayo) => {
    const grid = filas(5)
    grid[1][2] = ensayo
    expect(codigos(grid)).toContain('ENSAYO_INVALIDO')
  })

  it('una plantilla sin rellenar dice que no hay valores, sin errores en cascada', () => {
    const grid = filas(3).map((f, i) => (i === 0 ? f : [f[0], f[1], f[2], null]))
    expect(codigos(grid)).toEqual(['SIN_VALORES'])
  })

  it('resume los valores vacíos a partir de diez', () => {
    const grid = filas(10).map((f, i) => (i > 0 && i <= 15 ? [f[0], f[1], f[2], null] : f))
    const vacios = parseGrid(grid).issues.filter((i) => i.codigo === 'VALOR_VACIO')
    expect(vacios).toHaveLength(11)
    expect(vacios[10].vars?.resto).toBe(5)
  })

  it('detiene la lectura al superar el máximo', () => {
    expect(parseGrid(filas(5), { maxLecturas: 4 }).issues.some((i) => i.codigo === 'MAXIMO')).toBe(true)
  })

  it('no valida el diseño si faltan columnas', () => {
    expect(codigos([['Pieza', 'Operador', 'Valor'], ['1', 'Ana', 2.5]])).toEqual(['COLUMNAS'])
  })
})

describe('diseño', () => {
  it('exige 2 operadores y 2 ensayos', () => {
    const c = codigos(filas(10, ['Ana'], [1]))
    expect(c).toContain('POCOS_OPERADORES')
    expect(c).toContain('POCOS_ENSAYOS')
  })

  it('con pocas piezas avisa, pero deja calcular', () => {
    const r = parseGrid(filas(3))
    const aviso = r.issues.find((i) => i.codigo === 'POCAS_PIEZAS')
    expect(aviso?.severidad).toBe('aviso')
    expect(r.ok).toBe(true)
  })

  it('rechaza más piezas u operadores que el máximo', () => {
    const muchos = Array.from({ length: 21 }, (_, i) => `Op ${i}`)
    expect(codigos(filas(2, muchos, [1, 2]))).toContain('MAXIMO')
    expect(codigos(filas(101, ['Ana', 'Luis'], [1, 2]))).toContain('MAXIMO')
  })

  it('construirDiseno ordena y quita duplicados', () => {
    const d = construirDiseno([
      { pieza: '10', operador: 'B', ensayo: 2 },
      { pieza: '2', operador: 'a', ensayo: 1 },
      { pieza: '2', operador: 'A', ensayo: 2 },
    ])
    expect(d).toEqual({ piezas: ['2', '10'], operadores: ['a', 'B'], ensayos: [1, 2] })
  })

  it('aMatriz deja en null lo que falta', () => {
    const d = { piezas: ['1'], operadores: ['Ana'], ensayos: [1, 2] }
    const m = aMatriz([{ pieza: '1', operador: 'ana', ensayo: 2, valor: 3, fila: 2 }], d)
    expect(m).toEqual([[[null, 3]]])
  })
})

describe('hoja AIAG', () => {
  const AIAG: Cell[][] = [
    ['Pieza', 'Ana', null, 'Luis', null],
    [null, 'E1', 'E2', 'E1', 'E2'],
    ...Array.from({ length: 5 }, (_, i): Cell[] => [String(i + 1), 2.5, 2.51, 2.49, 2.5 + i / 100]),
  ]

  it('pide confirmación antes de convertir y no lee nada', () => {
    const r = parseGrid(AIAG)
    expect(r.ok).toBe(false)
    expect(r.layout).toBe('wide')
    expect(r.lecturas).toEqual([])
    expect(r.ancho).toEqual({ operadores: ['Ana', 'Luis'], ensayos: 2 })
  })

  it('al confirmar convierte cada celda a una lectura', () => {
    const r = parseGrid(AIAG, { confirmarAncho: true })
    expect(r.ok).toBe(true)
    expect(r.lecturas).toHaveLength(20)
    expect(r.lecturas.find((l) => l.pieza === '5' && l.operador === 'Luis' && l.ensayo === 2)?.valor).toBeCloseTo(2.54)
  })

  it('al convertir señala las celdas que no son números', () => {
    const rota = AIAG.map((f) => [...f])
    rota[3][2] = 'x'
    expect(parseGrid(rota, { confirmarAncho: true }).issues.some((i) => i.codigo === 'VALOR_NO_NUMERICO')).toBe(true)
  })
})
