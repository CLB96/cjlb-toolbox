import { render, screen } from '@testing-library/react'
import App from './App'

test('renderiza el shell con logo y pestañas', () => {
  window.location.hash = '#/home'
  render(<App />)
  expect(screen.getByAltText('CJLB')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Inicio' })).toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Uso' })).toBeNull()
})
