'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'

const AUTH_MESSAGES: Record<string, string> = {
  contact_admin: 'Tu sesión está activa pero tu usuario no está habilitado. Contactá al administrador.',
  no_portal_role: 'Tu cuenta no tiene un rol de panel asignado. Contactá al administrador.',
  hotel_not_found: 'Tu cuenta de hotel no tiene un hotel asociado. Contactá al administrador.',
  session_error: 'No pudimos verificar tu sesión. Intentá iniciar sesión nuevamente.',
}

export default function AuthStatusBanner() {
  const { isLoaded, isSignedIn } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const reason = searchParams.get('auth')
  const justSignedOut = reason === 'signed_out'

  useEffect(() => {
    if (!justSignedOut || !isLoaded || isSignedIn) return
    router.replace('/')
  }, [justSignedOut, isLoaded, isSignedIn, router])

  if (!reason || justSignedOut) return null

  const message = AUTH_MESSAGES[reason] ?? 'No pudimos verificar tu acceso.'

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-4 z-[100] mx-auto flex max-w-xl items-center gap-4 rounded-xl border border-amber-400/30 bg-amber-950/95 px-5 py-3 text-sm text-amber-100 shadow-xl"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => router.replace('/')}
        className="rounded-lg border border-amber-300/30 px-3 py-1 font-medium hover:bg-amber-400/10"
      >
        Entendido
      </button>
    </div>
  )
}
