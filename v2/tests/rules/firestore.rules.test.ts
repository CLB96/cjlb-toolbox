import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const ana = (e: RulesTestEnvironment) => e.authenticatedContext('ana', { email: 'Ana@X.com', email_verified: true }).firestore()
const eve = (e: RulesTestEnvironment) => e.authenticatedContext('eve', { email: 'eve@x.com', email_verified: true }).firestore()
const admin = (e: RulesTestEnvironment) => e.authenticatedContext('adm', { email: 'Admin@X.com', email_verified: true }).firestore()
const anaUnverified = (e: RulesTestEnvironment) => e.authenticatedContext('ana', { email: 'ana@x.com', email_verified: false }).firestore()
const adminUnverified = (e: RulesTestEnvironment) => e.authenticatedContext('adm', { email: 'admin@x.com', email_verified: false }).firestore()
const anon = (e: RulesTestEnvironment) => e.unauthenticatedContext().firestore()

const newSession = (over: Record<string, unknown> = {}) => ({
  uid: 'ana', email: 'ana@x.com', name: 'Ana', tool: 'home',
  start: serverTimestamp(), lastBeat: serverTimestamp(), activeSeconds: 0, ...over,
})
const newLogin = (over: Record<string, unknown> = {}) => ({
  uid: 'ana', email: 'ana@x.com', name: 'Ana', at: serverTimestamp(), ...over,
})
const ago = (seconds: number) => Timestamp.fromMillis(Date.now() - seconds * 1000)
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
    const old = { uid: 'ana', email: 'ana@x.com', name: 'Ana', tool: 'home', start: ago(300), lastBeat: ago(120), activeSeconds: 100 }
    await setDoc(doc(db, 'sessions/s1'), old)
    await setDoc(doc(db, 'sessions/fresh'), { ...old, lastBeat: Timestamp.now() })
  })
})

describe('sessions', () => {
  it('permite crear a un usuario en allowlist con email en mayúsculas', async () => {
    await assertSucceeds(setDoc(doc(ana(env), 'sessions/s2'), newSession()))
  })
  it('rechaza a un usuario fuera de la allowlist', async () => {
    await assertFails(setDoc(doc(eve(env), 'sessions/s3'), newSession({ uid: 'eve', email: 'eve@x.com' })))
  })
  it('rechaza un token con email sin verificar', async () => {
    await assertFails(setDoc(doc(anaUnverified(env), 'sessions/s5'), newSession()))
  })
  it('rechaza crear con uid ajeno', async () => {
    await assertFails(setDoc(doc(ana(env), 'sessions/s4'), newSession({ uid: 'otro' })))
  })
  it('rechaza crear con email ajeno, activeSeconds inflado o claves extra', async () => {
    await assertFails(setDoc(doc(ana(env), 'sessions/s6'), newSession({ email: 'otro@x.com' })))
    await assertFails(setDoc(doc(ana(env), 'sessions/s7'), newSession({ activeSeconds: 1000000000 })))
    await assertFails(setDoc(doc(ana(env), 'sessions/s8'), newSession({ extra: 1 })))
  })
  it('rechaza start/lastBeat que no sean la hora del servidor', async () => {
    await assertFails(setDoc(doc(ana(env), 'sessions/s9'), newSession({ start: ago(10), lastBeat: ago(10) })))
  })
  it('no admin no lee sesiones; admin sí; admin sin verificar no', async () => {
    await assertFails(getDoc(doc(ana(env), 'sessions/s1')))
    await assertSucceeds(getDoc(doc(admin(env), 'sessions/s1')))
    await assertFails(getDoc(doc(adminUnverified(env), 'sessions/s1')))
  })
  it('rechaza activeSeconds +500 y permite +60 con tiempo transcurrido', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 600, lastBeat: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 160, lastBeat: serverTimestamp() }))
  })
  it('rechaza +60 cuando casi no ha pasado tiempo de servidor', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/fresh'), { activeSeconds: 160, lastBeat: serverTimestamp() }))
  })
  it('rechaza que activeSeconds decrezca', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 10, lastBeat: serverTimestamp() }))
  })
  it('rechaza lastBeat que no sea la hora del servidor', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 160, lastBeat: ago(0) }))
  })
  it('rechaza modificar otros campos en update', async () => {
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 160, lastBeat: serverTimestamp(), tool: 'x' }))
    await assertFails(updateDoc(doc(ana(env), 'sessions/s1'), { activeSeconds: 160, lastBeat: serverTimestamp(), email: 'otro@x.com' }))
  })
})

describe('logins', () => {
  it('permite crear un login propio', async () => {
    await assertSucceeds(setDoc(doc(ana(env), 'logins/l1'), newLogin()))
  })
  it('rechaza email ajeno, claves extra, at falso y usuario sin verificar', async () => {
    await assertFails(setDoc(doc(ana(env), 'logins/l2'), newLogin({ email: 'otro@x.com' })))
    await assertFails(setDoc(doc(ana(env), 'logins/l3'), newLogin({ extra: 1 })))
    await assertFails(setDoc(doc(ana(env), 'logins/l4'), newLogin({ at: ago(5) })))
    await assertFails(setDoc(doc(anaUnverified(env), 'logins/l5'), newLogin()))
  })
  it('es create-only', async () => {
    await assertSucceeds(setDoc(doc(ana(env), 'logins/l6'), newLogin()))
    await assertFails(updateDoc(doc(ana(env), 'logins/l6'), { name: 'Otro' }))
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
    await assertFails(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), request({ email: 'eve@x.com', uid: 'otro' })))
    await assertSucceeds(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), request({ email: 'eve@x.com', uid: 'eve' })))
  })
  it('rechaza que un usuario autenticado solicite acceso para otro email', async () => {
    await assertFails(setDoc(doc(eve(env), 'accessRequests/bob@x.com'), request({ uid: 'eve' })))
  })
  it('lectura: el propio y admin sí, otros no', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'accessRequests/eve@x.com'), request({ email: 'eve@x.com', email_verified: true }))
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
  it('config: lectura solo allowlist o admin, escritura nadie', async () => {
    await assertSucceeds(getDoc(doc(ana(env), 'config/app')))
    await assertSucceeds(getDoc(doc(admin(env), 'config/app')))
    await assertFails(getDoc(doc(eve(env), 'config/app')))
    await assertFails(getDoc(doc(anon(env), 'config/app')))
    await assertFails(setDoc(doc(admin(env), 'config/app'), { adminEmail: 'x@x.com' }))
  })
})
