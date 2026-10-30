import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { AppShell } from '../app/AppShell'
import { getTool, resolveRoute, TOOLS } from './registry'
import type { ToolDef } from './types'
vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', email: 'a@b.com', displayName: 'Ana', emailVerified: true } }),
}))

const holdTool: ToolDef = { ...getTool('vectorizr'), id: 'vectorizr', status: 'hold', holdLabelEs: 'Próximamente' }
const tools: ToolDef[] = [...TOOLS.filter((t) => t.id !== 'vectorizr'), holdTool]

test('registro expone las 5 herramientas activas', () => {
  expect(TOOLS.map((t) => t.id)).toEqual(['gantt', 'gapcheck', 'bondline', 'capaflow', 'vectorizr'])
})

test('herramienta en hold: tab deshabilitado con etiqueta', () => {
  window.location.hash = '#/home'
  render(createElement(AppShell, { tools }))
  const tab = screen.getByRole('tab', { name: /Próximamente/ })
  expect(tab).toHaveAttribute('aria-disabled', 'true')
})

test('ruta a herramienta en hold redirige a home', () => {
  expect(resolveRoute('vectorizr', tools)).toBe('home')
  window.location.hash = '#/vectorizr'
  render(createElement(AppShell, { tools }))
  expect(window.location.hash).toBe('#/home')
})
