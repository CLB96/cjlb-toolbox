import { fireEvent, render, screen } from '@testing-library/react'
import { ExpandButton } from './ExpandButton'

test('el nombre accesible es la etiqueta completa aunque esté plegado', () => {
  render(<ExpandButton label="+ Nuevo punto" onClick={() => {}} />)
  const b = screen.getByRole('button', { name: '+ Nuevo punto' })
  expect(b.textContent).toBe('+ Nuevo punto')
  expect(b).not.toHaveClass('xb--open')
})

test('con icono propio el texto no lleva "+"', () => {
  render(<ExpandButton icon={<svg data-testid="ic" />} label="Nueva pieza" />)
  expect(screen.getByRole('button', { name: 'Nueva pieza' }).textContent).toBe('Nueva pieza')
  expect(screen.getByTestId('ic')).toBeInTheDocument()
})

test('el cursor lo abre y al salir se pliega; el clic hace su acción', () => {
  const onClick = vi.fn()
  render(<ExpandButton label="+ Nuevo punto" onClick={onClick} />)
  const b = screen.getByRole('button')
  fireEvent.pointerEnter(b, { pointerType: 'mouse' })
  expect(b).toHaveClass('xb--open')
  fireEvent.pointerLeave(b, { pointerType: 'mouse' })
  expect(b).not.toHaveClass('xb--open')
  fireEvent.click(b)
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('respeta disabled', () => {
  const onClick = vi.fn()
  render(<ExpandButton label="+ Nuevo punto" disabled onClick={onClick} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).not.toHaveBeenCalled()
})
