import { useEffect } from 'react'
import { isTyping } from '../editor/useEditorShortcuts'
import type { useImagePrep } from './useImagePrep'

type Edit = ReturnType<typeof useImagePrep>

/**
 * Atajos de Editar imagen (paso 3, método automático): C recorta, I ignora con pincel, L ignora con lazo,
 * Esc suelta la herramienta y Ctrl+Z deshace. Solo con la pestaña visible y fuera de campos y diálogos.
 */
export function useImageEditShortcuts(active: boolean, edit: Edit): void {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      // un deslizador o interruptor enfocado no cuenta como escribir: las teclas siguen funcionando
      const pressing = e.target instanceof HTMLInputElement && ['range', 'checkbox', 'radio'].includes(e.target.type)
      if (isTyping(e.target) && !pressing) return
      if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return
      const key = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && key === 'z') {
        if (!edit.canUndo) return
        e.preventDefault()
        edit.undo()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (key === 'escape' && edit.tool !== 'none') {
        edit.setTool('none')
        return
      }
      if (key === 'c') {
        edit.setOpen(true)
        edit.setTool(edit.tool === 'crop' ? 'none' : 'crop')
      } else if (key === 'i' || key === 'l') {
        const mode = key === 'l' ? 'lasso' : 'brush'
        edit.setOpen(true)
        edit.setTool(edit.tool === 'erase' && edit.eraseMode === mode ? 'none' : 'erase')
        edit.setEraseMode(mode)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, edit])
}
