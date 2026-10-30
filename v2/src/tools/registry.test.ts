import { render } from '@testing-library/react'
import { createElement } from 'react'
import { AppShell } from '../app/AppShell'
import { getTool, resolveRoute, TOOLS } from './registry'
import type { ToolDef } from './types'

const holdTool: ToolDef = { ...getTool('vectorizr'), id: 'vectorizr', status: 'hold', holdLabelEs: 'Próximamente' }
const tools: ToolDef[] = [...TOOLS.filter((t) => t.id !== 'vectorizr'), holdTool]

test('ruta a herramienta en hold redirige a home', () => {
  expect(resolveRoute('vectorizr', tools)).toBe('home')
  window.location.hash = '#/vectorizr'
  render(createElement(AppShell, { tools }))
  expect(window.location.hash).toBe('#/home')
})
