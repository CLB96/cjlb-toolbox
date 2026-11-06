import { render, screen } from '@testing-library/react'
import { DomeCard } from './DomeCard'

function withSize(w: number, h: number) {
  const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(w)
  const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(h)
  return () => {
    width.mockRestore()
    height.mockRestore()
  }
}

test('con espacio suficiente recorta el cuadro con la cúpula y dibuja su borde', () => {
  const restore = withSize(400, 520)
  const { container } = render(
    <DomeCard logoSrc="/logo-dark.png">
      <h1>Título</h1>
    </DomeCard>,
  )
  restore()
  const card = container.querySelector('.auth-card') as HTMLElement
  expect(card).toHaveClass('auth-card--shaped')
  expect(card.style.clipPath).toMatch(/^path\('M0,/)
  expect(screen.getByTestId('dome-edge')).toBeInTheDocument()
  expect(screen.getByAltText('CJLB')).toHaveAttribute('src', '/logo-dark.png')
  expect(screen.getByRole('heading', { name: 'Título' })).toBeInTheDocument()
})

test('si es demasiado angosto queda el cuadro normal, con el logo', () => {
  const restore = withSize(150, 400)
  const { container } = render(<DomeCard logoSrc="/logo-light.png">x</DomeCard>)
  restore()
  const card = container.querySelector('.auth-card') as HTMLElement
  expect(card).not.toHaveClass('auth-card--shaped')
  expect(card.style.clipPath).toBe('')
  expect(screen.queryByTestId('dome-edge')).toBeNull()
  expect(screen.getByAltText('CJLB')).toBeInTheDocument()
})
