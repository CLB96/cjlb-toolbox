import { useEffect, useRef, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../auth/firebase'
import { normalizeEmail } from '../auth/email'
import { LIMITS } from './limits'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'

/** Sin red setDoc no se resuelve nunca: se aborta la espera a los 15 s. */
export const SUBMIT_TIMEOUT_MS = 15_000

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms)
  })
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer))
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface AccessRequest {
  email: string
  name: string
  reason: string
  uid: string | null
  status: RequestStatus
  /** Milisegundos desde epoch. */
  createdAt: number
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 'sent': escrita. 'alreadyExists': ya había solicitud (Firestore devuelve permission-denied porque
 * el segundo create se evalúa como update; sin login no se puede distinguir de otro rechazo).
 * 'ignored': honeypot relleno, no se escribe nada. 'error': validación o fallo de red (la UI avisa).
 */
export type SubmitResult = 'sent' | 'alreadyExists' | 'ignored' | 'error'

export interface SubmitInput {
  email: string
  name: string
  reason?: string
  uid?: string
  honeypot?: string
}

function errorCode(e: unknown): string | undefined {
  return typeof e === 'object' && e !== null && 'code' in e
    ? String((e as { code: unknown }).code)
    : undefined
}

export async function submitAccessRequest(input: SubmitInput): Promise<SubmitResult> {
  // El honeypot es solo del cliente: nunca llega a Firestore.
  if (input.honeypot) return 'ignored'
  const email = normalizeEmail(input.email)
  const name = input.name.trim()
  const reason = (input.reason ?? '').trim()
  if (
    !EMAIL_RE.test(email) ||
    email.length > LIMITS.email ||
    name.length < 1 ||
    name.length > LIMITS.name ||
    reason.length > LIMITS.reason
  ) {
    return 'error'
  }
  try {
    await withTimeout(
      setDoc(doc(db, 'accessRequests', email), {
        email,
        name,
        reason,
        uid: input.uid ?? null,
        status: 'pending',
        createdAt: serverTimestamp(),
      }),
      SUBMIT_TIMEOUT_MS,
    )
    return 'sent'
  } catch (e) {
    return errorCode(e) === 'permission-denied' ? 'alreadyExists' : 'error'
  }
}

function toRequest(d: Record<string, unknown>): AccessRequest {
  const created = d.createdAt as { toMillis?: () => number } | null | undefined
  return {
    email: String(d.email ?? ''),
    name: String(d.name ?? ''),
    reason: String(d.reason ?? ''),
    uid: typeof d.uid === 'string' ? d.uid : null,
    status: d.status as RequestStatus,
    createdAt: created && typeof created.toMillis === 'function' ? created.toMillis() : 0,
  }
}

export async function getMyRequest(email: string): Promise<AccessRequest | null> {
  const snap = await getDoc(doc(db, 'accessRequests', normalizeEmail(email)))
  return snap.exists() ? toRequest(snap.data() as Record<string, unknown>) : null
}

export async function listPendingRequests(): Promise<AccessRequest[]> {
  const snap = await getDocs(query(collection(db, 'accessRequests'), where('status', '==', 'pending')))
  return snap.docs
    .map((d) => toRequest(d.data() as Record<string, unknown>))
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function approveRequest(email: string, adminEmail: string): Promise<void> {
  const id = normalizeEmail(email)
  const batch = writeBatch(db)
  batch.set(doc(db, 'allowlist', id), {
    addedAt: serverTimestamp(),
    addedBy: normalizeEmail(adminEmail),
  })
  batch.update(doc(db, 'accessRequests', id), { status: 'approved' })
  await batch.commit()
}

export async function rejectRequest(email: string): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'accessRequests', normalizeEmail(email)), {
    status: 'rejected',
  })
  await batch.commit()
}

/** Cuenta de pendientes en vivo; sin consultas si no es admin. */
export function usePendingCount(isAdmin: boolean): number {
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isAdmin) {
      setCount(0)
      return
    }
    return onSnapshot(
      query(collection(db, 'accessRequests'), where('status', '==', 'pending')),
      (snap) => setCount(snap.size),
      () => {
        setCount(0)
        toast('error', tRef.current('access.loadFailed'))
      },
    )
  }, [isAdmin])
  return isAdmin ? count : 0
}
