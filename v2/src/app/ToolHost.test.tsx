import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { registerTool } from '../persistence/flushRegistry'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'

// keep-alive se prueba con el Placeholder (contador) también en GapCheck y Bondline, ya portadas
const tools: ToolDef[] = TOOLS.map((d) =>
  d.id === 'gapcheck' || d.id === 'bondline' ? { ...d, load: () => import('../tools/Placeholder') } : d,
)

beforeEach(() => {
  window.location.hash = '#/home'
})

test('keep-alive: conserva el estado al volver y no monta herramientas sin visitar', async () => {
  const user = userEvent.setup()
  render(<AppShell tools={tools} />)
  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  const counter = await screen.findByTestId('counter-gapcheck')
  const btn = counter.closest('button')!
  await user.click(btn)
  await user.click(btn)
  await user.click(btn)
  expect(counter).toHaveTextContent('3')
  expect(screen.queryByTestId('counter-bondline')).toBeNull()

  await user.click(screen.getByRole('tab', { name: /Bondline/i }))
  await screen.findByTestId('counter-bondline')
  expect(screen.getByTestId('counter-gapcheck').closest('[role=tabpanel]')).toHaveAttribute('hidden')

  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  expect(screen.getByTestId('counter-gapcheck')).toHaveTextContent('3')
  expect(within(screen.getByTestId('counter-gapcheck').closest('[role=tabpanel]')!)).toBeDefined()
})

test('onToolSwitch: de A a B se invoca el flush de A; desde home no se invoca ninguno', async () => {
  const flushGap = vi.fn().mockResolvedValue(undefined)
  const flushBond = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(<AppShell tools={tools} />)
  // se registran tras montar Home (Home hace flushAll al montarse)
  const off1 = registerTool('gapcheck', { uid: 'local', flush: flushGap, startFresh: vi.fn() })
  const off2 = registerTool('bondline', { uid: 'local', flush: flushBond, startFresh: vi.fn() })
  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  await screen.findByTestId('counter-gapcheck')
  expect(flushGap).not.toHaveBeenCalled()
  expect(flushBond).not.toHaveBeenCalled()
  await user.click(screen.getByRole('tab', { name: /Bondline/i }))
  await screen.findByTestId('counter-bondline')
  expect(flushGap).toHaveBeenCalledTimes(1)
  expect(flushBond).not.toHaveBeenCalled()
  off1()
  off2()
})
