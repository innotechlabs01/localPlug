'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

/** Reads the DB-backed navigation decision for the current session. */
export function useMyReservasVisibility() {
  const { isLoaded, isSignedIn } = useAuth()
  const [canViewMyReservas, setCanViewMyReservas] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setCanViewMyReservas(false)
      return
    }

    let active = true
    fetch('/api/me/navigation', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { canViewMyReservas: false }))
      .then((data) => {
        if (active) setCanViewMyReservas(Boolean(data.canViewMyReservas))
      })
      .catch(() => {
        if (active) setCanViewMyReservas(false)
      })

    return () => { active = false }
  }, [isLoaded, isSignedIn])

  return canViewMyReservas
}
