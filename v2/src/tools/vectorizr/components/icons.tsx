// Iconos del editor (opción B aprobada): trazo de una tinta (currentColor) y el detalle clave en color de acento.
// Dibujados para esta herramienta en rejilla de 24 px; el color lo ponen las clases .vz-ico en vectorizr.css.

export type IconName =
  | 'select' | 'edit' | 'segment' | 'add' | 'eraser' | 'trash' | 'measure'
  | 'undo' | 'redo' | 'back' | 'fit' | 'zout' | 'zin' | 'rotl' | 'rotr'
  | 'path' | 'piece' | 'export' | 'home'

interface Def {
  /** Trazos en el color del texto. */
  main: string[]
  /** Detalle en color de acento. */
  acc?: string[]
  /** Círculos en el color del texto: [cx, cy, r]. */
  circ?: [number, number, number][]
  /** Círculo punteado (agujero). */
  dashedCirc?: boolean
  /** Puntos rellenos en color de acento: [cx, cy]. */
  dots?: [number, number][]
  /** Los trazos de acento van punteados (asas de una curva). */
  dashedAcc?: boolean
}

const TRASH = ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2']

const DEFS: Record<IconName, Def> = {
  select: { main: ['M4 4 11 21l2.5-7.5L21 11z'] },
  edit: { main: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'], acc: ['m15 5 4 4'] },
  segment: { main: ['M4 19C6 5 18 5 20 19'], acc: ['M4 19 6.5 8', 'M20 19 17.5 8'], dots: [[4, 19], [20, 19]], dashedAcc: true },
  add: { main: [], circ: [[9, 15, 3.5]], acc: ['M18 3v6', 'M15 6h6'] },
  eraser: { main: ['m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21', 'M22 21H7'], acc: ['m5 11 9 9'] },
  trash: { main: TRASH, acc: ['M10 11v6', 'M14 11v6'] },
  measure: {
    main: ['M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z'],
    acc: ['m14.5 12.5 2-2', 'm11.5 9.5 2-2', 'm8.5 6.5 2-2', 'm17.5 15.5 2-2'],
  },
  undo: { main: ['M9 14 4 9l5-5'], acc: ['M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11'] },
  redo: { main: ['m15 14 5-5-5-5'], acc: ['M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13'] },
  back: { main: ['m12 19-7-7 7-7'], acc: ['M19 12H5'] },
  fit: { main: ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'], acc: ['M9 9h6v6H9z'] },
  zout: { main: ['m21 21-4.3-4.3'], circ: [[11, 11, 7]], acc: ['M8 11h6'] },
  zin: { main: ['m21 21-4.3-4.3'], circ: [[11, 11, 7]], acc: ['M11 8v6', 'M8 11h6'] },
  rotl: { main: ['M3 3v5h5'], acc: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'] },
  rotr: { main: ['M21 3v5h-5'], acc: ['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'] },
  path: { main: [], circ: [[10, 14, 6]], dashedCirc: true, acc: ['M19 3v6', 'M16 6h6'] },
  piece: { main: ['M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z', 'M14 2v6h6'], acc: ['M12 18v-6', 'M9 15h6'] },
  export: { main: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'], acc: ['m7 10 5 5 5-5', 'M12 15V3'] },
  home: {
    main: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'],
    acc: ['M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  },
}

/** Icono decorativo: el nombre accesible lo da el texto o el aria-label del botón. */
export function Icon({ name, inline = false }: { name: IconName; inline?: boolean }) {
  const d = DEFS[name]
  return (
    <svg className={`vz-ico${inline ? ' vz-ico--inline' : ''}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {d.main.map((p) => (
        <path key={p} d={p} />
      ))}
      {(d.circ ?? []).map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} strokeDasharray={d.dashedCirc ? '3 2.5' : undefined} />
      ))}
      {(d.acc ?? []).map((p) => (
        <path key={p} className="a" d={p} strokeDasharray={d.dashedAcc ? '2 2' : undefined} />
      ))}
      {(d.dots ?? []).map(([cx, cy]) => (
        <circle key={`dot-${cx}-${cy}`} className="f" cx={cx} cy={cy} r="1.8" />
      ))}
    </svg>
  )
}
