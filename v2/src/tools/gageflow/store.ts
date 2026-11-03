/**
 * Estado de GageFlow.
 *
 * Sigue el patrón del resto del toolbox (`createStore` de zustand/vanilla):
 * estado serializable, acciones síncronas y un adaptador para `usePersistentTool`.
 */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { aMatriz, parseGrid, type Diseno, type Grid, type Issue, type ParseResult, type Reading, type Resumen } from './logic/parse'
import { calcularEstudio } from './logic/estudio'
import type { EstudioResultado } from './logic/types'
import {
  ESTUDIO_INICIAL, compararDiseno, validarEstudio,
  type AvisoDiseno, type EstudioForm, type ValidacionForm,
} from './logic/estudioForm'

export interface Archivo {
  nombre: string
  hoja: string
  filas: number
  layout: ParseResult['layout']
  resumen: Resumen
}

export interface GageflowData {
  estudio: EstudioForm
  archivo: Archivo | null
  lecturas: Reading[]
  diseno: Diseno | null
  issues: Issue[]
  validacion: ValidacionForm
  resultado: EstudioResultado | null
  avisos: AvisoDiseno[]
  /** Hoja AIAG detectada que espera confirmación del usuario. */
  anchoPendiente: { operadores: string[]; ensayos: number } | null
}

export interface GageflowActions {
  setCampo<K extends keyof EstudioForm>(campo: K, valor: EstudioForm[K]): void
  setOperador(indice: number, nombre: string): void
  agregarOperador(): void
  quitarOperador(indice: number): void
  cargarArchivo(grid: Grid, nombre: string, hoja?: string, opciones?: { confirmarAncho?: boolean }): void
  limpiarArchivo(): void
  recalcular(): void
}

export type GageflowStore = GageflowData & GageflowActions
export type GageflowApi = StoreApi<GageflowStore>

const estadoInicial = (): GageflowData => ({
  estudio: ESTUDIO_INICIAL,
  archivo: null,
  lecturas: [],
  diseno: null,
  issues: [],
  validacion: validarEstudio(ESTUDIO_INICIAL),
  resultado: null,
  avisos: [],
  anchoPendiente: null,
})

export function crearGageflowStore(): GageflowApi {
  return createStore<GageflowStore>()((set, get) => {
    /** Recalcula con lo cargado; nunca lanza. */
    const calcular = () => {
      const { lecturas, diseno, validacion } = get()
      if (!diseno || lecturas.length === 0 || !validacion.ok) {
        set({ resultado: null })
        return
      }
      const e = validacion.estudio
      const resultado = calcularEstudio(aMatriz(lecturas, diseno), {
        lsl: e?.lsl ?? undefined,
        usl: e?.usl ?? undefined,
        nominal: e?.nominal ?? undefined,
      })
      const avisos = e
        ? compararDiseno(e, {
            piezas: diseno.piezas.length,
            operadores: diseno.operadores,
            ensayos: diseno.ensayos.length,
          })
        : []
      set({ resultado, avisos })
    }

    const actualizarEstudio = (estudio: EstudioForm) => {
      set({ estudio, validacion: validarEstudio(estudio) })
      calcular()
    }

    return {
      ...estadoInicial(),

      setCampo(campo, valor) {
        actualizarEstudio({ ...get().estudio, [campo]: valor })
      },

      setOperador(indice, nombre) {
        const operadores = [...get().estudio.operadores]
        operadores[indice] = nombre
        actualizarEstudio({ ...get().estudio, operadores })
      },

      agregarOperador() {
        actualizarEstudio({ ...get().estudio, operadores: [...get().estudio.operadores, ''] })
      },

      quitarOperador(indice) {
        const operadores = get().estudio.operadores.filter((_, i) => i !== indice)
        actualizarEstudio({ ...get().estudio, operadores })
      },

      cargarArchivo(grid, nombre, hoja = 'Datos', opciones) {
        const parsed = parseGrid(grid, { confirmarAncho: opciones?.confirmarAncho })
        const validacion = validarEstudio(get().estudio)
        set({
          archivo: { nombre, hoja, filas: parsed.filas, layout: parsed.layout, resumen: parsed.resumen },
          lecturas: parsed.ok ? parsed.lecturas : [],
          diseno: parsed.ok ? parsed.diseno : null,
          issues: parsed.issues,
          validacion,
          resultado: null,
          avisos: [],
          anchoPendiente: parsed.ancho ?? null,
        })
        calcular()
      },

      limpiarArchivo() {
        set({
          archivo: null, lecturas: [], diseno: null, issues: [],
          resultado: null, avisos: [], anchoPendiente: null,
        })
      },

      recalcular() {
        calcular()
      },
    }
  })
}

// --- persistencia --------------------------------------------------------

export interface GageflowSnapshot {
  estudio: EstudioForm
  archivo: Archivo | null
  lecturas: Reading[]
  diseno: Diseno | null
  issues: Issue[]
}

/** Adaptador para `usePersistentTool`. */
export function crearAdaptadorGageflow(api: GageflowApi) {
  return {
    getSnapshot: (): GageflowSnapshot => {
      const { estudio, archivo, lecturas, diseno, issues, anchoPendiente } = api.getState()
      // Una hoja AIAG sin confirmar no se guarda: su contenido solo está en memoria.
      if (anchoPendiente) return { estudio, archivo: null, lecturas: [], diseno: null, issues: [] }
      return { estudio, archivo, lecturas, diseno, issues }
    },
    restore: (snap: GageflowSnapshot) => {
      const estudio = snap.estudio ?? ESTUDIO_INICIAL
      api.setState({
        estudio,
        archivo: snap.archivo ?? null,
        lecturas: snap.lecturas ?? [],
        diseno: snap.diseno ?? null,
        validacion: validarEstudio(estudio),
        issues: snap.issues ?? [],
        resultado: null,
        avisos: [],
        anchoPendiente: null,
      })
      api.getState().recalcular()
    },
    reset: () => {
      const vacio = estadoInicial()
      api.setState({ ...vacio, resultado: null })
    },
  }
}
