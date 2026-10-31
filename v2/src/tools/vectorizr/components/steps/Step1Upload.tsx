import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../../ui/Button'
import { toast } from '../../../../ui/toastStore'
import { useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { normalizeImage } from '../../logic/imageNormalize'

/** M11: el PDF ya no se acepta (siempre fallaba al cargarse en un Image). */
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function loadImage(src: string, errorMessage: string): Promise<HTMLImageElement> {
  const img = new Image()
  return new Promise((res, rej) => {
    img.onload = () => res(img)
    img.onerror = () => rej(new Error(errorMessage))
    img.src = src
  })
}

export function Step1Upload({ disabled }: { disabled: boolean }) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  async function applyImage(img: HTMLImageElement) {
    const n = await normalizeImage(img)
    api.getState().setImage({ blob: n.blob, image: n.image }, n.width, n.height)
    api.getState().setStep(2)
  }

  async function loadFile(file: File) {
    if (disabled) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast('error', t('errFormat'))
      return
    }
    setLoading(true)
    const url = URL.createObjectURL(file)
    try {
      await applyImage(await loadImage(url, t('errLoadImage')))
    } catch {
      toast('error', t('errProcess'))
    } finally {
      URL.revokeObjectURL(url)
      setLoading(false)
    }
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      stream.getTracks().forEach((tr) => tr.stop())
      await applyImage(await loadImage(canvas.toDataURL('image/jpeg', 0.92), t('errLoadImage')))
    } catch {
      toast('error', t('errCamera'))
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void loadFile(file)
  }

  return (
    <div className="vz-upload">
      <h2 className="vz-upload__title">{t('uploadTitle')}</h2>
      <p className="vz-muted vz-upload__desc">{t('uploadDesc')}</p>
      <div
        className={`vz-drop${dragging ? ' is-drag' : ''}${disabled ? ' is-disabled' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && fileRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            fileRef.current?.click()
          }
        }}
      >
        <div className="vz-drop__big">📂</div>
        <p className="vz-muted">
          {t('dropPrefix')}
          <b className="vz-accent">{t('dropLink')}</b>
        </p>
        <p className="vz-muted vz-small">{t('formats')}</p>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          hidden
          disabled={disabled}
          aria-label={t('uploadTitle')}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void loadFile(file)
          }}
        />
      </div>
      <Button variant="ghost" onClick={() => void openCamera()} disabled={disabled}>
        {t('takePhoto')}
      </Button>
      {loading && <p className="vz-muted">{t('processing')}</p>}
    </div>
  )
}
