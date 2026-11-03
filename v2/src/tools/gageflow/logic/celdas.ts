/** Lectura de celdas y etiquetas del Excel, sin dependencias. */

export type Cell = string | number | boolean | null | undefined
export type Grid = readonly (readonly Cell[])[]

/** minúsculas, sin acentos ni signos: "Nº Pieza" y "No. PIEZA" son lo mismo. */
export function normalizar(texto: Cell): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Clave de comparación de etiquetas: sin mayúsculas ni espacios de más. */
export function claveEtiqueta(texto: Cell): string {
  return String(texto ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** "Operador 2" antes que "Operador 10"; "A-2" antes que "A-10". */
export function compararNatural(a: string, b: string): number {
  const trozos = (s: string) => s.match(/\d+|\D+/g) ?? ['']
  const ta = trozos(a)
  const tb = trozos(b)
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const na = /^\d+$/.test(ta[i])
    const nb = /^\d+$/.test(tb[i])
    if (na && nb) {
      const d = Number(ta[i]) - Number(tb[i])
      if (d !== 0) return d
    } else {
      const c = ta[i].localeCompare(tb[i], 'es', { sensitivity: 'base' })
      if (c !== 0) return c
    }
  }
  return ta.length - tb.length
}

/** Acepta 2.501, 2,501, "2 501", " 2.501 ". Devuelve null si no es un número. */
export function aNumero(celda: Cell): number | null {
  if (typeof celda === 'number') return Number.isFinite(celda) ? celda : null
  if (typeof celda !== 'string') return null
  let t = celda.replace(/\s| /g, '')
  if (!t) return null
  const punto = t.lastIndexOf('.')
  const coma = t.lastIndexOf(',')
  if (punto >= 0 && coma >= 0) {
    // El separador que aparece al final es el decimal; el otro es de miles.
    t = punto > coma ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.')
  } else if (coma >= 0) {
    t = t.replace(/,/g, '.')
  }
  if (!/^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function filaVacia(fila: readonly Cell[] | undefined): boolean {
  if (!fila) return true
  return fila.every((c) => c === null || c === undefined || String(c).trim() === '')
}
