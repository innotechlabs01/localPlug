'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth, SignInButton } from '@clerk/nextjs'

interface PricingRule {
  category: string
  label: string
  base_usd: number
  per_km_usd: number
  per_min_usd: number
  min_fare_usd: number
  avg_speed_kmh: number
}

const FALLBACK_PRICING: PricingRule[] = [
  { category: 'standard', label: 'Standard (Básico)', base_usd: 1.5, per_km_usd: 0.65, per_min_usd: 0.1, min_fare_usd: 3, avg_speed_kmh: 28 },
  { category: 'suv', label: 'SUV / Eléctrico', base_usd: 2.0, per_km_usd: 0.85, per_min_usd: 0.14, min_fare_usd: 4.5, avg_speed_kmh: 28 },
  { category: 'vip', label: 'VIP (De Lujo)', base_usd: 3.0, per_km_usd: 1.15, per_min_usd: 0.2, min_fare_usd: 7, avg_speed_kmh: 30 },
  { category: 'luxury', label: 'Luxury Ejecutivo', base_usd: 5.0, per_km_usd: 1.65, per_min_usd: 0.3, min_fare_usd: 12, avg_speed_kmh: 30 },
]

const QUICK_DESTINATIONS = [
  { label: 'Provenza', km: 5 },
  { label: 'El Poblado', km: 4 },
  { label: 'Laureles', km: 7 },
  { label: 'Envigado', km: 9 },
]

const AIRPORT_KEYWORDS = /aeropuerto|airport|jmc|mde|jos[eé]\s*mar[ií]a|c[oó]rdova|rionegro/i

interface ActiveRide {
  id: number
  bookingReference: string
  status: string
  dispatchStatus: string
  packageName: string
  price: number
  destinationAddress: string
  driver: {
    id: number
    name: string
    phone: string | null
    vehicle: string | null
    plate: string | null
    rating: number | null
    lat: number | null
    lng: number | null
  } | null
  distanceKm: number | null
  etaMinutes: number | null
  queueAttempt?: number
  waitSeconds?: number
}

function calcFare(rule: PricingRule, km: number) {
  const speed = Math.max(10, Number(rule.avg_speed_kmh) || 28)
  const mins = Math.max(4, Math.round((km / speed) * 60))
  const raw = Number(rule.base_usd) + km * Number(rule.per_km_usd) + mins * Number(rule.per_min_usd)
  const total = Math.round(Math.max(Number(rule.min_fare_usd), raw) * 100) / 100
  return { total, mins }
}

export default function RideAppPage() {
  const { isSignedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<'ride' | 'airport'>('ride')
  const [pricing, setPricing] = useState<PricingRule[]>(FALLBACK_PRICING)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 6.2088, lng: -75.567 })
  const [gpsReady, setGpsReady] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('Mi ubicación actual (GPS)')
  const [destination, setDestination] = useState('')
  const [stops, setStops] = useState<string[]>([])
  const [category, setCategory] = useState('standard')
  const [distanceKm, setDistanceKm] = useState(6)
  const [guestName, setGuestName] = useState('')
  const [guestContact, setGuestContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRideId, setActiveRideId] = useState<number | null>(null)
  const [rideToken, setRideToken] = useState<string | null>(null)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)

  const isAirportDestination = AIRPORT_KEYWORDS.test(destination)

  // Load live Super Admin pricing + restore saved active ride from URL (?ride=&token=) or localStorage
  useEffect(() => {
    fetch('/api/admin/ride-pricing')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.pricing) && d.pricing.length) setPricing(d.pricing) })
      .catch(() => {})

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const qRide = urlParams.get('ride')
      const qToken = urlParams.get('token')
      if (qRide && qToken) {
        setActiveRideId(Number(qRide))
        setRideToken(qToken)
        localStorage.setItem('lp_active_ride', JSON.stringify({ rideId: Number(qRide), rideToken: qToken }))
        return
      }
      const saved = localStorage.getItem('lp_active_ride')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.rideId && parsed?.rideToken) {
          setActiveRideId(Number(parsed.rideId))
          setRideToken(String(parsed.rideToken))
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Debounced real road distance estimate via OSRM/Nominatim
  useEffect(() => {
    if (!destination.trim() || destination.trim().length < 4 || isAirportDestination) return
    const timer = setTimeout(() => {
      fetch('/api/rides/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupLat: coords.lat, pickupLng: coords.lng, destination: destination.trim() }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && Number.isFinite(Number(d.distanceKm))) {
            setDistanceKm(Number(d.distanceKm))
          }
        })
        .catch(() => {})
    }, 700)
    return () => clearTimeout(timer)
  }, [destination, coords.lat, coords.lng, isAirportDestination])

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsReady(true)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const pollRideStatus = useCallback(async (id: number, token: string | null) => {
    try {
      const qs = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng) })
      if (token) qs.set('token', token)
      const res = await fetch(`/api/rides/${id}/status?${qs}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ride) setActiveRide(data.ride)
      }
    } catch { /* ignore */ }
  }, [coords.lat, coords.lng])

  useEffect(() => {
    if (!activeRideId) return
    pollRideStatus(activeRideId, rideToken)
    const interval = setInterval(() => {
      if (!document.hidden) pollRideStatus(activeRideId, rideToken)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeRideId, rideToken, pollRideStatus])

  const validStops = stops.map(s => s.trim()).filter(Boolean)
  const effectiveKm = distanceKm + validStops.length * 2
  const selectedRule = pricing.find(c => c.category === category) || pricing[0]
  const { total: estimatedPrice, mins: estimatedMinutes } = calcFare(selectedRule, effectiveKm)

  const handleRequestRide = async () => {
    if (!destination.trim() || isAirportDestination || submitting) return
    if (!isSignedIn && !guestContact.trim()) {
      setError('Ingresa tu email o WhatsApp para enviarte el recibo y conectar con el conductor.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const isEmail = guestContact.includes('@')
      const res = await fetch('/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress,
          destinationAddress: destination.trim(),
          stops: validStops,
          category,
          distanceKm,
          pickupLat: coords.lat,
          pickupLng: coords.lng,
          guestName: guestName.trim() || undefined,
          guestEmail: isEmail ? guestContact.trim() : undefined,
          guestPhone: !isEmail ? guestContact.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo solicitar el viaje')
        return
      }
      setActiveRideId(data.rideId)
      setRideToken(data.rideToken || null)
      try {
        localStorage.setItem('lp_active_ride', JSON.stringify({ rideId: data.rideId, rideToken: data.rideToken }))
      } catch { /* ignore */ }
    } catch {
      setError('Error de red al solicitar el viaje')
    } finally {
      setSubmitting(false)
    }
  }

  const clearRide = () => {
    setActiveRideId(null)
    setRideToken(null)
    setActiveRide(null)
    try { localStorage.removeItem('lp_active_ride') } catch { /* ignore */ }
  }

  const mapLat = activeRide?.driver?.lat ?? coords.lat
  const mapLng = activeRide?.driver?.lng ?? coords.lng
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(mapLng - 0.025).toFixed(5)},${(mapLat - 0.025).toFixed(5)},${(mapLng + 0.025).toFixed(5)},${(mapLat + 0.025).toFixed(5)}&layer=mapnik&marker=${mapLat.toFixed(5)},${mapLng.toFixed(5)}`

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b0d14] text-[#f0f2f5] flex flex-col">
      {/* Full-bleed Map Background */}
      <div className="absolute inset-0 z-0">
        <iframe
          title="Live Ride Map"
          src={osmUrl}
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>

      {/* Floating Glassmorphism Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-white/10 text-white text-xs font-semibold shadow-lg"
        >
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#e8c99b] to-[#b8956a] text-zinc-950 inline-flex items-center justify-center font-bold text-[11px]">M</span>
          Inicio
        </Link>

        <div className="pointer-events-auto inline-flex p-1 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-white/10 shadow-lg">
          <button
            onClick={() => setActiveTab('ride')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ride' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ciudad
          </button>
          <button
            onClick={() => setActiveTab('airport')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'airport' ? 'bg-[#d4a84b] text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Aeropuerto
          </button>
        </div>

        <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-white/10 text-[11px] text-emerald-400 font-medium shadow-lg">
          {gpsReady ? '● GPS' : 'Medellín'}
        </div>
      </header>

      {/* Bottom Sheet Overlay */}
      <div className="relative z-20 mt-auto w-full max-w-lg mx-auto px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-5 max-h-[72dvh] overflow-y-auto space-y-4">
          {activeTab === 'airport' ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[#d4a84b]">Traslados Aeropuerto JMC</div>
              <h1 className="text-lg font-bold text-white">Agenda tu traslado con vuelo rastreado</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tarifa fija garantizada, monitoreo de llegada de vuelo y conductor VIP esperándote en el aeropuerto.
              </p>
              <Link
                href="/booking?plan=smooth-landing"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#e8c99b] to-[#d4a574] text-zinc-950 font-bold text-sm"
              >
                Agendar Traslado al Aeropuerto →
              </Link>
            </div>
          ) : activeRideId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  ● {activeRide?.driver ? 'Conductor en camino' : 'Buscando conductor'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{activeRide?.bookingReference || `#${activeRideId}`}</span>
              </div>

              {activeRide?.driver ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-white">{activeRide.driver.name}</div>
                      <div className="text-xs text-zinc-400">
                        {activeRide.driver.vehicle || 'Vehículo'} · <strong className="text-white">{activeRide.driver.plate || '—'}</strong>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                      {activeRide.etaMinutes != null ? `~${activeRide.etaMinutes} min` : 'En camino'}
                    </div>
                  </div>
                  {activeRide.driver.phone && (
                    <a
                      href={`tel:${activeRide.driver.phone}`}
                      className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition"
                    >
                      Llamar al conductor ({activeRide.driver.phone})
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 space-y-1">
                  <div className="font-semibold text-white">
                    {(activeRide?.waitSeconds || 0) >= 25
                      ? `Alta demanda en tu zona — consultando conductor #${activeRide?.queueAttempt || 2} en cola...`
                      : `Buscando el conductor más cercano en tu zona (cola #${activeRide?.queueAttempt || 1})...`}
                  </div>
                  <p className="text-zinc-400">Si no responde en 30s, pasamos automáticamente al siguiente conductor cercano.</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span className="truncate max-w-[65%]">{activeRide?.destinationAddress || destination}</span>
                <strong className="text-white">${Number(activeRide?.price || estimatedPrice).toFixed(2)} USD</strong>
              </div>

              {!isSignedIn && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-300">¿Guardar recibo e historial?</span>
                  <SignInButton mode="modal">
                    <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white">
                      Crear cuenta
                    </button>
                  </SignInButton>
                </div>
              )}

              <button
                onClick={clearRide}
                className="w-full py-2.5 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white transition"
              >
                Solicitar otro viaje
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                <input
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="¿Dónde te recogemos? (GPS o dirección)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                />
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      value={stop}
                      onChange={e => setStops(prev => prev.map((s, i) => i === idx ? e.target.value : s))}
                      placeholder={`Parada ${idx + 1} (Ej: Centro Comercial Santa Fe)`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setStops(prev => prev.filter((_, i) => i !== idx))}
                      className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-400 hover:text-red-400"
                      title="Quitar parada"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="¿A dónde vas? (Ej: Provenza, Laureles...)"
                    className="flex-1 px-3.5 py-3 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                  />
                  {stops.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setStops(prev => [...prev, ''])}
                      className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-emerald-400 whitespace-nowrap"
                    >
                      + Parada
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_DESTINATIONS.map(d => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => { setDestination(d.label + ', Medellín'); setDistanceKm(d.km) }}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300"
                    >
                      {d.label} · {d.km}km
                    </button>
                  ))}
                </div>
              </div>

              {isAirportDestination && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-2">
                  <div className="font-bold text-amber-400">Traslado de Aeropuerto detectado</div>
                  <p className="text-zinc-300">Agenda los viajes al Aeropuerto JMC desde la pestaña <strong>Aeropuerto</strong> para tarifa fija y seguimiento de vuelo.</p>
                  <button
                    onClick={() => setActiveTab('airport')}
                    className="px-3 py-1.5 rounded-lg bg-[#d4a84b] text-zinc-950 font-bold text-xs"
                  >
                    Cambiar a Aeropuerto →
                  </button>
                </div>
              )}

              {/* Vehicle Categories with Dynamic Pricing (Base + Km + Min) */}
              <div className="grid grid-cols-2 gap-2">
                {pricing.map(rule => {
                  const { total, mins } = calcFare(rule, effectiveKm)
                  const active = category === rule.category
                  return (
                    <button
                      key={rule.category}
                      type="button"
                      onClick={() => setCategory(rule.category)}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        active ? 'bg-emerald-500/12 border-emerald-500' : 'bg-zinc-900 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">{rule.label}</span>
                        <span className="text-emerald-400">${total.toFixed(0)}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        ~{mins} min · {distanceKm} km
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Guest-first minimal contact (no registration required) */}
              {!isSignedIn && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Tu nombre"
                    className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <input
                    value={guestContact}
                    onChange={e => setGuestContact(e.target.value)}
                    placeholder="Email o WhatsApp *"
                    className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {error && (
                <div role="alert" className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <button
                onClick={handleRequestRide}
                disabled={!destination.trim() || isAirportDestination || submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-sm transition-all"
              >
                {submitting
                  ? 'Procesando pago y buscando conductor...'
                  : `Pagar con Tarjeta · $${estimatedPrice.toFixed(2)} USD (~${estimatedMinutes} min)`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
