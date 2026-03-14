"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { ErrorBoundaryHandler } from "@/lib/error-monitor"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorId: null }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, errorId: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    ErrorBoundaryHandler.handleError(error, {
      componentStack: errorInfo.componentStack ?? "",
    })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorId: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <Button onClick={this.handleReset} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
