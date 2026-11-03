import { useRef, useState, type DragEvent } from 'react'
import { read, utils } from 'xlsx'
import { useGageflow } from '../GageflowStoreProvider'
import { useGageflowT } from '../i18n'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { toast } from '../../../ui/toastStore'
import { generarPlantilla } from '../export/generarPlantilla'
import { descargarBlob, nombreArchivo } from '../export/descargar'
import type { Cell } from '../logic/parse'

interface Props {
  onArchivo: (grid: Cell[][], nombre: string, hoja: string) => void
  deshabilitado?: boolean
}

/** Primera hoja «Datos» o, si no existe, la primera visible. */
function elegirHoja(libro: ReturnType<typeof read>): string {
  const nombres = libro.SheetNames
  const datos = nombres.find((n) => n.toLowerCase() === 'datos')
  return datos ?? nombres[0] ?? ''
}

export function Dropzone({ onArchivo, deshabilitado = false }: Props) {
  const t = useGageflowT()
  const estudio = useGageflow((s) => s.estudio)
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const leer = async (file: File) => {
    if (deshabilitado) return
    try {
      const libro = read(await file.arrayBuffer(), { type: 'array' })
      const hoja = elegirHoja(libro)
      if (!hoja || !libro.Sheets[hoja]) {
        toast('error', t('errorLeerArchivo'))
        return
      }
      const grid = utils.sheet_to_json<Cell[]>(libro.Sheets[hoja], {
        header: 1, raw: true, defval: null, blankrows: false,
      })
      onArchivo(grid, file.name, hoja)
    } catch {
      toast('error', t('errorLeerArchivo'))
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void leer(file)
  }

  const plantilla = async () => {
    const buffer = await generarPlantilla({
      piezas: Array.from({ length: estudio.piezas }, (_, i) => String(i + 1)),
      operadores: estudio.operadores.filter((o) => o.trim() !== ''),
      ensayos: estudio.ensayos,
    })
    descargarBlob(new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }), nombreArchivo(estudio.pieza, 'xlsx'))
  }

  return (
    <GlassPanel className="gf-panel">
      <div
        className={`gf-drop${arrastrando ? ' gf-drop--on' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={onDrop}
      >
        <div className="gf-drop__icon" aria-hidden="true">⇪</div>
        <p className="gf-drop__t">{t('dropTitulo')}</p>
        <p className="gf-drop__s">{t('dropSub')}</p>
        <div className="gf-drop__acc">
          <Button onClick={() => inputRef.current?.click()} disabled={deshabilitado}>
            {t('elegir')}
          </Button>
          <Button variant="ghost" onClick={() => void plantilla()}>
            {t('descargarPlantilla')}
          </Button>
        </div>
        <p className="gf-drop__hint">{t('dropHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void leer(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="gf-cab gf-cab--sep">
        <span className="gf-t">{t('formatoTitulo')}</span>
        <span className="gf-n">{t('formatoNota')}</span>
      </div>
      <table className="gf-tabla">
        <thead>
          <tr><th>{t('columna')}</th><th>{t('tipo')}</th><th>{t('regla')}</th></tr>
        </thead>
        <tbody>
          <tr><td>Pieza</td><td>{t('tipoTexto')}</td><td>{t('reglaPieza')}</td></tr>
          <tr><td>Operador</td><td>{t('tipoTexto')}</td><td>{t('reglaOperador')}</td></tr>
          <tr><td>Ensayo</td><td>{t('tipoEntero')}</td><td>{t('reglaEnsayo')}</td></tr>
          <tr><td>Valor</td><td>{t('tipoNumero')}</td><td>{t('reglaValor')}</td></tr>
        </tbody>
      </table>
      <p className="gf-n gf-n--pie">{t('soloLecturas')}</p>
    </GlassPanel>
  )
}
