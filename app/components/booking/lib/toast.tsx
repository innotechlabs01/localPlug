'use client'

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { ToastNotification, ToastType } from './types'

interface ToastState {
  toasts: ToastNotification[]
  queue: ToastNotification[]
}

type ToastAction =
  | { type: 'ADD'; toast: ToastNotification }
  | { type: 'DISMISS'; id: string }
  | { type: 'CLEAR' }

const MAX_VISIBLE = 3

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD': {
      if (state.toasts.length < MAX_VISIBLE) {
        return { ...state, toasts: [...state.toasts, action.toast] }
      }
      return { ...state, queue: [...state.queue, action.toast] }
    }
    case 'DISMISS': {
      const remaining = state.toasts.filter((t) => t.id !== action.id)
      const [nextFromQueue, ...restQueue] = state.queue
      if (nextFromQueue) {
        return { toasts: [...remaining, nextFromQueue], queue: restQueue }
      }
      return { toasts: remaining, queue: state.queue }
    }
    case 'CLEAR':
      return { toasts: [], queue: [] }
    default:
      return state
  }
}

interface ToastContextValue {
  showToast: (opts: {
    type: ToastType
    message: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, {
    toasts: [],
    queue: [],
  })
  const idCounter = useRef(0)

  const showToast = useCallback(
    (opts: {
      type: ToastType
      message: string
      duration?: number
      action?: { label: string; onClick: () => void }
    }) => {
      idCounter.current += 1
      const id = `toast-${idCounter.current}-${Date.now()}`
      const toast: ToastNotification = {
        id,
        type: opts.type,
        message: opts.message,
        createdAt: Date.now(),
        duration: opts.duration ?? (opts.type === 'error' ? 0 : opts.type === 'warning' ? 8000 : 5000),
        action: opts.action,
      }
      dispatch({ type: 'ADD', toast })
      return id
    },
    [],
  )

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'DISMISS', id })
  }, [])

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, clearToasts }}>
      {children}
      <ToastContainer
        toasts={state.toasts}
        onDismiss={dismissToast}
      />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastNotification[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none
        max-sm:bottom-4 max-sm:right-1/2 max-sm:translate-x-1/2 max-sm:px-4"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const typeStyles: Record<ToastType, string> = {
  success:
    'bg-[var(--accent-gold)] text-[var(--bg-dark)] shadow-level-2',
  error:
    'bg-red-600 text-white shadow-level-2',
  warning:
    'bg-amber-500 text-white shadow-level-2',
  info:
    'bg-[var(--bg-elevated)] text-white border border-[var(--border)] shadow-level-2',
}

const defaultDurations: Record<ToastType, number> = {
  success: 5000,
  error: 0,
  warning: 8000,
  info: 5000,
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastNotification
  onDismiss: (id: string) => void
}) {
  const duration = toast.duration ?? defaultDurations[toast.type]

  useEffect(() => {
    if (duration <= 0) return
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-lg px-4 py-3 flex items-start gap-3 transition-all duration-200 animate-slide-up ${typeStyles[toast.type]}`}
    >
      <span className="text-body-md flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="text-label-sm underline font-semibold whitespace-nowrap hover:opacity-80 transition-opacity"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 -mr-1 -mt-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
