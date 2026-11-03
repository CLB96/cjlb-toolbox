/** Excel del estudio: datos, resumen, ANOVA y componentes. */
import ExcelJS from 'exceljs'
import type { EstudioResultado } from '../logic/types'
import type { Diseno, Reading } from '../logic/parse'
import { TEXTOS } from '../i18n'
import { descargarBlob, nombreArchivo } from './descargar'

export interface MetaExcel {
  pieza: string
  caracteristica: string
  especificacion: string
  lang: 'es' | 'en'
  fecha?: Date
}

const CABECERA = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2E1B52' } }

function pintarCabecera(fila: ExcelJS.Row) {
  fila.eachCell((cell) => {
    cell.fill = CABECERA
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })
}

export async function construirLibro(
  resultado: EstudioResultado,
  diseno: Diseno,
  lecturas: readonly Reading[],
  meta: MetaExcel,
): Promise<ExcelJS.Workbook> {
  const d = TEXTOS[meta.lang]
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CJLB Toolbox'
  wb.created = meta.fecha ?? new Date()

  const datos = wb.addWorksheet('Datos')
  datos.columns = [
    { header: 'Pieza', width: 14 }, { header: 'Operador', width: 22 },
    { header: 'Ensayo', width: 10 }, { header: 'Valor', width: 12 },
  ]
  pintarCabecera(datos.getRow(1))
  const orden = new Map(lecturas.map((l) => [`${l.pieza}|${l.operador}|${l.ensayo}`, l.valor]))
  for (const pieza of diseno.piezas) {
    for (const operador of diseno.operadores) {
      for (const ensayo of diseno.ensayos) {
        datos.addRow([pieza, operador, ensayo, orden.get(`${pieza}|${operador}|${ensayo}`) ?? null])
      }
    }
  }

  const resumen = wb.addWorksheet('Resumen')
  resumen.columns = [{ width: 30 }, { width: 28 }]
  const grr = resultado.pctGrrTolerancia ?? resultado.pctGrrVariacion
  const filas: [string, string | number][] = [
    [d.pieza, meta.pieza],
    [d.caracteristica, meta.caracteristica],
    [d.especificacion, meta.especificacion],
    [d.fecha, (meta.fecha ?? new Date()).toLocaleDateString(meta.lang === 'es' ? 'es-MX' : 'en-US')],
    [d.veredicto, d[
      resultado.veredicto === 'aceptable' ? 'vAceptable'
        : resultado.veredicto === 'condicional' ? 'vCondicional' : 'vNoAceptable']],
    [d.kpiGrr, Number(grr.toFixed(2))],
    [d.kpiNdc, resultado.ndc],
    [d.kpiEv, Number(resultado.componentes.ev.seis.toFixed(4))],
    [d.kpiAv, Number(resultado.componentes.av.seis.toFixed(4))],
    [d.compInt, Number(resultado.componentes.interaccion.seis.toFixed(4))],
    [d.compGrr, Number(resultado.componentes.grr.seis.toFixed(4))],
    [d.compPv, Number(resultado.componentes.parte.seis.toFixed(4))],
  ]
  for (const [k, v] of filas) resumen.addRow([k, v])

  const anova = wb.addWorksheet('ANOVA')
  anova.columns = [
    { header: d.fuente, width: 24 }, { header: d.gl, width: 8 }, { header: d.ss, width: 16 },
    { header: d.ms, width: 16 }, { header: d.f, width: 12 }, { header: d.p, width: 12 },
  ]
  pintarCabecera(anova.getRow(1))
  const nombres: Record<string, string> = {
    pieza: d.filaPieza, operador: d.filaOperador,
    interaccion: d.filaInteraccion, error: d.filaError,
  }
  for (const f of resultado.anova) {
    anova.addRow([nombres[f.fuente], f.gl, f.ss, f.ms, f.f, f.p])
  }

  const comp = wb.addWorksheet('Componentes')
  comp.columns = [
    { header: 'Componente', width: 24 }, { header: '6σ', width: 14 },
    { header: '% tolerancia', width: 14 }, { header: '% contribución', width: 16 },
  ]
  pintarCabecera(comp.getRow(1))
  const lista = [
    [d.compEv, resultado.componentes.ev],
    [d.compAv, resultado.componentes.av],
    [d.compInt, resultado.componentes.interaccion],
    [d.compGrr, resultado.componentes.grr],
    [d.compPv, resultado.componentes.parte],
  ] as const
  for (const [nombre, c] of lista) {
    comp.addRow([nombre, c.seis, c.pctTolerancia, c.pctContribucion])
  }

  return wb
}

export async function exportarExcel(
  resultado: EstudioResultado,
  diseno: Diseno,
  lecturas: readonly Reading[],
  meta: MetaExcel,
): Promise<void> {
  const wb = await construirLibro(resultado, diseno, lecturas, meta)
  const buffer = await wb.xlsx.writeBuffer()
  descargarBlob(new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }), nombreArchivo(meta.pieza, 'xlsx'))
}
