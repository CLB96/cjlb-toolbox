// Reglas de pantalla: port de Quick-Nesting-Entrega/tests/plans.test.cjs y frontend.test.cjs.
import { completionMessage, planSummary, requestOptions, rotatePoints, selectedAngle, selectedLayout, validateMargin, validateSettings } from '../logic/plans'
import type { Request, Settings } from '../logic/plans'
import { nest } from '../logic/roll'
import { qnText } from '../i18n'
import { job, square } from './helpers'

const base: Settings = { width: 22, length: 22, gap: 2, mode: 'auto', quantity: 1, rotation: 'fixed', angle: 0 }
const off = { marginEnabled: false, margin: 10, multiplePlies: false }

describe('reglas de pantalla', () => {
  it('petición: automático envía largo; manual por capa no; varias capas envía largo de capa', () => {
    expect(requestOptions(base, off)).toEqual({ ...base, margin: 0 })
    const manual = requestOptions({ ...base, mode: 'manual', quantity: 5 }, off)
    expect(manual.length).toBeUndefined()
    expect(manual.plyMode).toBeUndefined()
    const total = requestOptions({ ...base, mode: 'manual', quantity: 5 }, { ...off, multiplePlies: true })
    expect([total.plyMode, total.plyLength, total.length]).toEqual(['total', 22, undefined])
    expect(requestOptions(base, { ...off, marginEnabled: true }).margin).toBe(10)
  })

  it('valida en el orden del original', () => {
    const ok: Request = requestOptions(base, off)
    expect(validateSettings(ok, 1, true)).toBeNull()
    expect(validateSettings({ ...ok, width: NaN }, 1, true)).toBe('invalid_dimensions')
    expect(validateSettings({ ...ok, width: 100001 }, 1, true)).toBe('invalid_dimensions')
    expect(validateSettings({ ...ok, gap: -1 }, 1, true)).toBe('invalid_gap')
    expect(validateSettings({ ...ok, margin: 11 }, 1, true)).toBe('invalid_margin')
    expect(validateSettings({ ...ok, mode: 'manual', quantity: 1.5 }, 1, true)).toBe('invalid_quantity')
    expect(validateSettings({ ...ok, angle: 361 }, 1, true)).toBe('invalid_angle')
    expect(validateSettings(ok, 0, true)).toBe('select_piece')
    expect(validateSettings(ok, 2, true)).toBe('auto_one_piece')
    expect(validateSettings(ok, 1, false)).toBe('confirm_scale')
    expect(validateSettings({ ...ok, mode: 'manual', quantity: 3, length: undefined }, 2, true)).toBeNull()
  })

  it('margen: debe dejar ancho y largo útiles', () => {
    expect(validateMargin({ ...requestOptions(base, off), margin: 11 })).toBe('invalid_margin')
    expect(validateMargin({ ...requestOptions(base, off), margin: 10.9 })).toBeNull()
    expect(validateMargin({ ...requestOptions(base, off), margin: -1 })).toBe('invalid_margin')
    expect(validateMargin({ ...requestOptions({ ...base, width: 100 }, off), margin: 11 })).toBe('invalid_margin')
  })

  it('ángulo: preajuste o personalizado; vacío no es 0', () => {
    expect(selectedAngle('90', '15')).toBe(90)
    expect(selectedAngle('custom', '22.5')).toBe(22.5)
    expect(selectedAngle('custom', ' ')).toBeNaN()
  })

  it('la vista previa gira desde el original y apoya en el origen', () => {
    const pts = rotatePoints([[0, 0], [20, 0], [20, 10], [0, 10]], 90)
    expect(Math.min(...pts.map((p) => p[0]))).toBeCloseTo(0, 12)
    expect(Math.max(...pts.map((p) => p[1]))).toBeCloseTo(20, 12)
  })

  it('resumen del plan y grupo mostrado', () => {
    const result = nest({ ...job({ pieces: [square()] }), mode: 'manual', quantity: 5, plyMode: 'total', plyLength: 22 })
    const summary = planSummary(result)!
    expect(summary).toMatchObject({ pieces: 5, requested: 5, layers: 2, full: 1, partial: 1, length: 44, complete: true, inconsistent: false })
    expect(selectedLayout(result, 'g1')).toBe(result.plyPlan!.groups[1])
    expect(selectedLayout(result, 'nope')).toBe(result.plyPlan!.groups[0])
    expect(completionMessage(result).key).toBe('status_request_fulfilled')
    const broken = { ...result, plyPlan: { ...result.plyPlan!, totalPieces: 6 } }
    expect(completionMessage(broken).key).toBe('planInconsistent')
  })

  it('mensaje final: completo con límite y estado desconocido', () => {
    const result = nest({ ...job({ pieces: [square()] }), mode: 'manual', quantity: 5, plyMode: 'total', plyLength: 22 })
    expect(completionMessage({ ...result, status: 'piece_limit' }).key).toBe('planCompleteLimited')
    expect(completionMessage({ ...nest(job()), status: 'raro' as never }).key).toBe('status_partial')
    expect(selectedLayout(null, null)).toBeNull()
  })

  it('textos: marcador sin valor se muestra como «—»', () => {
    expect(qnText('es', 'selected', { count: 2 })).toBe('2 contorno(s) seleccionado(s)')
    expect(qnText('en', 'resultDetails', { gap: 2 })).toBe('Requested minimum separation: 2 mm · time: — s · missing: —')
  })
})
