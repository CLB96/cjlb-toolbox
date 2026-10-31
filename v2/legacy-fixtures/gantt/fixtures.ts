import type { StoredTask } from '../../src/tools/gantt/logic/types'

/** Hoy fijo de las pruebas (viernes). */
export const TODAY = new Date(2026, 9, 30)

const T = (
  id: number,
  name: string,
  start: string,
  end: string,
  status: StoredTask['status'],
  parentId: number | null = null,
  comment = '',
): StoredTask => ({ id, name, start, end, status, comment, parentId })

/** Fixtures representativas: plano, árbol de 3 niveles, vencidas/tarde, cruce de año y vacío. */
export const FIXTURES: Record<string, StoredTask[]> = {
  flat: [
    T(1, 'Análisis de sustrato KM74', '2026-10-24', '2026-10-28', 'done'),
    T(2, 'Validación de herramental', '2026-10-27', '2026-11-03', 'prog'),
    T(3, 'Prueba de temperatura ciclo', '2026-10-31', '2026-11-07', 'pend'),
    T(4, 'Revisión de patrón de costura', '2026-10-29', '2026-11-04', 'prog'),
    T(5, 'Entrega de reporte R&D', '2026-11-05', '2026-11-11', 'pend'),
    T(6, 'Aprobación cliente GM', '2026-11-02', '2026-11-02', 'bloc', null, 'Esperando firma'),
  ],
  tree: [
    T(1, 'Proyecto línea 3', '2026-10-20', '2026-10-25', 'pend'),
    T(2, 'Moldes', '2026-10-22', '2026-10-28', 'done', 1),
    T(3, 'Herramental', '2026-10-26', '2026-11-12', 'pend', 1),
    T(4, 'Fixture A', '2026-10-27', '2026-11-02', 'prog', 3),
    T(5, 'Fixture B', '2026-11-03', '2026-11-12', 'bloc', 3),
    T(6, 'Zeta independiente', '2026-10-21', '2026-10-23', 'done'),
    T(7, 'alfa independiente', '2026-11-01', '2026-11-06', 'late'),
  ],
  overdue: [
    T(1, 'Vencida pendiente', '2026-10-10', '2026-10-20', 'pend'),
    T(2, 'Vencida en progreso', '2026-10-12', '2026-10-29', 'prog'),
    T(3, 'Tarde pendiente', '2026-10-28', '2026-11-04', 'pend'),
    T(4, 'Hoy exacto', '2026-10-30', '2026-10-30', 'pend'),
    T(5, 'Terminada atrasada', '2026-10-01', '2026-10-05', 'done'),
    T(6, 'Bloqueada vencida', '2026-10-15', '2026-10-25', 'bloc'),
    T(7, 'Hija vencida', '2026-10-16', '2026-10-18', 'pend', 2),
  ],
  yearEnd: [
    T(1, 'Cierre anual', '2026-12-20', '2027-01-08', 'pend'),
    T(2, 'Inventario', '2026-12-28', '2027-01-02', 'prog', 1),
    T(3, 'Auditoría', '2027-01-05', '2027-02-03', 'pend'),
  ],
  empty: [],
}
