// Lector DXF ASCII mínimo: cabecera ($INSUNITS) y entidades del espacio modelo.
// Sustituye a ezdxf.read() del original; no interpreta bloques ni espacio papel.
import { InputError } from './types'

export type Tag = [number, string]

export interface DxfEntity {
  type: string
  layer: string
  tags: Tag[]
  /** Solo POLYLINE: etiquetas de cada VERTEX hasta SEQEND. */
  vertices?: Tag[][]
}

export interface DxfDoc {
  insunits: number
  entities: DxfEntity[]
}

export function decodeText(data: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(data)
  } catch {
    return new TextDecoder('windows-1252').decode(data)
  }
}

function readTags(text: string): Tag[] {
  const lines = text.split(/\r\n|\r|\n/)
  if (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  if (lines.length % 2) lines.pop()
  const tags: Tag[] = []
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const raw = lines[i].trim()
    if (!/^-?\d+$/.test(raw)) throw new InputError('invalid_dxf')
    tags.push([Number(raw), lines[i + 1].trim()])
  }
  return tags
}

/** Agrupa una lista de etiquetas en entidades, cada una desde su código 0. */
function splitEntities(tags: Tag[]): Tag[][] {
  const out: Tag[][] = []
  for (const tag of tags) {
    if (tag[0] === 0) out.push([tag])
    else if (out.length) out[out.length - 1].push(tag)
  }
  return out
}

const valueOf = (tags: Tag[], code: number): string | undefined => tags.find((t) => t[0] === code)?.[1]

export function readDxf(text: string): DxfDoc {
  const tags = readTags(text)
  const body = tags.filter((t) => t[0] !== 999)
  if (!body.length || body[0][0] !== 0 || body[0][1] !== 'SECTION') throw new InputError('invalid_dxf')
  let insunits = 0
  const entities: DxfEntity[] = []
  let i = 0
  while (i < body.length) {
    if (body[i][0] === 0 && body[i][1] === 'EOF') break
    if (!(body[i][0] === 0 && body[i][1] === 'SECTION') || body[i + 1]?.[0] !== 2) throw new InputError('invalid_dxf')
    const name = body[i + 1][1]
    let end = i + 2
    while (end < body.length && !(body[end][0] === 0 && body[end][1] === 'ENDSEC')) end++
    if (end >= body.length) throw new InputError('invalid_dxf')
    const section = body.slice(i + 2, end)
    if (name === 'HEADER') {
      const at = section.findIndex((t) => t[0] === 9 && t[1] === '$INSUNITS')
      const value = at >= 0 ? Number(section[at + 1]?.[1]) : 0
      insunits = Number.isInteger(value) ? value : 0
    } else if (name === 'ENTITIES') {
      entities.push(...collect(splitEntities(section)))
    }
    i = end + 1
  }
  return { insunits, entities }
}

/** Une VERTEX y SEQEND a su POLYLINE y descarta el espacio papel (código 67 = 1). */
function collect(raw: Tag[][]): DxfEntity[] {
  const out: DxfEntity[] = []
  let open: DxfEntity | null = null
  for (const tags of raw) {
    const type = tags[0][1]
    if (open && type === 'VERTEX') {
      open.vertices!.push(tags.slice(1))
      continue
    }
    if (open && type === 'SEQEND') {
      open = null
      continue
    }
    open = null
    if (valueOf(tags, 67) === '1') continue
    const entity: DxfEntity = { type, layer: valueOf(tags, 8) ?? '0', tags: tags.slice(1) }
    if (type === 'POLYLINE') {
      entity.vertices = []
      open = entity
    }
    out.push(entity)
  }
  return out
}

export function num(tags: Tag[], code: number, fallback = 0): number {
  const raw = valueOf(tags, code)
  if (raw === undefined) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new Error('bad_number')
  return n
}

/** Todos los valores de un código, en orden (puntos de control, nudos…). */
export function nums(tags: Tag[], code: number): number[] {
  return tags.filter((t) => t[0] === code).map((t) => {
    const n = Number(t[1])
    if (!Number.isFinite(n)) throw new Error('bad_number')
    return n
  })
}
