// Ayudantes de piezas: colores, cantidad, nombres de archivo. Puro, sin React.
import type { ContourPoint, Piece } from '../types'

export const PIECE_COLORS = ['#d16bff', '#7cf0c4', '#ffd166', '#8fb4ff', '#ff8a9b', '#f59e0b', '#34d399', '#f472b6'] as const

export const pieceColor = (index: number): string => PIECE_COLORS[((index % PIECE_COLORS.length) + PIECE_COLORS.length) % PIECE_COLORS.length]!

export function clampQuantity(v: unknown): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 1
  return Math.min(999, Math.max(1, n))
}

export const pieceLabel = (piece: Piece, index: number): string => piece.name.trim() || `Pieza ${index + 1}`

export const fileSafeName = (label: string): string => label.replace(/[\/:*?"<>|]/g, '_')

/** Nombres de archivo válidos y únicos; los repetidos llevan -2, -3… */
export function uniqueFileNames(labels: string[], ext: 'dxf' | 'svg' | 'pdf'): string[] {
  const used = new Map<string, number>()
  return labels.map((label, i) => {
    const base = fileSafeName(label.trim() || `Pieza-${i + 1}`)
    const n = (used.get(base) ?? 0) + 1
    used.set(base, n)
    return `${n === 1 ? base : `${base}-${n}`}.${ext}`
  })
}

let counter = 0
export function newPiece(index: number, points: ContourPoint[] = []): Piece {
  counter += 1
  return { id: `piece-${Date.now().toString(36)}-${counter}`, name: `Pieza ${index + 1}`, quantity: 1, contourPoints: points, paths: [] }
}
