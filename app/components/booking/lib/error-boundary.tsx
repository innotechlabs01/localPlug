'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import en from '@/lib/i18n/locales/en'
import es from '@/lib/i18n/locales/es'

function getTranslations() {
  if (typeof window === 'undefined') return en
  try {
    const lang = localStorage.getItem('localplug-lang')
    return lang === 'es' ? es : en
  } catch {
    return en
  }
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ErrorBoundary] Caught an error:', error.message, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const t = getTranslations()

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-body-md text-cool-slate-600 mb-4">
            {t.errors.message}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-6 py-3 rounded bg-[var(--accent-gold)] text-[var(--bg-dark)] text-label-md font-bold hover:bg-[var(--accent-gold-light)] transition-colors min-h-[44px]"
          >
            {t.errors.tryAgain}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
