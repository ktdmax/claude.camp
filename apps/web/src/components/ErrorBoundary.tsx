'use client'

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#0D0D1A', color: '#8A8A9A',
          fontFamily: 'monospace', fontSize: 14,
        }}>
          something broke. try refreshing.
        </div>
      )
    }
    return this.props.children
  }
}
