import { buildResumeItems } from './resume'
import type { SnapshotMeta } from '../persistence/snapshotStore'
import type { ToolId } from '../app/routes'

const NOW = 1_800_000_000_000
const meta = (toolId: ToolId, ago: number): SnapshotMeta => ({
  id: `u:${toolId}:${ago}`,
  uid: 'u',
  toolId,
  savedAt: NOW - ago,
})

test('devuelve máximo 3 items ordenados del más reciente', () => {
  const metas = [
    meta('gantt', 5 * 3_600_000),
    meta('gapcheck', 25 * 60_000),
    meta('bondline', 2 * 3_600_000),
    meta('capaflow', 3 * 86_400_000),
    meta('vectorizr', 40 * 3_600_000),
  ]
  const items = buildResumeItems(metas, NOW, 'es')
  expect(items.map((i) => i.toolId)).toEqual(['gapcheck', 'bondline', 'gantt'])
  expect(items[0]).toEqual({ toolId: 'gapcheck', label: 'Análisis GapCheck', ago: 'hace 25 min' })
})

test.each([
  [10_000, 'hace un momento', 'just now'],
  [25 * 60_000, 'hace 25 min', '25 min ago'],
  [2 * 3_600_000, 'hace 2 h', '2 h ago'],
  [30 * 3_600_000, 'ayer', 'yesterday'],
  [3 * 86_400_000, 'hace 3 días', '3 days ago'],
])('tiempo relativo %i ms', (ago, es, en) => {
  expect(buildResumeItems([meta('gantt', ago)], NOW, 'es')[0]?.ago).toBe(es)
  expect(buildResumeItems([meta('gantt', ago)], NOW, 'en')[0]?.ago).toBe(en)
})
