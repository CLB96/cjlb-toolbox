import type { ToolDef } from '../tools/types'
import { applyBadges, applyOrder, dropBefore, moveBy, parseBadge } from './customize'

const tool = (id: string, badge: ToolDef['badge'] = null) => ({ id, badge }) as ToolDef
const tools = [tool('gantt'), tool('gapcheck', 'new'), tool('bondline'), tool('capaflow', 'updated')]
const ids = (list: ToolDef[]) => list.map((t) => t.id)

describe('applyOrder', () => {
  test('sin orden guardado conserva el orden de tools.json', () => {
    expect(ids(applyOrder(tools, undefined))).toEqual(['gantt', 'gapcheck', 'bondline', 'capaflow'])
    expect(ids(applyOrder(tools, null))).toEqual(['gantt', 'gapcheck', 'bondline', 'capaflow'])
  })
  test('aplica el orden guardado', () => {
    const saved = ['capaflow', 'bondline', 'gapcheck', 'gantt']
    expect(ids(applyOrder(tools, saved))).toEqual(saved)
  })
  test('una herramienta nueva aparece al final y una quitada se ignora', () => {
    expect(ids(applyOrder(tools, ['bondline', 'vieja', 'gantt']))).toEqual(['bondline', 'gantt', 'gapcheck', 'capaflow'])
  })
  test('ignora valores dañados, duplicados o que no son texto', () => {
    expect(ids(applyOrder(tools, 'gantt'))).toEqual(['gantt', 'gapcheck', 'bondline', 'capaflow'])
    expect(ids(applyOrder(tools, ['bondline', 'bondline', 3, 'gantt']))).toEqual(['bondline', 'gantt', 'gapcheck', 'capaflow'])
  })
})

describe('moveBy', () => {
  const order = ['a', 'b', 'c']
  test('mueve antes y después sin modificar el original', () => {
    expect(moveBy(order, 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moveBy(order, 'b', 1)).toEqual(['a', 'c', 'b'])
    expect(order).toEqual(['a', 'b', 'c'])
  })
  test('en los extremos o con un id desconocido no cambia nada', () => {
    expect(moveBy(order, 'a', -1)).toEqual(order)
    expect(moveBy(order, 'c', 1)).toEqual(order)
    expect(moveBy(order, 'z', 1)).toEqual(order)
  })
})

describe('dropBefore', () => {
  const order = ['a', 'b', 'c', 'd']
  test('al soltar hacia adelante queda después del destino; hacia atrás, antes', () => {
    expect(dropBefore(order, 'a', 'c')).toEqual(['b', 'c', 'a', 'd'])
    expect(dropBefore(order, 'd', 'b')).toEqual(['a', 'd', 'b', 'c'])
  })
  test('soltar sobre sí misma o con ids desconocidos no cambia nada', () => {
    expect(dropBefore(order, 'b', 'b')).toEqual(order)
    expect(dropBefore(order, 'z', 'b')).toEqual(order)
    expect(dropBefore(order, 'b', 'z')).toEqual(order)
  })
})

describe('insignias', () => {
  test('sin valor guardado usa el de tools.json; con valor guardado lo reemplaza, incluido quitarla', () => {
    const out = applyBadges(tools, { gantt: 'updated', gapcheck: null })
    expect(out.map((t) => t.badge)).toEqual(['updated', null, null, 'updated'])
    expect(tools[1]!.badge).toBe('new')
  })
  test('parseBadge acepta solo new, updated o null', () => {
    expect(parseBadge('new')).toBe('new')
    expect(parseBadge('updated')).toBe('updated')
    expect(parseBadge(null)).toBeNull()
    expect(parseBadge('otro')).toBeUndefined()
    expect(parseBadge(undefined)).toBeUndefined()
  })
})
