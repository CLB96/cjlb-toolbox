import { describe, expect, it } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { crearGageflowStore } from '../store'
import type { Cell } from '../logic/parse'

function grid(): Cell[][] {
  return csv.trim().split(/\r?\n/).map((linea) => linea.split(',').map((c, i) => {
    if (i === 0 || i === 1) return c
    const n = Number(c)
    return Number.isFinite(n) && c.trim() !== '' ? n : c
  }))
}

function estudioListo() {
  const api = crearGageflowStore()
  api.getState().setCampo('pieza', 'A-12')
  api.getState().setCampo('caracteristica', 'Espesor')
  api.getState().setCampo('piezas', 10)
  api.getState().setOperador(0, 'Operador 1')
  api.getState().setOperador(1, 'Operador 2')
  api.getState().setOperador(2, 'Operador 3')
  api.getState().setCampo('lsl', '2.40')
  api.getState().setCampo('usl', '2.60')
  return api
}

describe('store de GageFlow', () => {
  it('arranca sin archivo ni resultado', () => {
    const s = crearGageflowStore().getState()
    expect(s.archivo).toBeNull()
    expect(s.resultado).toBeNull()
    expect(s.validacion.ok).toBe(false)
  })

  it('calcula al cargar el archivo', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(grid(), 'datos-grr.csv')
    const s = api.getState()
    expect(s.archivo?.nombre).toBe('datos-grr.csv')
    expect(s.lecturas).toHaveLength(90)
    expect(s.resultado?.ok).toBe(true)
    expect(s.resultado?.ndc).toBe(6)
  })

  it('recalcula al cambiar un límite', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(grid(), 'a.xlsx')
    const antes = api.getState().resultado?.pctGrrTolerancia ?? 0
    api.getState().setCampo('usl', '2.55')
    const despues = api.getState().resultado?.pctGrrTolerancia ?? 0
    expect(despues).toBeGreaterThan(antes)
  })

  it('no calcula si el archivo tiene errores', () => {
    const api = estudioListo()
    const rota = grid()
    rota[5][3] = null
    api.getState().cargarArchivo(rota, 'rota.xlsx')
    expect(api.getState().resultado).toBeNull()
    expect(api.getState().issues.some((i) => i.codigo === 'VALOR_VACIO')).toBe(true)
  })

  it('avisa cuando el archivo no coincide con el formulario', () => {
    const api = estudioListo()
    api.getState().setCampo('piezas', 12)
    api.getState().cargarArchivo(grid(), 'a.xlsx')
    expect(api.getState().avisos.length).toBeGreaterThan(0)
  })

  it('limpiar el archivo conserva el formulario', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(grid(), 'a.xlsx')
    api.getState().limpiarArchivo()
    expect(api.getState().resultado).toBeNull()
    expect(api.getState().estudio.pieza).toBe('A-12')
  })
})
