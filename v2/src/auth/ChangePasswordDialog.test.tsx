import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { __resetI18nForTests } from '../i18n/useI18n'

vi.mock('./authService', () => ({ authService: { changePassword: vi.fn() } }))

import { authService } from './authService'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { UserMenu } from './UserMenu'

vi.mock('../access/accessService', () => ({ usePendingCount: () => 0 }))

const svc = vi.mocked(authService)

async function fill(u: ReturnType<typeof userEvent.setup>, current: string, next: string, repeat: string) {
  await u.type(screen.getByLabelText('Contraseña actual'), current)
  await u.type(screen.getByLabelText('Contraseña nueva'), next)
  await u.type(screen.getByLabelText('Repite la contraseña nueva'), repeat)
  await u.click(screen.getByRole('button', { name: 'Guardar' }))
}

describe('cambiar contraseña', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
    svc.changePassword.mockReset()
  })

  it('guarda la nueva tras confirmar la actual', async () => {
    svc.changePassword.mockResolvedValue()
    const u = userEvent.setup()
    render(<ChangePasswordDialog open onClose={() => {}} />)
    await fill(u, 'vieja-123', 'nueva-1234', 'nueva-1234')
    expect(svc.changePassword).toHaveBeenCalledWith('vieja-123', 'nueva-1234')
    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument()
  })

  it('no envía si no coinciden o es corta', async () => {
    const u = userEvent.setup()
    render(<ChangePasswordDialog open onClose={() => {}} />)
    await fill(u, 'vieja-123', 'nueva-1234', 'otra-12345')
    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas nuevas no coinciden.')
    expect(svc.changePassword).not.toHaveBeenCalled()
  })

  it('contraseña actual incorrecta', async () => {
    svc.changePassword.mockRejectedValue({ code: 'auth/invalid-credential' })
    const u = userEvent.setup()
    render(<ChangePasswordDialog open onClose={() => {}} />)
    await fill(u, 'mala-1234', 'nueva-1234', 'nueva-1234')
    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual no es correcta.')
  })

  it('el menú solo la ofrece a cuentas con contraseña', () => {
    const base = { uid: 'u', email: 'a@x.com', displayName: 'Ana', emailVerified: true }
    const { unmount } = render(<UserMenu user={{ ...base, hasPassword: true }} onSignOut={() => {}} />)
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument()
    unmount()
    render(<UserMenu user={{ ...base, hasPassword: false }} onSignOut={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Cambiar contraseña' })).toBeNull()
  })
})
