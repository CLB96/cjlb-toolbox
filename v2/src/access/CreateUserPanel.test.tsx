import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { __resetI18nForTests } from '../i18n/useI18n'

const api = vi.hoisted(() => ({ createUserByAdmin: vi.fn() }))
vi.mock('./createUser', async () => {
  const real = await vi.importActual<typeof import('./createUser')>('./createUser')
  return { ...real, createUserByAdmin: api.createUserByAdmin }
})
vi.mock('../auth/firebase', () => ({ app: { options: {} }, db: 'db' }))

import { CreateUserFailure } from './createUser'
import { CreateUserPanel } from './CreateUserPanel'

describe('panel «Crear usuario»', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
    api.createUserByAdmin.mockReset()
  })

  it('crea la cuenta y muestra la contraseña una sola vez', async () => {
    api.createUserByAdmin.mockResolvedValue('juan@prov.com')
    const u = userEvent.setup()
    render(<CreateUserPanel adminEmail="admin@x.com" />)
    const password = screen.getByLabelText('Contraseña temporal') as HTMLInputElement
    expect(password.value).toMatch(/^.{4}-.{4}-.{4}$/)
    const chosen = password.value
    await u.type(screen.getByLabelText('Correo'), 'juan@prov.com')
    await u.type(screen.getByLabelText('Nombre (opcional)'), 'Juan')
    await u.click(screen.getByRole('button', { name: 'Crear usuario' }))
    expect(api.createUserByAdmin).toHaveBeenCalledWith({ email: 'juan@prov.com', name: 'Juan', password: chosen }, 'admin@x.com')
    expect(await screen.findByText('Usuario creado: juan@prov.com')).toBeInTheDocument()
    expect(screen.getByText(chosen)).toBeInTheDocument()
    // El formulario queda limpio y con otra contraseña para el siguiente alta.
    expect((screen.getByLabelText('Correo') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Contraseña temporal') as HTMLInputElement).value).not.toBe(chosen)
  })

  it('«Generar» cambia la contraseña', async () => {
    const u = userEvent.setup()
    render(<CreateUserPanel adminEmail="admin@x.com" />)
    const before = (screen.getByLabelText('Contraseña temporal') as HTMLInputElement).value
    await u.click(screen.getByRole('button', { name: 'Generar' }))
    expect((screen.getByLabelText('Contraseña temporal') as HTMLInputElement).value).not.toBe(before)
  })

  it('correo con cuenta existente: explica cómo resolverlo', async () => {
    api.createUserByAdmin.mockRejectedValue(new CreateUserFailure('exists'))
    const u = userEvent.setup()
    render(<CreateUserPanel adminEmail="admin@x.com" />)
    await u.type(screen.getByLabelText('Correo'), 'juan@prov.com')
    await u.click(screen.getByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese correo.')
    expect(screen.queryByText(/Usuario creado/)).toBeNull()
  })
})
