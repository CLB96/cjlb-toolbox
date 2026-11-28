import { act, renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { describe, expect, it } from 'vitest'
import { useImagePrep } from './useImagePrep'

/** Lienzo de 100×100 px de pantalla para una foto de 100×100 (1 px de pantalla = 1 px de foto). */
function fakeCanvas() {
  const parent = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }
  return {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    parentElement: parent,
    setPointerCapture: () => {},
  } as unknown as HTMLCanvasElement
}
const ev = (canvas: HTMLCanvasElement, x: number, y: number) => ({ currentTarget: canvas, clientX: x, clientY: y, button: 0, pointerId: 1 }) as unknown as PointerEvent<HTMLCanvasElement>

function setup() {
  const canvas = fakeCanvas()
  const hook = renderHook(() => useImagePrep(100, 100))
  return { canvas, hook }
}

describe('useImagePrep: Ignorar zona', () => {
  it('el pincel guarda un trazo sin relleno y crece mientras se arrastra', () => {
    const { canvas, hook } = setup()
    act(() => {
      hook.result.current.setTool('erase')
    })
    act(() => hook.result.current.handlers.onPointerDown(ev(canvas, 10, 10)))
    act(() => hook.result.current.handlers.onPointerMove(ev(canvas, 20, 10)))
    act(() => hook.result.current.handlers.onPointerUp())
    const [s] = hook.result.current.prep.strokes
    expect(hook.result.current.prep.strokes).toHaveLength(1)
    expect(s!.fill).toBeUndefined()
    expect(s!.points).toHaveLength(2)
    expect(hook.result.current.canUndo).toBe(true)
  })

  it('el lazo guarda un trazo con relleno y descarta los puntos casi iguales', () => {
    const { canvas, hook } = setup()
    act(() => {
      hook.result.current.setTool('erase')
      hook.result.current.setEraseMode('lasso')
    })
    act(() => hook.result.current.handlers.onPointerDown(ev(canvas, 10, 10)))
    act(() => hook.result.current.handlers.onPointerMove(ev(canvas, 11, 10))) // menos de 3 px: no cuenta
    act(() => hook.result.current.handlers.onPointerMove(ev(canvas, 40, 10)))
    act(() => hook.result.current.handlers.onPointerMove(ev(canvas, 40, 40)))
    act(() => hook.result.current.handlers.onPointerUp())
    const [s] = hook.result.current.prep.strokes
    expect(s!.fill).toBe(true)
    expect(s!.points).toEqual([{ x: 10, y: 10 }, { x: 40, y: 10 }, { x: 40, y: 40 }])
    expect(hook.result.current.hover).toBeNull() // el lazo no muestra el círculo del pincel
  })

  it('un clic suelto con el lazo no encierra nada: se descarta y no deja paso de deshacer', () => {
    const { canvas, hook } = setup()
    act(() => {
      hook.result.current.setTool('erase')
      hook.result.current.setEraseMode('lasso')
    })
    act(() => hook.result.current.handlers.onPointerDown(ev(canvas, 10, 10)))
    act(() => hook.result.current.handlers.onPointerUp())
    expect(hook.result.current.prep.strokes).toHaveLength(0)
    expect(hook.result.current.canUndo).toBe(false)
  })

  it('deshacer quita el último lazo', () => {
    const { canvas, hook } = setup()
    act(() => {
      hook.result.current.setTool('erase')
      hook.result.current.setEraseMode('lasso')
    })
    act(() => hook.result.current.handlers.onPointerDown(ev(canvas, 10, 10)))
    act(() => hook.result.current.handlers.onPointerMove(ev(canvas, 50, 10)))
    act(() => hook.result.current.handlers.onPointerMove(ev(canvas, 50, 50)))
    act(() => hook.result.current.handlers.onPointerUp())
    expect(hook.result.current.prep.strokes).toHaveLength(1)
    act(() => hook.result.current.undo())
    expect(hook.result.current.prep.strokes).toHaveLength(0)
  })
})

describe('useImagePrep: quitar una zona suelta', () => {
  function withTwoStrokes() {
    const { canvas, hook } = setup()
    act(() => hook.result.current.setTool('erase'))
    for (const x of [10, 60]) {
      act(() => hook.result.current.handlers.onPointerDown(ev(canvas, x, 10)))
      act(() => hook.result.current.handlers.onPointerMove(ev(canvas, x + 20, 10)))
      act(() => hook.result.current.handlers.onPointerUp())
    }
    return hook
  }

  it('quita solo la zona elegida y se puede deshacer', () => {
    const hook = withTwoStrokes()
    expect(hook.result.current.prep.strokes).toHaveLength(2)
    const second = hook.result.current.prep.strokes[1]
    act(() => hook.result.current.removeStroke(0))
    expect(hook.result.current.prep.strokes).toEqual([second])
    act(() => hook.result.current.undo())
    expect(hook.result.current.prep.strokes).toHaveLength(2)
  })

  it('al quitarla se apaga el resalte y se pide detectar de nuevo', () => {
    const hook = withTwoStrokes()
    const tick = hook.result.current.tick
    act(() => hook.result.current.setHighlight(1))
    expect(hook.result.current.highlight).toBe(1)
    act(() => hook.result.current.removeStroke(1))
    expect(hook.result.current.highlight).toBeNull()
    expect(hook.result.current.tick).toBeGreaterThan(tick)
  })
})
