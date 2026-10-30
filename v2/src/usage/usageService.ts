import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../auth/firebase'
import { greetingName } from '../auth/greeting'
import type { AppUser } from '../auth/authService'

/** Tope por beat, igual que firestore.rules. */
export const MAX_BEAT_SECONDS = 120
const MAX_NAME = 80

export interface SessionDoc {
  id: string
  uid: string
  email: string
  name: string
  tool: string
  /** Milisegundos desde epoch. */
  start: number
  lastBeat: number
  activeSeconds: number
}

/** Último beat correcto por sesión (ms locales), para no pedir más segundos de los reales. */
const lastSuccess = new Map<string, number>()

function displayName(user: AppUser): string {
  return greetingName(user).slice(0, MAX_NAME)
}

export async function recordLogin(user: AppUser): Promise<void> {
  await addDoc(collection(db, 'logins'), {
    uid: user.uid,
    email: user.email,
    name: displayName(user),
    at: serverTimestamp(),
  })
}

export async function startSession(user: AppUser, tool: string): Promise<string> {
  const ref = await addDoc(collection(db, 'sessions'), {
    uid: user.uid,
    email: user.email,
    name: displayName(user),
    tool,
    start: serverTimestamp(),
    lastBeat: serverTimestamp(),
    activeSeconds: 0,
  })
  lastSuccess.set(ref.id, Date.now())
  return ref.id
}

export async function beat(sessionId: string, addSeconds: number): Promise<void> {
  const sent = Date.now()
  const elapsed = Math.floor((sent - (lastSuccess.get(sessionId) ?? sent)) / 1000)
  const n = Math.max(0, Math.min(Math.floor(addSeconds), MAX_BEAT_SECONDS, elapsed))
  await updateDoc(doc(db, 'sessions', sessionId), {
    activeSeconds: increment(n),
    lastBeat: serverTimestamp(),
  })
  lastSuccess.set(sessionId, sent)
}

function millis(v: unknown): number {
  return v instanceof Timestamp ? v.toMillis() : 0
}

export async function fetchSessions(from: number, to: number): Promise<SessionDoc[]> {
  const snap = await getDocs(
    query(
      collection(db, 'sessions'),
      where('start', '>=', Timestamp.fromMillis(from)),
      where('start', '<', Timestamp.fromMillis(to)),
    ),
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      uid: String(data.uid ?? ''),
      email: String(data.email ?? ''),
      name: String(data.name ?? ''),
      tool: String(data.tool ?? ''),
      start: millis(data.start),
      lastBeat: millis(data.lastBeat),
      activeSeconds: Number(data.activeSeconds ?? 0),
    }
  })
}
