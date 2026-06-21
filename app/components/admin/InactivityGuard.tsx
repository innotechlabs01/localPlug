'use client'

import { useEffect, useRef, useState } from 'react'
import { useClerk } from '@clerk/nextjs'

const WARNING_BEFORE_MS = 60000

export function InactivityGuard() {
  const { signOut } = useClerk()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const warningRef = useRef<ReturnType<typeof setTimeout>>()
  const [showWarning, setShowWarning] = useState(false)
  const [timeout, setTimeout_] = useState(900000)

  useEffect(() => {
    const envTimeout = parseInt(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT || '')
    if (envTimeout > 0) { setTimeout_(envTimeout); return }
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => { if (cfg?.inactivityTimeoutMs) setTimeout_(cfg.inactivityTimeoutMs) })
      .catch(() => {})
  }, [])

  const cleanUp = () => {
    clearTimeout(timerRef.current)
    clearTimeout(warningRef.current)
  }

  const resetTimer = () => {
    cleanUp()
    setShowWarning(false)

    warningRef.current = setTimeout(
      () => setShowWarning(true),
      Math.max(timeout - WARNING_BEFORE_MS, 0)
    )

    timerRef.current = setTimeout(() => {
      signOut({ redirectUrl: '/sign-in' })
    }, timeout)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel']
    for (const e of events) window.addEventListener(e, resetTimer, { passive: true })
    resetTimer()
    return () => {
      for (const e of events) window.removeEventListener(e, resetTimer)
      cleanUp()
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="inactivity-overlay">
      <div className="inactivity-modal">
        <div className="inactivity-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3>Session Timeout</h3>
        <p>You will be signed out due to inactivity in 1 minute.</p>
        <button className="inactivity-stay-btn" onClick={resetTimer}>
          Stay Signed In
        </button>
      </div>
    </div>
  )
}
