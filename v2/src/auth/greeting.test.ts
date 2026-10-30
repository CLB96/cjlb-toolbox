import { greetingName } from './greeting'

test('usa el nombre cuando existe', () => {
  expect(greetingName({ displayName: 'Ana Pérez', email: 'a@b.com' })).toBe('Ana Pérez')
})
test('usa el correo sin nombre', () => {
  expect(greetingName({ displayName: null, email: 'a@b.com' })).toBe('a@b.com')
})
test('usa el correo con nombre en blanco', () => {
  expect(greetingName({ displayName: '  ', email: 'a@b.com' })).toBe('a@b.com')
})
