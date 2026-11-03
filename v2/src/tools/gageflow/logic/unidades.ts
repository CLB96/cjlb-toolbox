/** Texto de las diferencias según la unidad del estudio. */

/** En milímetros el sesgo se lee mejor en micras; en otra unidad se deja en esa unidad. */
export function textoSesgo(diferencia: number, unidad: string): string {
  const signo = diferencia >= 0 ? '+' : ''
  if (unidad.trim().toLowerCase() === 'mm') return `${signo}${(diferencia * 1000).toFixed(1)} µm`
  return `${signo}${diferencia.toFixed(4)} ${unidad}`
}
