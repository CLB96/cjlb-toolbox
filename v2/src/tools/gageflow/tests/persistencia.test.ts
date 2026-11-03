import { describe, expect, it } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { crearAdaptadorGageflow, crearGageflowStore } from '../store'
import type { Cell } from '../logic/parse'

function grid(): Cell[][] {
  return csv.trim().split(/\r?\n/).map((linea) => linea.split(',').map((c, i) => {
    if (i < 2) return c
    const n = Number(c)
    return Number.isFinite(n) && c.trim() !== '' ? n : c
  }))
}

const HOJA_AIAG: Cell[][] = [
  ['Pieza', 'Ana', null, 'Luis', null],
  [null, 'E1', 'E2', 'E1', 'E2'],
  ['1', 2.5, 2.51, 2.49, 2.5],
  ['2', 2.6, 2.61, 2.59, 2.6],
]

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

/** Simula una recarga: lo guardado pasa por JSON y entra en un store nuevo. */
function recargar(api: ReturnType<typeof crearGageflowStore>) {
  const guardado = JSON.parse(JSON.stringify(crearAdaptadorGageflow(api).getSnapshot()))
  const nuevo = crearGageflowStore()
  crearAdaptadorGageflow(nuevo).restore(guardado)
  return nuevo
}

describe('persistencia de GageFlow', () => {
  it('un estudio válido se recalcula igual al recargar', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(grid(), 'a.xlsx')
    const nuevo = recargar(api).getState()
    expect(nuevo.archivo?.nombre).toBe('a.xlsx')
    expect(nuevo.lecturas).toHaveLength(90)
    expect(nuevo.resultado?.pctGrrTolerancia).toBeCloseTo(19.125, 2)
    expect(nuevo.avisos).toEqual([])
  })

  it('un archivo con errores los sigue mostrando al recargar', () => {
    const api = estudioListo()
    const rota = grid()
    rota[5][3] = null
    api.getState().cargarArchivo(rota, 'rota.xlsx')
    const nuevo = recargar(api).getState()
    expect(nuevo.archivo?.nombre).toBe('rota.xlsx')
    expect(nuevo.resultado).toBeNull()
    expect(nuevo.issues.some((i) => i.codigo === 'VALOR_VACIO')).toBe(true)
  })

  it('una hoja AIAG sin confirmar vuelve al paso de carga, sin diálogo sin datos', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(HOJA_AIAG, 'aiag.xlsx')
    expect(api.getState().anchoPendiente).not.toBeNull()
    const nuevo = recargar(api).getState()
    expect(nuevo.archivo).toBeNull()
    expect(nuevo.anchoPendiente).toBeNull()
    expect(nuevo.issues).toEqual([])
    expect(nuevo.estudio.pieza).toBe('A-12')
  })

  it('restaurar una versión limpia un diálogo AIAG abierto', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(grid(), 'a.xlsx')
    const guardado = crearAdaptadorGageflow(api).getSnapshot()
    api.getState().cargarArchivo(HOJA_AIAG, 'aiag.xlsx')
    crearAdaptadorGageflow(api).restore(guardado)
    expect(api.getState().anchoPendiente).toBeNull()
    expect(api.getState().archivo?.nombre).toBe('a.xlsx')
  })

  it('acepta versiones guardadas sin la lista de errores', () => {
    const api = crearGageflowStore()
    const { issues: _sinIssues, ...antiguo } = crearAdaptadorGageflow(estudioListo()).getSnapshot()
    crearAdaptadorGageflow(api).restore(antiguo as never)
    expect(api.getState().issues).toEqual([])
    expect(api.getState().estudio.pieza).toBe('A-12')
  })

  it('reset deja el estado inicial', () => {
    const api = estudioListo()
    api.getState().cargarArchivo(grid(), 'a.xlsx')
    crearAdaptadorGageflow(api).reset()
    const s = api.getState()
    expect(s.archivo).toBeNull()
    expect(s.resultado).toBeNull()
    expect(s.issues).toEqual([])
    expect(s.estudio.pieza).toBe('')
  })
})
