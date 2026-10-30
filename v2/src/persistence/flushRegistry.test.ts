import { flushAll, getRegisteredTool, registerTool } from './flushRegistry'

const handle = (uid = 'u1') => ({
  uid,
  flush: vi.fn().mockResolvedValue(undefined),
  startFresh: vi.fn().mockResolvedValue(undefined),
})

test('flushAll espera el flush de todas las herramientas registradas', async () => {
  let done = false
  const a = handle()
  a.flush.mockImplementation(() => new Promise<void>((r) => setTimeout(() => ((done = true), r()), 10)))
  const b = handle()
  const offA = registerTool('gantt', a)
  const offB = registerTool('gapcheck', b)
  await flushAll()
  expect(done).toBe(true)
  expect(b.flush).toHaveBeenCalledTimes(1)
  offA()
  offB()
  expect(getRegisteredTool('gantt')).toBeUndefined()
})
