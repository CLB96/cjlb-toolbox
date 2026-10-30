import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './Dialog'

function setup() {
  const onClose = vi.fn()
  render(
    <>
      <button>fuera</button>
      <Dialog open onClose={onClose} title="Título">
        <button>uno</button>
        <input aria-label="campo" />
        <button>dos</button>
      </Dialog>
    </>,
  )
  return { onClose, dialog: screen.getByRole('dialog') }
}

test('Tab y Shift+Tab ciclan dentro del diálogo', async () => {
  const user = userEvent.setup()
  setup()
  await user.tab()
  expect(screen.getByRole('button', { name: 'uno' })).toHaveFocus()
  await user.tab()
  await user.tab()
  expect(screen.getByRole('button', { name: 'dos' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'uno' })).toHaveFocus()
  await user.tab({ shift: true })
  expect(screen.getByRole('button', { name: 'dos' })).toHaveFocus()
})

test('Escape cierra aunque el foco esté fuera del panel', () => {
  const { onClose } = setup()
  screen.getByRole('button', { name: 'fuera' }).focus()
  fireEvent.keyDown(document.body, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})
