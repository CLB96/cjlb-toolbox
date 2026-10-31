import { describe, expect, it } from 'vitest'
import { pngTaskColWidth } from './exportPng'

describe('PNG', () => {
  it('la columna de tareas nunca es más angosta que 280 px (mejora B2)', () => {
    expect([pngTaskColWidth(80), pngTaskColWidth(280), pngTaskColWidth(420)]).toEqual([280, 280, 420])
  })
})
