import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { GapcheckStoreProvider, useGapcheckApi } from '../GapcheckStoreProvider'
import type { GapcheckApi } from '../store'
import { DataTable } from './DataTable'

let api: GapcheckApi
function Grab() {
  api = useGapcheckApi()
  return null
}

function setup() {
  return render(
    <GapcheckStoreProvider>
      <Grab />
      <DataTable />
    </GapcheckStoreProvider>,
  )
}

// objetivo por defecto = appliedTarget; valores: cumple / cerca / no cumple / vacío
function load(rows: unknown[][]) {
  act(() => {
    api.getState().loadRows('a.xlsx', rows as never)
  })
}

beforeEach(() => {
  localStorage.clear()
  __resetI18nForTests()
})

test('colapsada por defecto, el encabezado alterna con aria-expanded', () => {
  setup()
  load([['P1'], [0], [0.2]])
  const btn = screen.getByRole('button', { name: /Tabla de Datos/ })
  expect(btn).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('table')).toBeNull()
  fireEvent.click(btn)
  expect(btn).toHaveAttribute('aria-expanded', 'true')
  expect(api.getState().tableOpen).toBe(true)
  expect(screen.getByRole('table')).toBeInTheDocument()
})

test('abierta: columnas, filas en orden, valor crudo, objetivo y estado', () => {
  setup()
  load([['P1', 'P2'], [0, 0], [99]])
  act(() => api.getState().setTableOpen(true))
  const target = api.getState().appliedTarget
  const heads = screen.getAllByRole('columnheader').map((h) => h.textContent)
  expect(heads).toEqual(['Punto', 'Iteración', 'Valor', 'Objetivo', 'Estado'])
  const rows = screen.getAllByRole('row').slice(1)
  expect(rows).toHaveLength(3)
  const cells = (r: HTMLElement) => within(r).getAllByRole('cell').map((c) => c.textContent)
  expect(cells(rows[0])).toEqual(['P1', '1', '0', `${target.toFixed(2)} mm`, '✅ Cumple'])
  expect(cells(rows[1])[1]).toBe('2')
  expect(cells(rows[1])[4]).toBe('❌ No cumple')
  expect(cells(rows[2])[0]).toBe('P2')
  expect(within(rows[0]).getByText('✅ Cumple')).toHaveClass('gc-status--good')
  expect(within(rows[1]).getByText('❌ No cumple')).toHaveClass('gc-status--danger')
})

test('respeta filtros visibles y omite valores vacíos', () => {
  setup()
  load([['P1', 'P2'], [0, 0], [0, 0]])
  act(() => {
    api.getState().setTableOpen(true)
    api.getState().togglePoint(0)
    api.getState().toggleIter(0)
  })
  const rows = screen.getAllByRole('row').slice(1)
  expect(rows).toHaveLength(1)
  expect(within(rows[0]).getAllByRole('cell')[0].textContent).toBe('P2')
  expect(within(rows[0]).getAllByRole('cell')[1].textContent).toBe('2')
})

test('nombres con HTML se muestran como texto (R6) y hay contenedor con scroll', () => {
  const { container } = setup()
  load([['<b>X</b>'], [0]])
  act(() => api.getState().setTableOpen(true))
  expect(screen.getByText('<b>X</b>')).toBeInTheDocument()
  expect(container.querySelector('table b')).toBeNull()
  expect(container.querySelector('.gc-table-scroll')).not.toBeNull()
})

test('aria-controls solo cuando el cuerpo está en el DOM; emoji oculto a lectores', () => {
  setup()
  load([['P1'], [0], [0.2]])
  const btn = screen.getByRole('button', { name: /Tabla de Datos/ })
  expect(btn).not.toHaveAttribute('aria-controls')
  fireEvent.click(btn)
  expect(btn).toHaveAttribute('aria-controls', 'gc-table-body')
  expect(document.getElementById('gc-table-body')).not.toBeNull()
  const hidden = [...btn.querySelectorAll('[aria-hidden="true"]')].map((e) => e.textContent)
  expect(hidden).toContain('📋')
})
