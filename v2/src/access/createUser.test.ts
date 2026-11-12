const fb = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: 'secundaria' })),
  deleteApp: vi.fn(async () => undefined),
  initializeAuth: vi.fn(() => ({ name: 'auth-secundaria' })),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  setDoc: vi.fn(async () => undefined),
  doc: vi.fn((_db: unknown, ...path: string[]) => path.join('/')),
}))

vi.mock('firebase/app', () => ({ initializeApp: fb.initializeApp, deleteApp: fb.deleteApp }))
vi.mock('firebase/auth', () => ({
  initializeAuth: fb.initializeAuth, inMemoryPersistence: 'memoria', connectAuthEmulator: vi.fn(),
  createUserWithEmailAndPassword: fb.createUserWithEmailAndPassword, updateProfile: fb.updateProfile, signOut: fb.signOut,
}))
vi.mock('firebase/firestore', () => ({ doc: fb.doc, setDoc: fb.setDoc, serverTimestamp: () => 'ahora' }))
vi.mock('../auth/firebase', () => ({ app: { options: { apiKey: 'k' } }, db: 'db' }))

import { CreateUserFailure, createUserByAdmin, generatePassword, validateNewUser } from './createUser'

const valid = { email: ' Juan@Prov.com ', name: 'Juan Pérez', password: 'Rq7k-T3mP-z9wX' }

describe('alta de usuarios por el admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fb.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'juan-uid' } })
  })

  it('genera contraseñas de 12 caracteres en tres grupos, sin caracteres ambiguos', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generatePassword()))
    expect(passwords.size).toBe(50)
    for (const p of passwords) expect(p).toMatch(/^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/)
  })

  it('valida correo, nombre y largo de la contraseña', () => {
    expect(validateNewUser(valid)).toBeNull()
    expect(validateNewUser({ ...valid, email: 'no-es-correo' })).toBe('invalid')
    expect(validateNewUser({ ...valid, name: 'x'.repeat(81) })).toBe('invalid')
    expect(validateNewUser({ ...valid, password: '1234567' })).toBe('weakPassword')
  })

  it('crea la cuenta en una app secundaria y guarda su uid en la allowlist', async () => {
    await expect(createUserByAdmin(valid, 'Admin@X.com')).resolves.toBe('juan@prov.com')
    expect(fb.initializeAuth).toHaveBeenCalledWith({ name: 'secundaria' }, { persistence: 'memoria' })
    expect(fb.createUserWithEmailAndPassword).toHaveBeenCalledWith({ name: 'auth-secundaria' }, 'juan@prov.com', valid.password)
    expect(fb.updateProfile).toHaveBeenCalledWith({ uid: 'juan-uid' }, { displayName: 'Juan Pérez' })
    expect(fb.signOut).toHaveBeenCalledWith({ name: 'auth-secundaria' })
    expect(fb.deleteApp).toHaveBeenCalledWith({ name: 'secundaria' })
    expect(fb.setDoc).toHaveBeenCalledWith('allowlist/juan@prov.com', { addedAt: 'ahora', addedBy: 'admin@x.com', uid: 'juan-uid' })
  })

  it('correo con cuenta existente: no toca nada y lo informa', async () => {
    fb.createUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' })
    await expect(createUserByAdmin(valid, 'admin@x.com')).rejects.toEqual(new CreateUserFailure('exists'))
    expect(fb.setDoc).not.toHaveBeenCalled()
    expect(fb.deleteApp).toHaveBeenCalled()
  })

  it('si no se puede dar acceso, lo dice aparte', async () => {
    fb.setDoc.mockRejectedValueOnce(new Error('permission-denied'))
    await expect(createUserByAdmin(valid, 'admin@x.com')).rejects.toEqual(new CreateUserFailure('accessFailed'))
  })

  it('datos inválidos no llegan a Firebase', async () => {
    await expect(createUserByAdmin({ ...valid, password: 'corta' }, 'admin@x.com')).rejects.toEqual(new CreateUserFailure('weakPassword'))
    expect(fb.initializeApp).not.toHaveBeenCalled()
  })
})
