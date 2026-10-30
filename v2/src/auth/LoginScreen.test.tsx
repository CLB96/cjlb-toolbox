import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
vi.mock('../access/accessService', () => ({ submitAccessRequest: vi.fn() }))

import { LoginScreen } from './LoginScreen'
import { __resetThemeForTests } from '../theme/useTheme'

afterEach(() => {
  localStorage.removeItem('cjlb.theme')
  __resetThemeForTests()
})

test('con tema claro el logo usa /logo-light.png', () => {
  localStorage.setItem('cjlb.theme', 'light')
  __resetThemeForTests()
  render(<LoginScreen signInWithGoogle={vi.fn()} signInWithEmail={vi.fn()} />)
  expect(screen.getByAltText('CJLB')).toHaveAttribute('src', '/logo-light.png')
})

test('credencial inválida muestra mensaje genérico sin detalles técnicos', async () => {
  const signInWithEmail = vi.fn().mockRejectedValue(new Error('auth/wrong-password internal'))
  render(<LoginScreen signInWithGoogle={vi.fn()} signInWithEmail={signInWithEmail} />)
  await userEvent.type(screen.getByLabelText('Correo'), 'a@b.com')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
  expect(screen.queryByText(/wrong-password/)).toBeNull()
  expect(screen.queryByText(/crear cuenta/i)).toBeNull()
})

test('el enlace de solicitud muestra el formulario sin login y permite volver', async () => {
  render(<LoginScreen signInWithGoogle={vi.fn()} signInWithEmail={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: '¿No tienes acceso? Solicítalo' }))
  expect(screen.getByRole('button', { name: 'Solicitar acceso' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Contraseña')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
  expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
})
