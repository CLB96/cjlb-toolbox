// Descarga un Blob como archivo. La URL se revoca tras un tick: revocarla justo después de click()
// puede cancelar la descarga en algunos navegadores (bug #34 del original).
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
