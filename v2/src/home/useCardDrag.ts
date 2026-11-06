import { useState, type DragEvent } from 'react'

export interface DragProps {
  draggable: boolean
  onDragStart: (e: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent<HTMLElement>) => void
}

export interface CardDrag {
  dragId: string | null
  targetId: string | null
  propsFor: (id: string) => DragProps
}

/** Arrastrar y soltar nativo entre tarjetas; las flechas de cada tarjeta son la alternativa con teclado. */
export function useCardDrag(onDrop: (dragId: string, targetId: string) => void): CardDrag {
  const [dragId, setDragId] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const clear = () => {
    setDragId(null)
    setTargetId(null)
  }
  const propsFor = (id: string): DragProps => ({
    draggable: true,
    onDragStart: (e) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
      // Firefox no inicia el arrastre sin datos
      e.dataTransfer.setData('text/plain', id)
    },
    onDragEnd: clear,
    onDragOver: (e) => {
      if (!dragId || dragId === id) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (targetId !== id) setTargetId(id)
    },
    onDragLeave: () => setTargetId((cur) => (cur === id ? null : cur)),
    onDrop: (e) => {
      e.preventDefault()
      if (dragId && dragId !== id) onDrop(dragId, id)
      clear()
    },
  })
  return { dragId, targetId, propsFor }
}
