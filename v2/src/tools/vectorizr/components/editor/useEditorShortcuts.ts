import { useEffect } from 'react'
import { useVectorizrApi } from '../../VectorizrStoreProvider'
import { TOOL_KEYS } from './Toolbar'

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Atajos del Paso 4 (useKeyboardShortcuts.ts + EditorCanvas.tsx:130-143).
 * Solo con la pestaña visible (keep-alive) y fuera de campos y diálogos.
 * M13: las teclas de herramienta ignoran Ctrl/Cmd/Alt, así Ctrl+Z ya no activa Zoom.
 */
export function useEditorShortcuts(active: boolean): void {
  const api = useVectorizrApi()
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return
      const ctrl = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (ctrl && !e.altKey) {
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault()
          api.getState().undo()
        } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
          e.preventDefault()
          api.getState().redo()
        }
        return
      }
      if (e.altKey) return
      const tool = TOOL_KEYS[key]
      if (tool) api.getState().setActiveTool(tool)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, api])
}
