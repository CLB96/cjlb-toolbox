/** Comprueba que las lecturas forman un diseño cruzado y balanceado. */
import { claveEtiqueta } from './celdas'
import type { Diseno, FilaDiseno, Reading } from './disenoLecturas'
import type { Issue, Resumen } from './issues'

const MAX_PIEZAS = 100
const MAX_OPERADORES = 20

const claveLectura = (pieza: string, operador: string, ensayo: number): string =>
  `${claveEtiqueta(pieza)}\u0000${claveEtiqueta(operador)}\u0000${ensayo}`

export function validarDiseno(lecturas: Reading[], diseno: Diseno, issues: Issue[]): Resumen {
  const { piezas, operadores, ensayos } = diseno
  const presentes = new Set(lecturas.map((l) => claveLectura(l.pieza, l.operador, l.ensayo)))
  const esperadas = piezas.length * operadores.length * ensayos.length
  const faltantes = Math.max(0, esperadas - presentes.size)

  if (lecturas.length < 10) {
    issues.push({ fila: null, codigo: 'POCAS_PIEZAS', severidad: 'error', clave: 'pocasLecturas', vars: { lecturas: lecturas.length } })
  }
  if (piezas.length < 2) {
    issues.push({ fila: null, codigo: 'POCAS_PIEZAS', severidad: 'error', clave: 'minimoPiezas' })
  } else if (piezas.length < 5) {
    issues.push({ fila: null, codigo: 'POCAS_PIEZAS', severidad: 'aviso', clave: 'piezasRecomendadas', vars: { piezas: piezas.length } })
  }
  if (operadores.length < 2) {
    issues.push({ fila: null, codigo: 'POCOS_OPERADORES', severidad: 'error', clave: 'minimoOperadores' })
  }
  if (ensayos.length < 2) {
    issues.push({ fila: null, codigo: 'POCOS_ENSAYOS', severidad: 'error', clave: 'minimoEnsayos' })
  }
  if (piezas.length > MAX_PIEZAS) {
    issues.push({ fila: null, codigo: 'MAXIMO', severidad: 'error', clave: 'maximoPiezas', vars: { max: MAX_PIEZAS } })
  }
  if (operadores.length > MAX_OPERADORES) {
    issues.push({ fila: null, codigo: 'MAXIMO', severidad: 'error', clave: 'maximoOperadores', vars: { max: MAX_OPERADORES } })
  }
  // Los ensayos deben ser 1..r: un salto suele ser una fila perdida, no un diseño.
  const huecosEnsayo = Array.from({ length: ensayos[ensayos.length - 1] ?? 0 }, (_, i) => i + 1)
    .filter((n) => !ensayos.includes(n))
  if (huecosEnsayo.length > 0) {
    issues.push({
      fila: null, codigo: 'ENSAYOS_INCOMPLETOS', severidad: 'error',
      clave: huecosEnsayo.length > 1 ? 'ensayosIncompletosVarios' : 'ensayosIncompletosUno',
      vars: { ultimo: ensayos[ensayos.length - 1], huecos: huecosEnsayo.join(', ') },
    })
  }
  if (faltantes > 0 && issues.every((i) => i.codigo !== 'VALOR_VACIO')) {
    const huecos: FilaDiseno[] = []
    for (const pieza of piezas) for (const operador of operadores) for (const ensayo of ensayos) {
      if (!presentes.has(claveLectura(pieza, operador, ensayo))) huecos.push({ pieza, operador, ensayo })
    }
    issues.push({
      fila: null, codigo: 'DESBALANCEADO', severidad: 'error', clave: 'desbalanceado',
      vars: { faltantes }, huecos: huecos.slice(0, 6),
    })
  }
  return { piezas: piezas.length, operadores, ensayos: ensayos.length, lecturas: lecturas.length, faltantes }
}
