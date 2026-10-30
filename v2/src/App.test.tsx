import { render, screen } from '@testing-library/react'
import App from './App'

test('muestra el nombre del toolbox', () => {
  render(<App />)
  expect(screen.getByText(/CJLB/)).toBeInTheDocument()
})
