import type { CoveringType, TargetInputs } from './types'

/** Etiqueta de compresión del eje derecho (espeja el valor del eje izquierdo). */
export function compressionTick(
  value: number,
  covering: CoveringType,
  inputs: TargetInputs,
): string {
  if (covering === 'hard') {
    const skin = parseFloat(inputs.skin) || 0
    if (skin === 0) return '0%'
    return (((skin - value) / skin) * 100).toFixed(0) + '%'
  }
  const skin = parseFloat(inputs.skinSoft) || 0
  const foam = parseFloat(inputs.foam) || 0
  if (foam === 0) return '0%'
  const foamCompressed = value - skin
  return (((foam - foamCompressed) / foam) * 100).toFixed(0) + '%'
}
