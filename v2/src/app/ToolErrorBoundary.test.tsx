import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { TOOLS } from '../tools/registry'
import type { ToolDef, ToolProps } from '../tools/types'
import { useToasts } from '../ui/toastStore'

let shouldThrow = true
function Crashy({ toolId }: ToolProps) {
  if (shouldThrow) throw new Error('boom')
  return <p>ok-{toolId}</p>
}
function Fine({ toolId }: ToolProps) {
  return <p>fine-{toolId}</p>
}

let importFails = true
const tools: ToolDef[] = TOOLS.map((d) => {
  if (d.id === 'gapcheck') return { ...d, load: async () => ({ default: Crashy }) }
  if (d.id === 'bondline') return { ...d, load: async () => ({ default: Fine }) }
  if (d.id === 'capaflow') {
    return {
      ...d,
      load: () => (importFails ? Promise.reject(new Error('chunk')) : Promise.resolve({ default: Fine })),
    }
  }
  return d
})

const panelOf = (el: HTMLElement) => el.closest('[role=tabpanel]') as HTMLElement

beforeEach(() => {
  window.location.hash = '#/home'
  shouldThrow = true
  importFails = true
  useToasts.setState({ toasts: [] })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

test('una herramienta que lanza muestra el panel de error, un toast, y el resto sigue montado', async () => {
  const user = userEvent.setup()
  render(<AppShell tools={tools} />)
  await user.click(screen.getByRole('tab', { name: /Bondline/i }))
  expect(await screen.findByText('fine-bondline')).toBeInTheDocument()

  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  const retry = await screen.findByRole('button', { name: 'Reintentar' })
  expect(within(panelOf(retry)).getByText('Esta herramienta tuvo un problema.')).toBeInTheDocument()
  expect(useToasts.getState().toasts.filter((t) => t.kind === 'error')).toHaveLength(1)
  expect(screen.getByText('fine-bondline')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Inicio' })).toBeInTheDocument()

  shouldThrow = false
  await user.click(retry)
  expect(await screen.findByText('ok-gapcheck')).toBeInTheDocument()
  expect(screen.getByText('fine-bondline')).toBeInTheDocument()
})

test('un import perezoso que rechaza muestra el error y Reintentar vuelve a importar', async () => {
  const user = userEvent.setup()
  render(<AppShell tools={tools} />)
  await user.click(screen.getByRole('tab', { name: /CapaFlow/i }))
  const retry = await screen.findByRole('button', { name: 'Reintentar' })
  await waitFor(() => expect(useToasts.getState().toasts.filter((t) => t.kind === 'error')).toHaveLength(1))
  importFails = false
  await user.click(retry)
  expect(await screen.findByText('fine-capaflow')).toBeInTheDocument()
})
