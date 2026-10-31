import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestAccessForm } from './RequestAccessForm'
import { useToasts } from '../ui/toastStore'

vi.mock('./accessService', () => ({ submitAccessRequest: vi.fn() }))
import { submitAccessRequest } from './accessService'
const submit = vi.mocked(submitAccessRequest)

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  useToasts.setState({ toasts: [] })
})

async function fillAndSend(email = 'bob@x.com') {
  await userEvent.type(screen.getByLabelText('Correo'), email)
  await userEvent.type(screen.getByLabelText('Nombre'), 'Bob')
  await userEvent.click(screen.getByRole('button', { name: 'Solicitar acceso' }))
}

test('sin cuenta: sent, alreadyExists e ignored muestran el mismo texto neutral', async () => {
  const texts: string[] = []
  for (const r of ['sent', 'alreadyExists', 'ignored'] as const) {
    submit.mockResolvedValue(r)
    localStorage.clear()
    const { unmount } = render(<RequestAccessForm />)
    await fillAndSend()
    texts.push((await screen.findByRole('status')).textContent ?? '')
    unmount()
  }
  expect(new Set(texts).size).toBe(1)
  expect(texts[0]).toBe('Si ya enviaste una solicitud, está pendiente de aprobación. Cuando sea aprobada, entra con Google o crea una cuenta con ese mismo correo.')
})

test('con cuenta: sent y alreadyExists muestran mensajes distintos', async () => {
  submit.mockResolvedValue('sent')
  const { unmount } = render(<RequestAccessForm email="ana@x.com" uid="u9" defaultName="Ana" />)
  await userEvent.click(screen.getByRole('button', { name: 'Solicitar acceso' }))
  expect(await screen.findByText('Solicitud enviada. Te avisaremos cuando sea aprobada.')).toBeInTheDocument()
  unmount()
  localStorage.clear()
  submit.mockResolvedValue('alreadyExists')
  render(<RequestAccessForm email="ana@x.com" uid="u9" defaultName="Ana" />)
  await userEvent.click(screen.getByRole('button', { name: 'Solicitar acceso' }))
  expect(await screen.findByText('Si ya enviaste una solicitud, está pendiente de aprobación.')).toBeInTheDocument()
})

test('error muestra toast y deja reintentar', async () => {
  submit.mockResolvedValue('error')
  render(<RequestAccessForm />)
  await fillAndSend()
  expect(await screen.findByRole('button', { name: 'Solicitar acceso' })).toBeEnabled()
  expect(useToasts.getState().toasts[0]).toMatchObject({ kind: 'error' })
})
