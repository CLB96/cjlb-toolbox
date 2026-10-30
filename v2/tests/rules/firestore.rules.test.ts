import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const ana = (e: RulesTestEnvironment) => e.authenticatedContext('ana', { email: 'Ana@X.com' }).firestore()
const eve = (e: RulesTestEnvironment) => e.authenticatedContext('eve', { email: 'eve@x.com' }).firestore()
const admin = (e: RulesTestEnvironment) => e.authenticatedContext('adm', { email: 'Admin@X.com' }).firestore()
const anon = (e: RulesTestEnvironment) => e.unauthenticatedContext().firestore()

const session = (uid: string, activeSeconds = 0) => ({
  uid, email: 'ana@x.com', name: 'Ana', tool: 'home', start: 1, lastBeat: 1, activeSeconds,
})
const request = (over: Record<string, unknown> = {}) => ({
  email: 'bob@x.com', name: 'Bob', reason: 'necesito acceso', uid: null, status: 'pending', createdAt: 1, ...over,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cjlb-toolbox',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
afterAll(async () => { await env.cleanup() })
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'config/app'), { adminEmail: 'admin@x.com' })
    await setDoc(doc(db, 'allowlist/ana@x.com'), { addedAt: 1, addedBy: 'admin@x.com' })
    await setDoc(doc(db, 'sessions/s1'), session('ana', 100))
  })
})

describe('sessions', () => {
  it('permite crear a un usuario en allowlist con email en mayúsculas', async () => {
    await assertSucceeds(setDoc(doc(ana(env), 'sessions/s2'), session('ana')))
  })
  it('rechaza a un usuario fuera de la allowlist', async () => {
    await assertFails(setDoc(doc(eve(env), 'sessions/s3'), session('eve')))
  })
  it('rechaza crear con uid ajeno', async () => {
    await assertFails(setDoc(doc(ana(env), 'sessions/s4'), session('otro')))
  })
  it('no admin no lee sesiones; admin sí', async () => {
    await assertFails(getDoc(doc(ana(env), 'sessions/s1')))
    await assertSucceeds(getDoc(doc(admin(env), 'sessions/s1')))
  })
  it('rechaza activeSeconds +500 y permite +60', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 600 }))
    await assertSucceeds(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 160 }))
  })
  it('rechaza que activeSeconds decrezca', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 10 }))
  })
})

describe('accessRequests', () => {
  it('permite crear una solicitud válida sin auth y rechaza duplicados', async () => {
    await assertSucceeds(setDoc(doc(anon(env), 'accessRequests/bob@x.com'), request()))
    await assertFails(setDoc(doc(anon(env), 'accessRequests/bob@x.com'), request()))
  })
  it('rechaza reason de 501 caracteres', async () => {
    await assertFails(setDoc(doc(anon(env), 'accessRequests/bob@x.com'), request({ reason: 'x'.repeat(501) })))
  })
  it('rechaza status approved en create', async () => {
    await assertFails(setDoc(doc(anon(env), 'accessRequests/bob@x.com'), request({ status: 'approved' })))
  })
  it('rechaza claves extra como honeypot', async () => {
    await assertFails(setDoc(doc(anon(env), 'accessRequests/bob@x.com'), request({ honeypot: '' })))
  })
  it('rechaza email con mayúsculas o id distinto', async () => {
    await assertFails(setDoc(doc(anon(env), 'accessRequests/Bob@x.com'), request({ email: 'Bob@x.com' })))
    await assertFails(setDoc(doc(anon(env), 'accessRequests/otro@x.com'), request()))
  })
  it('rechaza uid ajeno con auth', async () => {
    await assertFails(setDoc(doc(eve(env), 'accessRequests/bob@x.com'), request({ uid: 'otro' })))
    await assertSucceeds(setDoc(doc(eve(env), 'accessRequests/bob@x.com'), request({ uid: 'eve' })))
  })
  it('lectura: el propio y admin sí, otros no', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'accessRequests/eve@x.com'), request({ email: 'eve@x.com' }))
    })
    await assertSucceeds(getDoc(doc(eve(env), 'accessRequests/eve@x.com')))
    await assertSucceeds(getDoc(doc(admin(env), 'accessRequests/eve@x.com')))
    await assertFails(getDoc(doc(ana(env), 'accessRequests/eve@x.com')))
  })
})

describe('allowlist y config', () => {
  it('no admin no escribe allowlist; admin sí', async () => {
    await assertFails(setDoc(doc(ana(env), 'allowlist/new@x.com'), { addedAt: 1, addedBy: 'ana' }))
    await assertSucceeds(setDoc(doc(admin(env), 'allowlist/new@x.com'), { addedAt: 1, addedBy: 'admin@x.com' }))
  })
  it('config: lectura autenticada, escritura nadie', async () => {
    await assertSucceeds(getDoc(doc(eve(env), 'config/app')))
    await assertFails(getDoc(doc(anon(env), 'config/app')))
    await assertFails(setDoc(doc(admin(env), 'config/app'), { adminEmail: 'x@x.com' }))
  })
})
