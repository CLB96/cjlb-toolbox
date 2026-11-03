import { useState, type ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetI18nForTests, useI18n } from '../../../i18n/useI18n'
import { GageflowStoreProvider, useGageflowApi } from '../GageflowStoreProvider'
import { Review } from '../components/Review'
import type { Cell } from '../logic/parse'
import type { GageflowApi } from '../store'

const CAB: Cell[] = ['Pieza', 'Operador', 'Ensayo', 'Valor']

function filas(): Cell[][] {
  const salida: Cell[][] = [CAB]
  for (let p = 1; p <= 5; p++) {
    for (const o of ['Ana', 'Luis']) for (const e of [1, 2]) salida.push([String(p), o, e, 2.5 + p / 100])
  }
  return salida
}

function Sembrar({ grid, children }: { grid: Cell[][]; children: ReactNode }) {
  const api: GageflowApi = useGageflowApi()
  useState(() => { api.getState().cargarArchivo(grid, 'datos.xlsx', 'Datos') })
  return <>{children}</>
}

function Idioma() {
  const { setLang } = useI18n()
  return <button onClick={() => setLang('en')}>en</button>
}

function montar(grid: Cell[][], onCambiar = vi.fn()) {
  render(
    <GageflowStoreProvider>
      <Sembrar grid={grid}>
        <Idioma />
        <Review onCambiar={onCambiar} />
      </Sembrar>
    </GageflowStoreProvider>,
  )
  return onCambiar
}

describe('revisión del archivo', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
  })

  it('muestra el error con su fila, en español', () => {
    const grid = filas()
    grid[3][3] = 'abc'
    montar(grid)
    expect(screen.getByText('fila 4: "abc" no es un número. Quita unidades y símbolos.')).toBeTruthy()
  })

  it('muestra el mismo error en inglés al cambiar de idioma', () => {
    const grid = filas()
    grid[3][3] = 'abc'
    montar(grid)
    act(() => screen.getByText('en').click())
    expect(screen.getByText('row 4: "abc" is not a number. Remove units and symbols.')).toBeTruthy()
  })

  it('el archivo sin errores no lista ninguno', () => {
    montar(filas())
    expect(document.querySelectorAll('.gf-issue--mal')).toHaveLength(0)
  })

  it('el botón de cambiar archivo avisa al padre', () => {
    const onCambiar = montar(filas())
    act(() => screen.getByRole('button', { name: 'Cambiar archivo' }).click())
    expect(onCambiar).toHaveBeenCalledOnce()
  })
})
