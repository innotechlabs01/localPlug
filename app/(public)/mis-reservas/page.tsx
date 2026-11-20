'use client'

import { useEffect, useState } from 'react'
import { useAuth, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'

type Booking = {
  id: number
  order_number: string | null
  booking_reference: string
  package_id: string | null
  package_name: string | null
  package_price: number | null
  currency: string | null
  status: string
  payment_status: string
  dispatch_status: string | null
  arrival_date: string | null
  arrival_time: string | null
  return_date: string | null
  return_time: string | null
  flight_number: string | null
  airline: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  customer_country: string | null
  customer_language: string | null
  destination_address: string | null
  additional_trips: any
  num_people: number | null
  traveler_profile: string | null
  is_hotel_booking: number | null
  hotel_id: number | null
  room_id: number | null
  num_nights: number | null
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-white/10 text-white/70 border-white/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  }
  return (
    <span className={`px-2.5 py-1 text-xs rounded-full border ${map[status] || 'bg-white/10 text-white/60 border-white/20'}`}>
      {status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    refunded: 'bg-red-500/10 text-red-400 border-red-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  }
  return (
    <span className={`px-2.5 py-1 text-xs rounded-full border ${map[status] || 'bg-white/10 text-white/60 border-white/20'}`}>
      {status === 'paid' ? 'Pagado' : status === 'pending' ? 'Pendiente' : status === 'refunded' ? 'Reembolsado' : status === 'failed' ? 'Fallido' : status}
    </span>
  )
}

function BookingDetail({ b }: { b: Booking }) {
  let trips: any[] = []
  try {
    if (b.additional_trips) {
      trips = typeof b.additional_trips === 'string' ? JSON.parse(b.additional_trips) : b.additional_trips
    }
  } catch {}

  return (
    <details className="group bg-bg-card border border-[var(--border)] rounded-2xl overflow-hidden">
      <summary className="cursor-pointer list-none p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white/2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-white font-semibold">{b.package_name || b.package_id}</p>
            <StatusBadge status={b.status} />
            <PaymentBadge status={b.payment_status} />
          </div>
          <div className="text-sm text-white/60 flex flex-wrap gap-x-4 gap-y-1">
            <span>Ref: <span className="text-white font-mono">{b.order_number || b.booking_reference}</span></span>
            {b.flight_number && <span>Vuelo: {b.flight_number}{b.airline ? ` (${b.airline})` : ''}</span>}
            {b.arrival_date && <span>Llegada: {b.arrival_date}{b.arrival_time ? ` ${b.arrival_time}` : ''}</span>}
            {b.return_date && <span>Regreso: {b.return_date}{b.return_time ? ` ${b.return_time}` : ''}</span>}
            <span>Creada: {new Date(b.created_at).toLocaleDateString('es-CO')}</span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          {typeof b.package_price === 'number' && (
            <p className="text-white font-semibold">
              {b.package_price.toLocaleString('es-CO')} {b.currency?.toUpperCase() || 'USD'}
            </p>
          )}
          <span className="text-xs text-white/40 group-open:hidden">Ver detalle</span>
          <span className="text-xs text-white/40 hidden group-open:block">Ocultar</span>
        </div>
      </summary>
      <div className="border-t border-[var(--border)] p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-white/80 font-semibold">Huésped</p>
          <p className="text-white/60">Nombre: {b.customer_name || '-'}</p>
          <p className="text-white/60">Email: {b.customer_email || '-'}</p>
          <p className="text-white/60">Tel: {b.customer_phone || '-'}</p>
          <p className="text-white/60">País: {b.customer_country || '-'}</p>
          <p className="text-white/60">Idioma: {b.customer_language || '-'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-white/80 font-semibold">Viaje</p>
          <p className="text-white/60">Destino: {b.destination_address || '-'}</p>
          <p className="text-white/60">Personas: {b.num_people || '-'}</p>
          <p className="text-white/60">Perfil viajero: {b.traveler_profile || '-'}</p>
          <p className="text-white/60">Hotel/Alojamiento: {b.is_hotel_booking ? `Sí (hotel:${b.hotel_id} room:${b.room_id} noches:${b.num_nights})` : 'No'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-white/80 font-semibold">Pago</p>
          <p className="text-white/60">Estado: {b.payment_status}</p>
          <p className="text-white/60">Monto: {b.package_price != null ? `${b.package_price.toLocaleString('es-CO')} ${b.currency?.toUpperCase()||'USD'}` : '-'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-white/80 font-semibold">Extras/Notas</p>
          <p className="text-white/60">Viajes adicionales: {Array.isArray(trips) && trips.length ? trips.join(', ') : '-'}</p>
          <p className="text-white/60">Booking ref: {b.booking_reference}</p>
          <p className="text-white/60">Order: {b.order_number || '-'}</p>
        </div>
      </div>
    </details>
  )
}

export default function MisReservasPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false)
      return
    }
    fetch('/api/me/bookings')
      .then((res) => (res.ok ? res.json() : { bookings: [] }))
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [isSignedIn])

  return (
    <main className="min-h-dvh bg-bg-dark">
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Mis reservas</h1>
            <p className="text-white/60 mt-2">Revisa el estado de tus reservas, pagos y seguimiento.</p>
          </div>
          <Link href="/booking" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-[var(--accent-gold-light)] transition-colors">
            Nueva reserva
          </Link>
        </div>

        {!isLoaded ? (
          <div className="h-24 bg-bg-card border border-[var(--border)] rounded-2xl animate-pulse" />
        ) : !isSignedIn ? (
          <div className="bg-bg-card border border-[var(--border)] rounded-2xl p-8 text-center space-y-4">
            <p className="text-white text-lg font-semibold">Inicia sesión para ver tus reservas</p>
            <p className="text-white/60">Necesitamos tu cuenta para mostrar solo las reservas que hayas hecho con este usuario.</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-[var(--accent-gold-light)] transition-colors">
                Iniciar sesión
              </button>
            </SignInButton>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card border border-[var(--border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-bg-card border border-[var(--border)] rounded-2xl p-8 text-center space-y-4">
            <p className="text-white text-lg font-semibold">Aún no tienes reservas</p>
            <p className="text-white/60">Cuando hagas tu primera reserva aparecerá aquí con su estado y referencia.</p>
            <Link href="/booking" className="inline-flex px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-[var(--accent-gold-light)] transition-colors">
              Crear mi primera reserva
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingDetail key={b.id} b={b} />
            ))}
          </div>
        )}

        {isSignedIn && !loading && bookings.length > 0 && (
          <div className="mt-10 bg-bg-card border border-[var(--border)] rounded-2xl p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-white font-semibold text-lg">Legal y soporte</h2>
                <p className="text-white/60 mt-1">Consulta nuestros términos, política de privacidad y política de reembolsos.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/terminos-y-condiciones" className="px-4 py-2 rounded-xl border border-[var(--border)] text-white/80 hover:text-white hover:bg-white/5 transition-colors text-sm">Términos y condiciones</Link>
                <Link href="/politica-de-privacidad" className="px-4 py-2 rounded-xl border border-[var(--border)] text-white/80 hover:text-white hover:bg-white/5 transition-colors text-sm">Política de privacidad</Link>
                <Link href="/politica-de-reembolsos" className="px-4 py-2 rounded-xl border border-[var(--border)] text-white/80 hover:text-white hover:bg-white/5 transition-colors text-sm">Política de reembolsos</Link>
                <Link href="/faq" className="px-4 py-2 rounded-xl border border-[var(--border)] text-white/80 hover:text-white hover:bg-white/5 transition-colors text-sm">Preguntas frecuentes</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
