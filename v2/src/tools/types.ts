import type { ComponentType } from 'react'
import type { ToolId } from '../app/routes'

export interface ToolProps {
  toolId: ToolId
  active: boolean
}

export interface ToolDef {
  id: ToolId
  icon: string
  iconSvg?: string
  nameEs: string
  nameEn: string
  descEs: string
  descEn: string
  badge: null | 'new' | 'updated'
  status: 'active' | 'hold'
  holdLabelEs: string
  holdLabelEn: string
  url: string
  load(): Promise<{ default: ComponentType<ToolProps> }>
}
