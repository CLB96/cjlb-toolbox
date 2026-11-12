import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

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

describe('accessRequests: reabrir una solicitud respondida', () => {
  const seed = (id: string, status: string) =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `accessRequests/${id}`), request({ email: id, status }))
    })
  const eveReq = (over: Record<string, unknown> = {}) => request({ email: 'eve@x.com', uid: 'eve', createdAt: serverTimestamp(), ...over })

  it('el dueño puede reabrir una solicitud rechazada o aprobada como pendiente', async () => {
    await seed('eve@x.com', 'rejected')
    await assertSucceeds(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), eveReq()))
    await seed('eve@x.com', 'approved')
    await assertSucceeds(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), eveReq()))
  })
  it('no puede reescribir una solicitud que sigue pendiente', async () => {
    await seed('eve@x.com', 'pending')
    await assertFails(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), eveReq()))
  })
  it('no puede tocar la solicitud de otro', async () => {
    await seed('bob@x.com', 'rejected')
    await assertFails(setDoc(doc(eve(env), 'accessRequests/bob@x.com'), request({ uid: 'eve' })))
  })
  it('solo puede dejarla en pending y con campos válidos', async () => {
    await seed('eve@x.com', 'rejected')
    await assertFails(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), eveReq({ status: 'approved' })))
    await assertFails(updateDoc(doc(eve(env), 'accessRequests/eve@x.com'), { status: 'approved' }))
    await assertFails(setDoc(doc(eve(env), 'accessRequests/eve@x.com'), eveReq({ name: 'x'.repeat(81) })))
  })
  it('sin login o sin verificar no puede reabrir', async () => {
    await seed('bob@x.com', 'rejected')
    await assertFails(setDoc(doc(anon(env), 'accessRequests/bob@x.com'), request()))
    await seed('ana@x.com', 'rejected')
    await assertFails(setDoc(doc(anaUnverified(env), 'accessRequests/ana@x.com'), request({ email: 'ana@x.com', uid: 'ana' })))
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

describe('cuentas creadas por el admin (sin verificar el correo)', () => {
  // `juan` la creó el admin: su entrada en la allowlist guarda su uid.
  const juan = (e: RulesTestEnvironment) => e.authenticatedContext('juan-uid', { email: 'Juan@Prov.com', email_verified: false }).firestore()
  // Otra cuenta registrada con el mismo correo, sin acceso al buzón.
  const impostor = (e: RulesTestEnvironment) => e.authenticatedContext('otro-uid', { email: 'juan@prov.com', email_verified: false }).firestore()
  const seedJuan = () => env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'allowlist/juan@prov.com'), { addedAt: 1, addedBy: 'admin@x.com', uid: 'juan-uid' })
  })

  it('la cuenta con el uid guardado entra sin email_verified', async () => {
    await seedJuan()
    await assertSucceeds(getDoc(doc(juan(env), 'allowlist/juan@prov.com')))
    await assertSucceeds(getDoc(doc(juan(env), 'config/app')))
    await assertSucceeds(setDoc(doc(juan(env), 'sessions/j1'), newSession({ uid: 'juan-uid', email: 'juan@prov.com', name: 'Juan' })))
  })
  it('otra cuenta con el mismo correo sigue rechazada', async () => {
    await seedJuan()
    await assertFails(getDoc(doc(impostor(env), 'allowlist/juan@prov.com')))
    await assertFails(getDoc(doc(impostor(env), 'config/app')))
    await assertFails(setDoc(doc(impostor(env), 'sessions/j2'), newSession({ uid: 'otro-uid', email: 'juan@prov.com', name: 'Juan' })))
  })
  it('sin uid en la allowlist, una cuenta sin verificar sigue rechazada', async () => {
    await assertFails(getDoc(doc(anaUnverified(env), 'allowlist/ana@x.com')))
    await assertFails(getDoc(doc(anaUnverified(env), 'config/app')))
  })
  it('la cuenta de confianza no es admin ni escribe la allowlist', async () => {
    await seedJuan()
    await assertFails(getDoc(doc(juan(env), 'sessions/s1')))
    await assertFails(setDoc(doc(juan(env), 'allowlist/juan@prov.com'), { addedAt: 1, addedBy: 'juan', uid: 'juan-uid' }))
    await assertFails(setDoc(doc(juan(env), 'allowlist/otro@prov.com'), { addedAt: 1, addedBy: 'juan', uid: 'otro-uid' }))
  })
  it('el admin guarda el uid al crear la cuenta', async () => {
    await assertSucceeds(setDoc(doc(admin(env), 'allowlist/nuevo@prov.com'), { addedAt: 1, addedBy: 'admin@x.com', uid: 'n-uid' }))
  })
})

describe('toolBadges', () => {
  const seedBadge = () => env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'toolBadges/gantt'), { badge: 'new' })
  })
  it('lectura para allowlist y admin; nadie más', async () => {
    await seedBadge()
    await assertSucceeds(getDocs(collection(ana(env), 'toolBadges')))
    await assertSucceeds(getDoc(doc(admin(env), 'toolBadges/gantt')))
    await assertFails(getDocs(collection(eve(env), 'toolBadges')))
    await assertFails(getDoc(doc(anon(env), 'toolBadges/gantt')))
    await assertFails(getDoc(doc(anaUnverified(env), 'toolBadges/gantt')))
  })
  it('el admin crea, cambia y quita la insignia (null)', async () => {
    await assertSucceeds(setDoc(doc(admin(env), 'toolBadges/capaflow'), { badge: 'updated' }))
    await assertSucceeds(setDoc(doc(admin(env), 'toolBadges/capaflow'), { badge: 'new' }))
    await assertSucceeds(setDoc(doc(admin(env), 'toolBadges/capaflow'), { badge: null }))
  })
  it('un usuario no admin, sin verificar o sin login no escribe', async () => {
    await seedBadge()
    await assertFails(setDoc(doc(ana(env), 'toolBadges/gantt'), { badge: 'updated' }))
    await assertFails(setDoc(doc(adminUnverified(env), 'toolBadges/gantt'), { badge: 'updated' }))
    await assertFails(setDoc(doc(anon(env), 'toolBadges/gantt'), { badge: 'updated' }))
  })
  it('rechaza valores, campos o ids no válidos, y borrar', async () => {
    await seedBadge()
    await assertFails(setDoc(doc(admin(env), 'toolBadges/gantt'), { badge: 'otro' }))
    await assertFails(setDoc(doc(admin(env), 'toolBadges/gantt'), { badge: 'new', extra: 1 }))
    await assertFails(setDoc(doc(admin(env), 'toolBadges/gantt'), {}))
    await assertFails(setDoc(doc(admin(env), 'toolBadges/gantt'), { badge: 5 }))
    await assertFails(setDoc(doc(admin(env), 'toolBadges/Gantt'), { badge: 'new' }))
    await assertFails(setDoc(doc(admin(env), `toolBadges/${'a'.repeat(33)}`), { badge: 'new' }))
    await assertSucceeds(setDoc(doc(admin(env), 'toolBadges/tool-2'), { badge: 'new' }))
    await assertFails(deleteDoc(doc(admin(env), 'toolBadges/gantt')))
    await assertFails(deleteDoc(doc(ana(env), 'toolBadges/gantt')))
  })
})
