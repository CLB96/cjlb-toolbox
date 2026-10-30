import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { registerFlush } from '../persistence/flushRegistry'

beforeEach(() => {
  window.location.hash = '#/home'
})

test('keep-alive: conserva el estado al volver y no monta herramientas sin visitar', async () => {
  const user = userEvent.setup()
  render(<AppShell />)
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
  const off1 = registerFlush('gapcheck', flushGap)
  const off2 = registerFlush('bondline', flushBond)
  const user = userEvent.setup()
  render(<AppShell />)
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
