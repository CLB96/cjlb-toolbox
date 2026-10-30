// Referencia legacy de GapCheck: copia literal de las expresiones del original
// (gapcheck/index.html) con las lecturas de DOM reemplazadas por parámetros.
// Origen por función:
//   legacyProcessData        <- processData, líneas 2205-2247
//   legacyComputeGapCheck    <- computeGapCheck, líneas 2147-2166
//   legacyStats              <- applyChartFilters pasos 1-2, líneas 2336-2363
//   legacyStatus             <- tabla de estados, líneas 2368-2380
//   legacyPointStyle         <- estilo de puntos del gráfico, líneas 2401-2406
//   legacyIterDataset        <- iterDataset, líneas 2321-2329
//   legacyCompressionTick    <- callback del eje derecho, líneas 2531-2556
//   legacyDefaultMarkerPositions <- createGapPointMarkers, líneas 2678-2720

export interface LegacyPoint {
  name: string
  values: number[]
}

export function legacyProcessData(
  jsonRows: unknown[][],
): { points: LegacyPoint[]; maxIter: number } | null {
  if (!jsonRows || jsonRows.length === 0) return null

  const firstRow: any[] = jsonRows[0] || []
  const hasHeaders = firstRow.some(
    (cell) => typeof cell === 'string' && cell.trim() !== '' && isNaN(cell as any),
  )
  const dataStart = hasHeaders ? 1 : 0
  const numCols = Math.max(...jsonRows.map((r) => (r || []).length))

  const points: LegacyPoint[] = []
  for (let col = 0; col < numCols; col++) {
    const rawName = hasHeaders ? firstRow[col] : undefined
    const name =
      rawName !== undefined && rawName !== null && String(rawName).trim() !== ''
        ? String(rawName).trim()
        : `P${col + 1}`

    const values: number[] = []
    for (let row = dataStart; row < jsonRows.length; row++) {
      const cell: any = (jsonRows[row] || [])[col]
      if (typeof cell === 'number' && !isNaN(cell)) {
        values.push(cell)
      } else if (typeof cell === 'string' && cell.trim() !== '' && !isNaN(parseFloat(cell))) {
        values.push(parseFloat(cell))
      }
    }
    if (values.length > 0) points.push({ name, values })
  }

  if (points.length === 0) return null

  const maxIter = Math.max(...points.map((p) => p.values.length))
  return { points, maxIter }
}

export interface LegacyGapInputs {
  coveringType: 'hard' | 'soft'
  skin: string
  pct: string
  skinSoft: string
  foam: string
  pctSoft: string
}

export function legacyComputeGapCheck(i: LegacyGapInputs): {
  target: number
  valueText: string
  formulaHtml: string
} {
  let result: number, formula: string
  if (i.coveringType === 'hard') {
    const skin = parseFloat(i.skin) || 0
    const pct = parseFloat(i.pct) || 0
    const factor = 1 - pct / 100
    result = skin * factor
    formula = `Skin × (1 - ${pct}%)  →  ${skin} × ${factor.toFixed(2)} = <strong>${result.toFixed(2)} mm</strong>`
  } else {
    const skin = parseFloat(i.skinSoft) || 0
    const foam = parseFloat(i.foam) || 0
    const pct = parseFloat(i.pctSoft) || 0
    const factor = 1 - pct / 100
    result = skin + foam * factor
    formula = `Skin + Foam × (1 - ${pct}%)  →  ${skin} + ${foam} × ${factor.toFixed(2)} = <strong>${result.toFixed(2)} mm</strong>`
  }
  return { target: result, valueText: result.toFixed(2), formulaHtml: formula }
}

export function legacyStats(
  points: LegacyPoint[],
  visiblePoints: Set<number>,
  visibleIters: Set<number>,
  target: number,
): { totalRecords: string; avg: string; min: string; max: string; meeting: string } {
  const visibleValues: number[] = []
  points.forEach((p, i) => {
    if (visiblePoints.has(i)) {
      p.values.forEach((v, iterIdx) => {
        if (visibleIters.has(iterIdx) && v !== undefined && v !== null) {
          visibleValues.push(v)
        }
      })
    }
  })

  if (visibleValues.length > 0) {
    const avg = visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length
    const meetingCount = visibleValues.filter((v) => v <= target).length
    // textContent = number -> String(number), igual que el DOM
    return {
      totalRecords: String(visiblePoints.size),
      avg: avg.toFixed(2),
      min: String(Math.min(...visibleValues)),
      max: String(Math.max(...visibleValues)),
      meeting: meetingCount + ' / ' + visibleValues.length,
    }
  }
  return { totalRecords: '0', avg: '0', min: '0', max: '0', meeting: '0 / 0' }
}

export function legacyStatus(value: number, target: number): 'met' | 'warning' | 'notMet' {
  const tolerance = target * 0.1
  if (value <= target) return 'met'
  if (value <= target + tolerance) return 'warning'
  return 'notMet'
}

export function legacyPointStyle(
  y: number,
  target: number,
): { style: string; radius: number; hoverRadius: number; borderWidth: number } {
  return {
    style: y <= target ? 'circle' : 'crossRot',
    radius: y <= target ? 7 : 9,
    hoverRadius: y <= target ? 10 : 12,
    borderWidth: y <= target ? 1.5 : 3,
  }
}

export function legacyIterDataset(
  points: LegacyPoint[],
  visiblePoints: Set<number>,
  iterIdx: number,
): { x: number; y: number }[] {
  return points
    .map((p, i) => {
      if (!visiblePoints.has(i)) return null
      const val = p.values[iterIdx]
      return val !== undefined && val !== null ? { x: i + 1, y: val } : null
    })
    .filter(Boolean) as { x: number; y: number }[]
}

export function legacyCompressionTick(
  value: number,
  i: { coveringType: 'hard' | 'soft'; skin: string; skinSoft: string; foam: string },
): string {
  let compressionPercent: number
  if (i.coveringType === 'hard') {
    const skinValue = parseFloat(i.skin) || 0
    if (skinValue === 0) return '0%'
    compressionPercent = ((skinValue - value) / skinValue) * 100
  } else {
    const skinValue = parseFloat(i.skinSoft) || 0
    const foamValue = parseFloat(i.foam) || 0
    if (foamValue === 0) return '0%'
    const foamComprimidoActual = value - skinValue
    compressionPercent = ((foamValue - foamComprimidoActual) / foamValue) * 100
  }
  return compressionPercent.toFixed(0) + '%'
}

export function legacyDefaultMarkerPositions(count: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    let x: number, y: number
    if (count <= 3) {
      x = 20 + (i * 60) / count
      y = 50
    } else if (count <= 6) {
      const cols = Math.ceil(count / 2)
      const row = Math.floor(i / cols)
      const col = i % cols
      x = 15 + (col * 70) / cols
      y = 30 + row * 40
    } else if (count <= 12) {
      const cols = Math.ceil(count / 3)
      const row = Math.floor(i / cols)
      const col = i % cols
      x = 10 + (col * 80) / cols
      y = 25 + row * 30
    } else if (count <= 20) {
      const cols = Math.ceil(count / 4)
      const row = Math.floor(i / cols)
      const col = i % cols
      x = 8 + (col * 84) / cols
      y = 20 + row * 22
    } else if (count <= 30) {
      const cols = Math.ceil(count / 5)
      const row = Math.floor(i / cols)
      const col = i % cols
      x = 6 + (col * 88) / cols
      y = 15 + row * 18
    } else {
      const cols = Math.ceil(count / 6)
      const row = Math.floor(i / cols)
      const col = i % cols
      x = 5 + (col * 90) / cols
      y = 12 + row * 15
    }
    out.push({ x, y })
  }
  return out
}
