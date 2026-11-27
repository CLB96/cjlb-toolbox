import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangSwitch, ThemeSwitch } from './Switches'
import { __resetI18nForTests } from '../i18n/useI18n'
import { __resetThemeForTests } from '../theme/useTheme'

beforeEach(() => {
  localStorage.clear()
  __resetI18nForTests()
  __resetThemeForTests()
  localStorage.setItem('cjlb.theme', 'light')
})

test('el interruptor de tema es un switch y alterna claro y oscuro', async () => {
  const user = userEvent.setup()
  render(<ThemeSwitch />)
  const sw = screen.getByRole('switch', { name: 'Cambiar tema' })
  expect(sw).toHaveAttribute('aria-checked', 'false')
  await user.click(sw)
  expect(sw).toHaveAttribute('aria-checked', 'true')
  await user.click(sw)
  expect(sw).toHaveAttribute('aria-checked', 'false')
})

test('el interruptor de idioma alterna español e inglés y se maneja con el teclado', async () => {
  const user = userEvent.setup()
  render(<LangSwitch />)
  const sw = screen.getByRole('switch', { name: 'Cambiar idioma' })
  expect(sw).toHaveAttribute('aria-checked', 'false')
  sw.focus()
  await user.keyboard('{Enter}')
  expect(sw).toHaveAttribute('aria-checked', 'true')
  expect(sw).toHaveTextContent('EN')
})
