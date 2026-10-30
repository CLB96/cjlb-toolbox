// Hojas sintéticas (filas crudas como las entrega sheet_to_json con header:1, defval:null).
// Ventana de activación del original: 30 s desde la primera fila en que todas las TC >= min.

const ROWS = 120

/** Perfil base: sube de 25 a `plateau` en 50 s, mantiene hasta 85 s y enfría hasta 30. */
function profile(t: number, plateau: number): number {
  if (t < 50) return 25 + ((plateau - 25) * t) / 50
  if (t < 85) return plateau
  return plateau - ((plateau - 30) * (t - 85)) / (ROWS - 1 - 85)
}

function build(plateaus: number[], rows = ROWS): unknown[][] {
  return Array.from({ length: rows }, (_, t) => plateaus.map((p, i) => Math.round((profile(t, p) + i * 0.1) * 10) / 10))
}

const plain = build([66, 67, 68, 69])

const outOfRange = plain.map((row, t) => (t >= 62 && t <= 66 ? [row[0], row[1], row[2], 80.5] : row))

const neverActivates = build([50, 51, 52, 53])

const windowPastEnd: unknown[][] = Array.from({ length: ROWS }, (_, t) =>
  [0, 1, 2, 3].map((i) => (t < 110 ? 25 + (t * 29) / 110 + i * 0.05 : 60 + i * 0.1)),
)

const blankRows: unknown[][] = []
plain.forEach((row, t) => {
  blankRows.push(row)
  if (t === 20) blankRows.push([null, null, null, null])
  if (t === 60) blankRows.push(['', '', '', ''])
})
blankRows.push([null, null, null, null], [null, null, null, null])

const interiorNulls = plain.map((row, t) => {
  if (t === 30) return [null, row[1], row[2], row[3]]
  if (t >= 70 && t <= 72) return [row[0], row[1], null, row[3]]
  return row
})

const textColumn: unknown[][] = plain.map((row, t) => [`a las 10:00:${String(t % 60).padStart(2, '0')}`, ...row])

const numericStrings: unknown[][] = [
  ['12abc', 20],
  ['1,5', 30],
  [' 60 ', 40],
  ['x', 50],
]

const trailingNulls: unknown[][] = Array.from({ length: 12 }, (_, t) => [
  t < 8 ? 30 + t : null,
  t < 10 ? 31 + t : null,
  t < 12 ? 32 + t : null,
])

export const FIXTURES: Record<string, unknown[][]> = {
  plain,
  outOfRange,
  neverActivates,
  windowPastEnd,
  blankRows,
  interiorNulls,
  textColumn,
  numericStrings,
  trailingNulls,
  empty: [],
  allText: [
    ['Time', 'Probe'],
    ['a', 'b'],
  ],
}
