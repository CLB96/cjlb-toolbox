// Importar y generar: validación, llamada al worker y descarte de respuestas viejas.
import { useQnApi } from './QnStoreProvider'
import { completionMessage, parseField, requestOptions, selectedAngle, validateSettings } from './logic/plans'
import type { Request } from './logic/plans'
import type { QnForm } from './store'
import { QnRequestError, requestImport, requestNest } from './worker/client'

const MAX_UPLOAD = 8 * 1024 * 1024

export function formRequest(f: QnForm): Request {
  const manual = f.mode === 'manual'
  return requestOptions({
    width: parseField(f.width), length: parseField(f.length), gap: parseField(f.gap), mode: f.mode,
    quantity: manual ? parseField(f.quantity) : 1, rotation: f.rotation,
    angle: f.rotation === 'fixed' ? selectedAngle(f.anglePreset, f.customAngle) : 0,
  }, { marginEnabled: f.marginEnabled, margin: parseField(f.margin), multiplePlies: f.multiplePlies, balanced: f.balanced })
}

const codeOf = (error: unknown) => (error instanceof QnRequestError ? error.code : 'internal_error')

/** `File.arrayBuffer` con FileReader como respaldo (navegadores antiguos y jsdom). */
function readBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer().then((b) => new Uint8Array(b))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(new QnRequestError('file_read'))
    reader.readAsArrayBuffer(file)
  })
}

export function useQnActions() {
  const api = useQnApi()

  const runImport = async (data: Uint8Array) => {
    const s = api.getState()
    s.setBusy(true)
    try {
      const imported = await requestImport(data, s.units === 'declared' ? null : Number(s.units))
      api.getState().finishImport(imported)
    } catch (error) {
      api.getState().say('request_error', 'error', { code: codeOf(error) })
    } finally {
      api.getState().setBusy(false)
    }
  }

  const importFile = async (file: File | undefined) => {
    const s = api.getState()
    if (s.busy) return
    if (!file || !/\.dxf$/i.test(file.name) || file.size > MAX_UPLOAD || file.size === 0) {
      s.say('invalid_file', 'error')
      return
    }
    let data: Uint8Array
    try {
      data = await readBytes(file)
    } catch (error) {
      s.say('request_error', 'error', { code: codeOf(error) })
      return
    }
    s.beginImport(file.name, data)
    await runImport(data)
  }

  const changeUnits = async (units: string) => {
    const s = api.getState()
    s.setUnits(units)
    if (!s.fileData || s.busy) return
    s.beginImport(null, null)
    await runImport(s.fileData)
  }

  const generate = async () => {
    const s = api.getState()
    if (s.busy) return
    const values = formRequest(s.form)
    const error = validateSettings(values, s.selected.length, s.confirmed && !s.imported?.requiresUnitOverride)
    if (error) {
      s.say(error, 'error')
      return
    }
    const revision = s.revision
    const pieces = (s.imported?.contours ?? []).filter((c) => s.selected.includes(c.id)).map(({ id, points }) => ({ id, points }))
    s.setBusy(true)
    s.say('searching')
    try {
      const result = await requestNest({ ...values, pieces })
      if (api.getState().revision === revision) {
        api.getState().setResult(result)
        const done = completionMessage(result)
        api.getState().say(done.key, '', done.values)
      }
    } catch (failure) {
      api.getState().say('request_error', 'error', { code: codeOf(failure) })
    } finally {
      api.getState().setBusy(false)
    }
  }

  return { importFile, changeUnits, generate }
}
