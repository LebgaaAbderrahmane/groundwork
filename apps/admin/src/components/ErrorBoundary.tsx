import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50svh] flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="size-12 text-accent/50" strokeWidth={1.4} />
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-3 max-w-sm text-sm font-light text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="outline" onClick={() => { window.location.href = '/' }}>
              Back to dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
