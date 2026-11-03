import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GageflowStoreProvider } from '../GageflowStoreProvider'
import { SetupForm } from '../components/SetupForm'

function montar() {
  render(
    <GageflowStoreProvider>
      <SetupForm />
    </GageflowStoreProvider>,
  )
}

describe('formulario del estudio', () => {
  it('marca los campos obligatorios vacíos', () => {
    montar()
    expect(screen.getByLabelText('Pieza / conjunto')).toBeTruthy()
    expect(screen.getAllByText('Este campo es obligatorio.').length).toBeGreaterThan(0)
  })

  it('acepta escritura y deja de marcar el error de la pieza', async () => {
    const usuario = userEvent.setup()
    montar()
    const pieza = screen.getByLabelText('Pieza / conjunto') as HTMLInputElement
    await usuario.type(pieza, 'A-12')
    expect(pieza.value).toBe('A-12')
    expect(pieza.getAttribute('aria-invalid')).toBeNull()
  })

  it('permite añadir un operador', async () => {
    const usuario = userEvent.setup()
    montar()
    const antes = screen.getAllByLabelText(/^Operadores \d/).length
    await usuario.click(screen.getByText(/Añadir operador/))
    expect(screen.getAllByLabelText(/^Operadores \d/).length).toBe(antes + 1)
  })
})
