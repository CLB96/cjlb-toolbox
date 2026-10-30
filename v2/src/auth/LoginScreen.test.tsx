import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginScreen } from './LoginScreen'

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
