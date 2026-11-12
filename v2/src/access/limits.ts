/** Límites idénticos a firestore.rules (accessRequests). */
export const LIMITS = { email: 254, name: 80, reason: 500 } as const

/** Largo mínimo de contraseña en altas por el admin y en el cambio de contraseña. */
export const MIN_PASSWORD = 8
