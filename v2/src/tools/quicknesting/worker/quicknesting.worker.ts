// Worker del cálculo (worker de módulo). Atiende peticiones de importar y acomodar.
import { handle } from './handle'
import type { WorkerRequest } from './protocol'

const scope = self as unknown as { onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null; postMessage: (m: unknown) => void }

scope.onmessage = (event) => {
  scope.postMessage(handle(event.data))
}
