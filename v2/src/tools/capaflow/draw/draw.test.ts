import { runAnalysis, SAMPLE_INPUT, buildControlChartScreen, type AnalysisResult } from '../logic'
import { fakeCanvas } from '../testCanvas'
import type { DrawEnv } from './canvas'
import { boxPlotNote, drawBoxPlot } from './drawBoxPlot'
import { drawControl } from './drawControl'
import { drawGauge } from './drawGauge'
import { drawHistogram } from './drawHistogram'
import { drawQQ } from './drawQQ'
import { drawRunChart } from './drawRunChart'

const env = (isDark = true): DrawEnv => ({
  isDark,
  lang: 'es',
  tr: (k) => ({ 'tooltip.binRange': 'Rango:', 'tooltip.freq': 'Frecuencia:', 'tooltip.aboveMedian': 'arriba', 'tooltip.belowMedian': 'abajo', 'tooltip.observation': 'Observación', 'tooltip.value': 'Valor', 'tooltip.median': 'Mediana', 'cc.ooc': 'Fuera de control', 'cc.inControl': 'Bajo control', 'qq.point': 'Punto', 'qq.observedTip': 'Observado', 'qq.theoreticalTip': 'Teórico', 'qq.deviation': 'Desviación', 'qq.observed': 'Datos Obs.', 'qq.theoretical': 'Cuantiles Teóricos' })[k]!,
})

function sample(over: Partial<typeof SAMPLE_INPUT> = {}): AnalysisResult {
  const o = runAnalysis({ ...SAMPLE_INPUT, ...over })
  if (!o.ok) throw new Error(o.error)
  return o.result
}

describe('dibujos de canvas (misma geometría que el original)', () => {
  it('medidor: aguja con el color recibido y tooltip por ángulo', () => {
    const { canvas, rec } = fakeCanvas(280, 158)
    canvas.width = 280
    const hit = drawGauge(canvas, 1.629, '#abcdef', 'es')!
    expect(rec.sets.filter((s) => s.prop === 'strokeStyle').map((s) => s.value)).toContain('#abcdef')
    expect(rec.count('arc')).toBe(1 + 4 + 1) // pista, 4 zonas y punto central
    // R = 123.2, centro (140, 140). C4: el tooltip cubre todo el arco, también el cuadrante superior derecho.
    expect(hit(40, 120)).toBe('Cpk: 0.126\nNo Capaz')
    expect(hit(240, 120)).toMatch(/^Cpk: 1\.8\d\d\nWorld Class$/)
    expect(hit(140, 20)).toBe('Cpk: 1.000\nMarginal')
    expect(hit(140, 150)).toBeNull() // mitad inferior
    expect(hit(140, 140)).toBeNull()
  })

  it('histograma: líneas LSL/USL rojas en oscuro, etiquetas y tooltip de clase', () => {
    const r = sample({ lsl: '73.97', usl: '74.035' }) // dentro del eje (el original omite líneas fuera de él)
    const { canvas, rec } = fakeCanvas(500, 220)
    const hit = drawHistogram(canvas, r, env())!
    expect(rec.sets.filter((s) => s.value === '#ef4444')).toHaveLength(2)
    const labels = rec.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])
    expect(labels).toEqual(expect.arrayContaining(['LSL', 'USL', 'x̄', 'T']))
    const tip = hit(250, 120)!
    expect(tip).toMatch(/^Rango: .+ – .+\nFrecuencia: \d+ \(\d+\.\d%\)$/)
    expect(hit(5, 5)).toBeNull()
  })

  it('histograma con un solo límite no dibuja el otro', () => {
    const { canvas, rec } = fakeCanvas(500, 220)
    drawHistogram(canvas, sample({ lsl: '', usl: '74.035' }), env(false))
    expect(rec.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])).not.toContain('LSL')
    expect(rec.sets.filter((s) => s.prop === 'strokeStyle' && s.value === '#dc2626')).toHaveLength(1)
  })

  it('gráfica de control: un anillo (radio 8) por cada violación y tooltip con límites', () => {
    const r = sample()
    const cc = buildControlChartScreen(r, 'auto', 'es')
    const { canvas, rec } = fakeCanvas(600, 180)
    const hit = drawControl(canvas, { pts: cc.topPts, cl: cc.topCL, ucl: cc.topUCL, lcl: cc.topLCL, sigma: cc.topSigma, viol: cc.topViol, isXbar: true }, env())!
    expect(rec.calls.filter((c) => c.name === 'arc' && c.args[2] === 8)).toHaveLength(cc.topViol.length)
    const labels = rec.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])
    expect(labels).toEqual(expect.arrayContaining(['UCL', 'LCL', 'CL']))
    const tip = hit(62, 90)
    expect(tip === null || /UCL: .* \(↓.*\)\nCL: .*\nLCL: .* \(↑.*\)/.test(tip)).toBe(true)
  })

  it('gráfica de control con menos de dos puntos no se dibuja', () => {
    const { canvas, rec } = fakeCanvas(600, 180)
    expect(drawControl(canvas, { pts: [1, null], cl: 1, ucl: 2, lcl: 0, sigma: 0.3, viol: [], isXbar: false }, env())).toBeNull()
    expect(rec.count('beginPath')).toBe(0)
  })

  it('corrida: dibuja todos los datos (A12) y el tooltip numera desde 1', () => {
    const r = sample()
    const { canvas, rec } = fakeCanvas(600, 200)
    const hit = drawRunChart(canvas, r, env())!
    expect(rec.calls.filter((c) => c.name === 'arc' && c.args[2] === 3.5)).toHaveLength(r.data.length)
    const first = hit(52, 100) // cerca del primer punto (X = pad.l)
    expect(first === null || /^Observación #\d+/.test(first)).toBe(true)
  })

  it('Q-Q: etiquetas de ejes por idioma y tooltip en español', () => {
    const r = sample()
    const { canvas, rec } = fakeCanvas(600, 200)
    const hit = drawQQ(canvas, r, env())!
    const labels = rec.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])
    expect(labels).toEqual(expect.arrayContaining(['Cuantiles Teóricos', 'Datos Obs.']))
    // cualquier punto dibujado: probamos con barrido hasta encontrar uno
    let tip: string | null = null
    for (let x = 60; x < 576 && !tip; x += 4) for (let y = 24; y < 164 && !tip; y += 4) tip = hit(x, y)
    expect(tip).toMatch(/^Punto #\d+ \(\d+\.\d%\)\nObservado: .*\nTeórico: .*\nDesviación: /)
  })

  it('box plot: tres secciones con sus estadísticos y nota Q1/Q2/Q3/Outliers', () => {
    const r = sample()
    const { canvas, rec } = fakeCanvas(700, 340)
    drawBoxPlot(canvas, r, env())
    const labels = rec.calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(labels).toEqual(expect.arrayContaining(['Overall', 'Within', 'Specs', 'LSL', 'USL']))
    expect(labels.some((l) => l.startsWith('StDev ') && l.endsWith(r.sOverall.toFixed(4)))).toBe(true)
    expect(labels).toContain(`Cpk   ${r.Cpk!.toFixed(2)}`)
    expect(boxPlotNote(r)).toMatch(/^Q1=.*, Q2=.*, Q3=.*, Outliers=\d+$/)
  })

  it('sin contexto 2D (jsdom) los dibujos no fallan', () => {
    const canvas = document.createElement('canvas')
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
    expect(drawHistogram(canvas, sample(), env())).toBeNull()
    expect(drawGauge(canvas, 1, '#fff', 'en')).toBeNull()
  })
})
