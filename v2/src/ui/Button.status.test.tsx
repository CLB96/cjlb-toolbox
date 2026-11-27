import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from './Button'

test('sin status el botón se ve y se comporta como siempre', () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Guardar</Button>)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(document.querySelector('.btn__spin')).toBeNull()
})

test('cargando: marca ocupado, no vuelve a lanzar y conserva el nombre accesible', () => {
  const onClick = vi.fn()
  render(
    <Button status="loading" onClick={onClick}>
      Exportar
    </Button>,
  )
  const b = screen.getByRole('button', { name: 'Exportar' })
  expect(b).toHaveAttribute('aria-busy', 'true')
  expect(b).toHaveAttribute('data-status', 'loading')
  fireEvent.click(b)
  expect(onClick).not.toHaveBeenCalled()
})

test('listo: tampoco relanza mientras se ve la palomita', () => {
  const onClick = vi.fn()
  render(
    <Button status="success" onClick={onClick}>
      Exportar
    </Button>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
  expect(onClick).not.toHaveBeenCalled()
})

test('en reposo con status se puede pulsar', () => {
  const onClick = vi.fn()
  render(
    <Button status="idle" onClick={onClick}>
      Exportar
    </Button>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})
