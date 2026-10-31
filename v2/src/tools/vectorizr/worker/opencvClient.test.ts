import { describe, expect, it, vi } from 'vitest'
import type { DetectParams } from '../types'
import { createOpencvClient, type WorkerLike } from './opencvClient'

class FakeWorker implements WorkerLike {
  sent: { msg: { type: string; id?: number }; transfer?: Transferable[] }[] = []
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  terminate = vi.fn()
  postMessage(msg: { type: string; id?: number }, transfer?: Transferable[]) { this.sent.push({ msg, transfer }) }
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent) }
  detects() { return this.sent.filter((s) => s.msg.type === 'detect') }
}

const PARAMS: DetectParams = { method: 0, threshold1: 50, threshold2: 150 }
const img = () => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 }) as unknown as ImageData

function setup() {
  const workers: FakeWorker[] = []
  const client = createOpencvClient(() => { const w = new FakeWorker(); workers.push(w); return w }, () => 'http://x/opencv.js')
  return { client, workers }
}

describe('opencvClient', () => {
  it('is lazy, queues detect until ready, then sends it with the buffer transferred', async () => {
    const { client, workers } = setup()
    expect(workers).toHaveLength(0)
    expect(client.getSnapshot().status).toBe('idle')
    const image = img()
    const p = client.detect(image, PARAMS)
    expect(client.getSnapshot().status).toBe('loading')
    expect(workers[0].sent[0].msg).toEqual({ type: 'init', opencvUrl: 'http://x/opencv.js' })
    expect(workers[0].detects()).toHaveLength(0)
    workers[0].emit({ type: 'ready' })
    expect(client.getSnapshot().status).toBe('ready')
    const [{ msg, transfer }] = workers[0].detects()
    expect(transfer).toEqual([image.data.buffer])
    workers[0].emit({ type: 'contour', id: msg.id, points: [{ x: 1, y: 2 }] })
    await expect(p).resolves.toEqual([{ x: 1, y: 2 }])
  })

  it('runs one request at a time, in order', async () => {
    const { client, workers } = setup()
    client.preload(); workers[0].emit({ type: 'ready' })
    const a = client.detect(img(), PARAMS); const b = client.detect(img(), PARAMS)
    expect(workers[0].detects()).toHaveLength(1)
    workers[0].emit({ type: 'contour', id: workers[0].detects()[0].msg.id, points: [] })
    expect(workers[0].detects()).toHaveLength(2)
    workers[0].emit({ type: 'contour', id: workers[0].detects()[1].msg.id, points: [{ x: 9, y: 9 }] })
    await expect(a).resolves.toEqual([])
    await expect(b).resolves.toEqual([{ x: 9, y: 9 }])
  })

  it('rejects a detect on an error message and stays usable', async () => {
    const { client, workers } = setup()
    client.preload(); workers[0].emit({ type: 'ready' })
    const p = client.detect(img(), PARAMS)
    workers[0].emit({ type: 'error', id: workers[0].detects()[0].msg.id, message: 'boom' })
    await expect(p).rejects.toThrow('boom')
    expect(client.getSnapshot().status).toBe('ready')
  })

  it('load failure sets status error, rejects the queue, and the next detect retries with a new worker', async () => {
    const { client, workers } = setup()
    const listener = vi.fn(); client.subscribe(listener)
    const p = client.detect(img(), PARAMS)
    workers[0].emit({ type: 'error', message: 'importScripts failed' })
    await expect(p).rejects.toThrow('importScripts failed')
    expect(client.getSnapshot()).toEqual({ status: 'error', error: 'importScripts failed' })
    expect(listener).toHaveBeenCalled()
    void client.detect(img(), PARAMS).catch(() => {})
    expect(workers[0].terminate).toHaveBeenCalled()
    expect(workers).toHaveLength(2)
  })

  it('dispose terminates the worker, rejects pending work and returns to idle', async () => {
    const { client, workers } = setup()
    const p = client.detect(img(), PARAMS)
    client.dispose()
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
    await expect(p).rejects.toThrow()
    expect(client.getSnapshot().status).toBe('idle')
  })
})
