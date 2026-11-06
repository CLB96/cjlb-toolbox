import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('../app/useRoute', () => ({ useRoute: () => ({ route: 'home', navigate }) }))
vi.mock('../persistence/snapshotStore', () => ({ latestPerTool: vi.fn().mockResolvedValue([]), markFreshStart: vi.fn() }))
const toastFn = vi.hoisted(() => vi.fn())
vi.mock('../ui/toastStore', () => ({ toast: toastFn }))
const badgeApi = vi.hoisted(() => ({ useToolBadges: vi.fn(), saveBadge: vi.fn() }))
vi.mock('./badgeService', () => badgeApi)
const prefs = vi.hoisted(() => ({ loadPreference: vi.fn(), savePreference: vi.fn() }))
vi.mock('../persistence/preferences', () => prefs)

import { HomePage } from './HomePage'
import { SessionProvider } from '../auth/session'
import { UidProvider } from '../persistence/uidContext'

const DEFAULT = ['gantt', 'gapcheck', 'bondline', 'capaflow', 'vectorizr', 'gageflow', 'quicknesting']
const user1 = { uid: 'u1', email: 'a@b.com', displayName: 'Ana', emailVerified: true }

function renderHome(isAdmin = false) {
  return render(
    <SessionProvider session={{ user: user1, isAdmin }}>
      <UidProvider uid="u1">
        <HomePage />
      </UidProvider>
    </SessionProvider>,
  )
}
const cardIds = () => screen.getAllByTestId('tool-card').map((c) => c.getAttribute('data-tool-id'))
const card = (id: string) => screen.getAllByTestId('tool-card').find((c) => c.getAttribute('data-tool-id') === id)!

beforeEach(() => {
  vi.clearAllMocks()
  badgeApi.useToolBadges.mockReturnValue({})
  badgeApi.saveBadge.mockResolvedValue(undefined)
  prefs.loadPreference.mockResolvedValue(undefined)
  prefs.savePreference.mockResolvedValue(undefined)
})

describe('orden por usuario', () => {
  test('aplica el orden guardado del usuario y agrega al final las herramientas que falten', async () => {
    prefs.loadPreference.mockResolvedValue(['quicknesting', 'gantt', 'quitada'])
    renderHome()
    await waitFor(() => expect(cardIds()[0]).toBe('quicknesting'))
    expect(prefs.loadPreference).toHaveBeenCalledWith('u1', 'homeOrder')
    expect(cardIds()).toEqual(['quicknesting', 'gantt', 'gapcheck', 'bondline', 'capaflow', 'vectorizr', 'gageflow'])
  })

  test('fuera de Personalizar no hay controles y la tarjeta abre la herramienta', async () => {
    const user = userEvent.setup()
    renderHome()
    expect(screen.queryByRole('button', { name: /Mover/ })).toBeNull()
    expect(screen.queryByText(/Arrastra las tarjetas/)).toBeNull()
    await user.click(within(card('gantt')).getByText('Gantt Tracker'))
    expect(navigate).toHaveBeenCalledWith('gantt')
  })

  test('con flechas mueve la tarjeta, guarda el orden y conserva el foco', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    expect(screen.getByText('Arrastra las tarjetas o usa las flechas para cambiar el orden. El orden solo cambia para ti.')).toBeInTheDocument()
    expect(within(card('gantt')).getByText('Posición 1 de 7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mover antes: Gantt Tracker' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Mover después: Gantt Tracker' }))
    expect(cardIds().slice(0, 2)).toEqual(['gapcheck', 'gantt'])
    expect(prefs.savePreference).toHaveBeenLastCalledWith('u1', 'homeOrder', ['gapcheck', 'gantt', ...DEFAULT.slice(2)])
    expect(screen.getByRole('button', { name: 'Mover después: Gantt Tracker' })).toHaveFocus()
    expect(within(card('gantt')).getByText('Posición 2 de 7')).toBeInTheDocument()
  })

  test('en Personalizar la tarjeta no abre la herramienta; Listo vuelve al modo normal', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    await user.click(within(card('gantt')).getByText('Gantt Tracker'))
    expect(navigate).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Listo' }))
    expect(screen.queryByRole('button', { name: /Mover/ })).toBeNull()
  })

  test('arrastrar una tarjeta sobre otra la reubica y guarda', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    const data = { effectAllowed: '', dropEffect: '', setData: vi.fn() }
    fireEvent.dragStart(card('quicknesting'), { dataTransfer: data })
    fireEvent.dragOver(card('gapcheck'), { dataTransfer: data })
    expect(card('gapcheck')).toHaveClass('tool-card--target')
    fireEvent.drop(card('gapcheck'), { dataTransfer: data })
    expect(cardIds()).toEqual(['gantt', 'quicknesting', 'gapcheck', 'bondline', 'capaflow', 'vectorizr', 'gageflow'])
    expect(prefs.savePreference).toHaveBeenLastCalledWith('u1', 'homeOrder', cardIds())
  })

  test('Restablecer orden vuelve al orden de tools.json y borra el guardado', async () => {
    prefs.loadPreference.mockResolvedValue(['quicknesting'])
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(cardIds()[0]).toBe('quicknesting'))
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    await user.click(screen.getByRole('button', { name: 'Restablecer orden' }))
    expect(cardIds()).toEqual(DEFAULT)
    expect(prefs.savePreference).toHaveBeenLastCalledWith('u1', 'homeOrder', null)
  })

  test('si no se puede guardar el orden avisa con un toast', async () => {
    prefs.savePreference.mockRejectedValue(new Error('x'))
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    await user.click(screen.getByRole('button', { name: 'Mover después: Gantt Tracker' }))
    await waitFor(() => expect(toastFn).toHaveBeenCalledWith('error', 'No se pudo guardar el orden.'))
  })
})

describe('insignias del admin', () => {
  test('las insignias guardadas reemplazan a las de tools.json para todos', () => {
    badgeApi.useToolBadges.mockReturnValue({ gantt: 'updated', capaflow: null })
    renderHome()
    expect(badgeApi.useToolBadges).toHaveBeenCalledWith(true)
    expect(within(card('gantt')).getByText('Actualizado')).toBeInTheDocument()
    expect(within(card('capaflow')).queryByText('Nuevo')).toBeNull()
    expect(within(card('gageflow')).getByText('Nuevo')).toBeInTheDocument()
  })

  test('un usuario normal no ve el control de insignias', async () => {
    const user = userEvent.setup()
    renderHome(false)
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    expect(screen.queryByText('Insignia (la ven todos)')).toBeNull()
    expect(screen.queryByText(/verán todos los usuarios/)).toBeNull()
  })

  test('el admin cambia y quita insignias, y se guardan', async () => {
    const user = userEvent.setup()
    renderHome(true)
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    expect(screen.getByText(/Las insignias que cambies las verán todos los usuarios\./)).toBeInTheDocument()
    const gantt = within(within(card('gantt')).getByRole('group', { name: 'Insignia (la ven todos)' }))
    expect(gantt.getByRole('radio', { name: 'Sin insignia' })).toBeChecked()
    await user.click(gantt.getByRole('radio', { name: 'Actualizado' }))
    expect(badgeApi.saveBadge).toHaveBeenCalledWith('gantt', 'updated')
    const capa = within(within(card('capaflow')).getByRole('group', { name: 'Insignia (la ven todos)' }))
    expect(capa.getByRole('radio', { name: 'Nuevo' })).toBeChecked()
    await user.click(capa.getByRole('radio', { name: 'Sin insignia' }))
    expect(badgeApi.saveBadge).toHaveBeenCalledWith('capaflow', null)
  })

  test('si no se puede guardar la insignia avisa con un toast', async () => {
    badgeApi.saveBadge.mockRejectedValue(new Error('denied'))
    const user = userEvent.setup()
    renderHome(true)
    await user.click(screen.getByRole('button', { name: 'Personalizar' }))
    await user.click(within(card('gantt')).getByRole('radio', { name: 'Nuevo' }))
    await waitFor(() => expect(toastFn).toHaveBeenCalledWith('error', 'No se pudo guardar la insignia.'))
  })
})
