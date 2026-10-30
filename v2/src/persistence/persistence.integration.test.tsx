import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clear, createStore } from 'idb-keyval'
import { useRef, useState } from 'react'
import { AppShell } from '../app/AppShell'
import { TOOLS } from '../tools/registry'
import type { ToolDef, ToolProps } from '../tools/types'
import { UidProvider } from './uidContext'
import { listSnapshots, loadSnapshot } from './snapshotStore'
import { usePersistentTool } from './usePersistentTool'

type State = { count: number }

/** Herramienta mínima que sigue el contrato: getSnapshot lee de una ref, reset la actualiza. */
function DummyTool({ toolId }: ToolProps) {
  const [count, setCount] = useState(0)
  const ref = useRef(0)
  const apply = (n: number) => {
    ref.current = n
    setCount(n)
  }
  const p = usePersistentTool<State>(toolId, {
    getSnapshot: () => ({ count: ref.current }),
    restore: (s) => apply(s.count),
    reset: () => apply(0),
  })
  return (
    <div>
      <span data-testid="dummy-count">{count}</span>
      <button
        disabled={!p.restored}
        onClick={() => {
          apply(ref.current + 1)
          p.markDirty()
        }}
      >
        sumar
      </button>
    </div>
  )
}

const tools: ToolDef[] = TOOLS.map((d) =>
  d.id === 'gapcheck' ? { ...d, load: async () => ({ default: DummyTool }) } : d,
)

const ui = () => (
  <UidProvider uid="u1">
    <AppShell tools={tools} />
  </UidProvider>
)

async function history(): Promise<State[]> {
  const metas = await listSnapshots('u1', 'gapcheck')
  const snaps = await Promise.all(metas.map((m) => loadSnapshot<State>('u1', 'gapcheck', m.id)))
  return snaps.map((s) => s!.data)
}

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  window.location.hash = '#/home'
})

test('editar → Volver; Empezar de cero en la herramienta abierta; remontar restaura', async () => {
  const user = userEvent.setup()
  const { unmount } = render(ui())
  expect(screen.queryByText('¿Volver donde lo dejaste?')).toBeNull()

  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  const add = await screen.findByRole('button', { name: 'sumar' })
  await waitFor(() => expect(add).toBeEnabled())
  await user.click(add)
  await user.click(add)
  expect(screen.getByTestId('dummy-count')).toHaveTextContent('2')

  // menos de 60 s después: al ir a Inicio la herramienta aparece en "Volver"
  await user.click(screen.getByRole('tab', { name: 'Inicio' }))
  const resume = await screen.findByRole('region', { name: '¿Volver donde lo dejaste?' })
  expect(within(resume).getByText('Análisis GapCheck')).toBeInTheDocument()

  // "Empezar de cero" con la herramienta keep-alive: resetea y deja el estado previo en el historial
  await user.click(within(resume).getByRole('button', { name: 'Empezar de cero' }))
  await waitFor(() => expect(window.location.hash).toBe('#/gapcheck'))
  expect(screen.getByTestId('dummy-count')).toHaveTextContent('0')
  expect((await history()).slice(0, 2)).toEqual([{ count: 0 }, { count: 2 }])

  await user.click(screen.getByRole('button', { name: 'sumar' }))
  expect(screen.getByTestId('dummy-count')).toHaveTextContent('1')

  // desmontar guarda lo pendiente; al remontar se restaura
  unmount()
  await waitFor(async () => expect((await history())[0]).toEqual({ count: 1 }))
  render(ui())
  await waitFor(() => expect(screen.getByTestId('dummy-count')).toHaveTextContent('1'))
})
