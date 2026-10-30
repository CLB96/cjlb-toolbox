import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerifyScreen } from './VerifyScreen'

function setup() {
  const props = {
    email: 'a@b.com',
    sendVerification: vi.fn().mockResolvedValue(undefined),
    reloadUser: vi.fn().mockResolvedValue(undefined),
    onSignOut: vi.fn(),
  }
  render(<VerifyScreen {...props} />)
  return props
}

test('reenviar llama al servicio y se deshabilita 60 s', async () => {
  const p = setup()
  const btn = screen.getByRole('button', { name: 'Reenviar correo de verificación' })
  await userEvent.click(btn)
  expect(p.sendVerification).toHaveBeenCalledTimes(1)
  expect(btn).toBeDisabled()
})

test('"Ya lo verifiqué" recarga al usuario', async () => {
  const p = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Ya lo verifiqué' }))
  expect(p.reloadUser).toHaveBeenCalledTimes(1)
})
