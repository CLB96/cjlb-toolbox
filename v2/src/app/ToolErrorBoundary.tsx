import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'
import { toast } from '../ui/toastStore'

interface Props {
  message: string
  retryLabel: string
  onRetry: () => void
  children?: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Aísla el fallo de una herramienta (render o import perezoso): muestra un panel con
 * "Reintentar" y un toast, sin desmontar el resto del shell. El padre la remonta con otra
 * `key` al reintentar.
 */
export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    toast('error', this.props.message)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <GlassPanel as="section" className="tool-error">
        <p>{this.props.message}</p>
        <Button onClick={this.props.onRetry}>{this.props.retryLabel}</Button>
      </GlassPanel>
    )
  }
}
