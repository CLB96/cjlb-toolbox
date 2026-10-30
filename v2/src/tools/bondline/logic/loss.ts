export function computeLoss(thermo: string, nest: string): { text: string; positive: boolean } {
  const t = parseFloat(thermo)
  const n = parseFloat(nest)
  if (!isNaN(t) && !isNaN(n)) {
    const loss = t - n
    return { text: loss.toFixed(1) + ' °C', positive: loss > 0 }
  }
  return { text: '— °C', positive: false }
}
