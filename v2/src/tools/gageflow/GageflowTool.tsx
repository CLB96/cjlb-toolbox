import { useEffect, useRef, useState } from 'react'
import type { ToolProps } from '../types'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { SavedIndicator } from '../../persistence/SavedIndicator'
import { Button } from '../../ui/Button'
import { GlassPanel } from '../../ui/GlassPanel'
import { GageflowStoreProvider, useGageflow, useGageflowApi } from './GageflowStoreProvider'
import { useGageflowPersistence } from './useGageflowPersistence'
import { useGageflowT } from './i18n'
import { SetupForm } from './components/SetupForm'
import { Dropzone } from './components/Dropzone'
import { Review } from './components/Review'
import { Results } from './components/Results'
import { AiagDialog } from './components/AiagDialog'
import type { Cell } from './logic/parse'
import './gageflow.css'

function Paso({ n, texto, hecho }: { n: number; texto: string; hecho: boolean }) {
  return (
    <span className={`gf-paso${hecho ? ' gf-paso--hecho' : ''}`}>
      <b>{n}</b> {texto}{hecho ? ' ✓' : ''}
    </span>
  )
}

function Cuerpo({ toolId }: { toolId: ToolProps['toolId'] }) {
  const api = useGageflowApi()
  const t = useGageflowT()
  const { t: tApp } = useI18n()
  const { restored, lastSavedAt, restoreVersion, markDirty } = useGageflowPersistence(toolId)
  const [historial, setHistorial] = useState(false)
  const gridRef = useRef<{ grid: Cell[][]; nombre: string; hoja: string } | null>(null)

  const archivo = useGageflow((s) => s.archivo)
  const resultado = useGageflow((s) => s.resultado)
  const anchoPendiente = useGageflow((s) => s.anchoPendiente)
  const estudio = useGageflow((s) => s.estudio)
  const lecturas = useGageflow((s) => s.lecturas)
  const diseno = useGageflow((s) => s.diseno)
  const issues = useGageflow((s) => s.issues)
  const formularioOk = useGageflow((s) => s.validacion.ok)

  // Cualquier cambio del usuario entra en el autosave.
  useEffect(() => {
    if (restored) markDirty()
  }, [restored, estudio, archivo, lecturas, diseno, issues, markDirty])

  const onArchivo = (grid: Cell[][], nombre: string, hoja: string) => {
    gridRef.current = { grid, nombre, hoja }
    api.getState().cargarArchivo(grid, nombre, hoja)
  }

  const convertir = () => {
    const pendiente = gridRef.current
    if (!pendiente) return
    api.getState().cargarArchivo(pendiente.grid, pendiente.nombre, pendiente.hoja, { confirmarAncho: true })
  }

  if (!restored) {
    return <GlassPanel className="gf-panel"><p className="gf-n">{tApp('shell.loading')}</p></GlassPanel>
  }

  const paso = resultado ? 3 : archivo ? 2 : 1
  // Archivo correcto y formulario incompleto: se completa aquí y el estudio se calcula solo.
  const faltaFormulario = !formularioOk && diseno !== null && issues.every((i) => i.severidad !== 'error')

  return (
    <div className="gf-root">
      <header className="gf-header">
        <div>
          <h2 className="gf-title">{t('titulo')}</h2>
          <p className="gf-sub">{t('subtitulo')}</p>
        </div>
        <div className="gf-header__acc">
          <SavedIndicator lastSavedAt={lastSavedAt} />
          <Button variant="ghost" onClick={() => setHistorial(true)}>{t('historial')}</Button>
        </div>
      </header>

      <div className="gf-pasos">
        <Paso n={1} texto={t('paso1')} hecho={paso > 1} />
        <span aria-hidden="true">›</span>
        <Paso n={2} texto={t('paso2')} hecho={paso > 2} />
        <span aria-hidden="true">›</span>
        <Paso n={3} texto={t('paso3')} hecho={false} />
      </div>

      {!archivo && (
        <div className="gf-cols">
          <SetupForm />
          <Dropzone onArchivo={onArchivo} deshabilitado={!restored} />
        </div>
      )}

      {archivo && !resultado && faltaFormulario && <SetupForm />}
      {archivo && !resultado && <Review onCambiar={() => api.getState().limpiarArchivo()} />}
      {archivo && resultado && <Results />}

      {anchoPendiente && (
        <AiagDialog
          operadores={anchoPendiente.operadores}
          ensayos={anchoPendiente.ensayos}
          onConvertir={convertir}
          onCerrar={() => api.getState().limpiarArchivo()}
        />
      )}

      {historial && (
        <HistoryPanel
          toolId={toolId}
          lastSavedAt={lastSavedAt}
          onRestore={async (id) => {
            await restoreVersion(id)
            setHistorial(false)
          }}
        />
      )}
    </div>
  )
}

export default function GageflowTool({ toolId }: ToolProps) {
  return (
    <GageflowStoreProvider>
      <Cuerpo toolId={toolId} />
    </GageflowStoreProvider>
  )
}
