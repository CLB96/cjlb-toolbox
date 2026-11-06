// Piezas de prueba con muchos vértices, parecidas a las del DXF real: una «D» de ~198 × 277 mm
// (400 vértices) y una media luna larga de ~793 × 353 mm (600 vértices).
import type { Piece } from '../logic/types'

export function complexPieces(): [Piece, Piece] {
  const d: number[][] = []
  for (let i = 0; i < 400; i++) {
    const t = (i / 400) * Math.PI * 2
    const x = 99 + 99 * Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** (Math.cos(t) > 0 ? 0.6 : 0.2)
    const y = 138.5 + 138.5 * Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** 0.5
    d.push([x, y])
  }
  const moon: number[][] = []
  for (let i = 0; i <= 300; i++) {
    const t = Math.PI * (i / 300)
    moon.push([2000 + 396.5 - 396.5 * Math.cos(t), 353 * Math.sin(t)])
  }
  for (let i = 300; i >= 0; i--) {
    const t = Math.PI * (i / 300)
    moon.push([2000 + 396.5 - 300 * Math.cos(t), 150 * Math.sin(t)])
  }
  return [{ id: 'c1', points: d }, { id: 'c2', points: moon.slice(0, -1) }]
}
