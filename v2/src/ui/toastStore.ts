import { create } from 'zustand'

export type ToastKind = 'info' | 'ok' | 'warn' | 'error'
export type ToastItem = { id: number; kind: ToastKind; message: string }

export const TOAST_TTL_MS = 5000

type ToastState = { toasts: ToastItem[] }

export const useToasts = create<ToastState>(() => ({ toasts: [] }))

let nextId = 1

export function dismissToast(id: number): void {
  useToasts.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}

export function toast(kind: ToastKind, message: string): void {
  const id = nextId++
  useToasts.setState((s) => ({ toasts: [...s.toasts, { id, kind, message }] }))
  setTimeout(() => dismissToast(id), TOAST_TTL_MS)
}
