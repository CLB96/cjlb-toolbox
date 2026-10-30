import type { AppUser } from './authService'

export function greetingName(u: Pick<AppUser, 'displayName' | 'email'>): string {
  return u.displayName?.trim() || u.email
}
