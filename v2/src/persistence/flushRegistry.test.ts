import { flushAll, flushTool, getRegisteredTool, registerTool } from './flushRegistry'

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

test('flushTool solo afecta a la herramienta pedida; desregistrar no borra un registro más nuevo', async () => {
  const a1 = handle()
  const a2 = handle()
  const off1 = registerTool('gantt', a1)
  const off2 = registerTool('gantt', a2)
  off1()
  await flushTool('gantt')
  expect(a1.flush).not.toHaveBeenCalled()
  expect(a2.flush).toHaveBeenCalledTimes(1)
  off2()
})
