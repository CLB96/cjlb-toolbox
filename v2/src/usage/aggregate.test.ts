import { aggregateUsage } from './aggregate'
import type { SessionDoc } from './usageService'

const s = (email: string, name: string, tool: string, activeSeconds: number, lastBeat = 1000): SessionDoc => ({
  id: email + tool,
  uid: 'u-' + email,
  email,
  name,
  tool,
  start: 0,
  lastBeat,
  activeSeconds,
})

test('agrega horas por persona y herramienta, ordenado por horas desc', () => {
  const r = aggregateUsage([
    s('ana@x.com', 'Ana', 'gapcheck', 3600, 500),
    s('ana@x.com', 'Ana', 'bondline', 1800, 900),
    s('bob@x.com', 'Bob', 'gantt', 7200, 100),
  ])
  expect(r.users.map((u) => u.email)).toEqual(['bob@x.com', 'ana@x.com'])
  const ana = r.users[1]
  expect(ana.totalHours).toBe(1.5)
  expect(ana.byTool.gapcheck).toBe(1.0)
  expect(ana.byTool.bondline).toBe(0.5)
  expect(ana.lastSeen).toBe(900)
  expect(r.byTool).toEqual({ gapcheck: 1, bondline: 0.5, gantt: 2 })
})

test('home y usage cuentan en totalHours pero no como herramienta', () => {
  const r = aggregateUsage([s('ana@x.com', 'Ana', 'home', 1800), s('ana@x.com', 'Ana', 'usage', 1800)])
  expect(r.users[0].totalHours).toBe(1)
  expect(r.users[0].byTool).toEqual({})
  expect(r.byTool).toEqual({})
})

test('sin sesiones devuelve vacío', () => {
  expect(aggregateUsage([])).toEqual({ users: [], byTool: {} })
})
