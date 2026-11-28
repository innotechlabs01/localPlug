'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth, SignInButton } from '@clerk/nextjs'
import RideMap from '@/app/components/ui/ride-map'
import AddressAutocomplete, { type AddressSuggestion } from '@/app/components/ui/address-autocomplete'
import { calculateRideQuote } from '@/lib/rides/fare'
import { LOCAL_PLACES } from '@/lib/rides/places'

interface PricingRule {
  category: string
  label: string
  base_usd: number
  per_km_usd: number
  per_min_usd: number
  min_fare_usd: number
  avg_speed_kmh: number
  platform_commission_pct: number
}

interface MapPoint {
  lat: number
  lng: number
  label: string
}

interface RideStop {
  id: string
  label: string
  lat?: number
  lng?: number
}

interface QuickDistanceOption {
  placeId: string
  label: string
  distanceKm: number
  durationMin: number
  source: 'osrm' | 'straight_line'
}

type GpsState = 'prompt' | 'granted' | 'denied' | 'unavailable'
type SheetMode = 'auto' | 'open' | 'hidden'
type RouteStatus = 'idle' | 'loading' | 'ready' | 'fallback'

const GPS_PICKUP = 'Mi ubicación actual (GPS)'

const FALLBACK_PRICING: PricingRule[] = [
  { category: 'standard', label: 'Standard (Básico)', base_usd: 1.5, per_km_usd: 0.65, per_min_usd: 0.1, min_fare_usd: 3, avg_speed_kmh: 28, platform_commission_pct: 18 },
  { category: 'suv', label: 'SUV / Eléctrico', base_usd: 2.0, per_km_usd: 0.85, per_min_usd: 0.14, min_fare_usd: 4.5, avg_speed_kmh: 28, platform_commission_pct: 20 },
  { category: 'vip', label: 'VIP (De Lujo)', base_usd: 3.0, per_km_usd: 1.15, per_min_usd: 0.2, min_fare_usd: 7, avg_speed_kmh: 30, platform_commission_pct: 20 },
  { category: 'luxury', label: 'Luxury Ejecutivo', base_usd: 5.0, per_km_usd: 1.65, per_min_usd: 0.3, min_fare_usd: 12, avg_speed_kmh: 30, platform_commission_pct: 22 },
]

const QUICK_DESTINATIONS = [
  { label: 'Provenza', placeId: 'local-provenza' },
  { label: 'El Poblado', placeId: 'local-el-poblado' },
  { label: 'Laureles', placeId: 'local-laureles' },
  { label: 'Envigado', placeId: 'local-envigado' },
]

const AIRPORT_KEYWORDS = /aeropuerto|airport|jmc|mde|jos[eé]\s*mar[ií]a|c[oó]rdova|rionegro/i

interface ActiveRide {
  id: number
  bookingReference: string
  status: string
  dispatchStatus: string
  paymentStatus?: string
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

interface RideHistoryItem {
  id: number
  bookingReference: string | null
  status: 'requested' | 'in_progress' | 'completed' | 'cancelled'
  pickup: string | null
  destination: string | null
  price: number | null
  currency: string
  createdAt: string | null
  driver: {
    id: number
    name: string | null
    vehicle: string | null
    plate: string | null
    rating: number | null
  } | null
}

const HISTORY_STATUS: Record<RideHistoryItem['status'], { label: string; className: string }> = {
  requested: { label: 'Solicitado', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  in_progress: { label: 'En curso', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  completed: { label: 'Completado', className: 'bg-white/10 text-white/70 border-white/20' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/15 text-red-300 border-red-500/30' },
}

export default function RideAppPage() {
  const { isSignedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<'ride' | 'airport'>('ride')
  const [pricing, setPricing] = useState<PricingRule[]>(FALLBACK_PRICING)
  const [taxRate, setTaxRate] = useState(0.19)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 6.2088, lng: -75.567 })
  const [gpsState, setGpsState] = useState<GpsState>('prompt')
  const [followGps, setFollowGps] = useState(true)
  const [pwaStandalone, setPwaStandalone] = useState(false)
  const followGpsRef = useRef(true)
  const [pickupAddress, setPickupAddress] = useState(GPS_PICKUP)
  const [pickupPlace, setPickupPlace] = useState<AddressSuggestion | null>(null)
  const [destination, setDestination] = useState('')
  const [destinationPlace, setDestinationPlace] = useState<AddressSuggestion | null>(null)
  const [resolvedDestination, setResolvedDestination] = useState<MapPoint | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]>>([])
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null)
  const [stops, setStops] = useState<RideStop[]>([])
  const [category, setCategory] = useState('standard')
  const [distanceKm, setDistanceKm] = useState(0)
  const [quickDistances, setQuickDistances] = useState<QuickDistanceOption[]>([])
  const [sheetMode, setSheetMode] = useState<SheetMode>('auto')
  const [isDesktop, setIsDesktop] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestContact, setGuestContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRideId, setActiveRideId] = useState<number | null>(null)
  const [rideToken, setRideToken] = useState<string | null>(null)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)
  const [rideTerminal, setRideTerminal] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<RideHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // A ref keeps the long-lived watchPosition callback in sync with the UI flag.
  const setGpsFollow = useCallback((value: boolean) => {
    followGpsRef.current = value
    setFollowGps(value)
  }, [])

  // Swapping entries physically moves the inputs, so route order is unambiguous.
  const moveStop = (index: number, direction: -1 | 1) => {
    setStops((previous) => {
      const target = index + direction
      if (target < 0 || target >= previous.length) return previous
      const next = [...previous]
      const moved = next[index]
      next[index] = next[target]
      next[target] = moved
      return next
    })
  }

  const isAirportDestination = AIRPORT_KEYWORDS.test(destination)

  // Load live Super Admin pricing (commission + validated IVA) and restore any
  // saved ride from URL (?ride=&token=) or localStorage.
  useEffect(() => {
    fetch('/api/rides/pricing')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.pricing) && d.pricing.length) setPricing(d.pricing)
        if (Number.isFinite(Number(d.taxRate))) setTaxRate(Number(d.taxRate))
      })
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

  // Debounced road estimate. Stops with coordinates travel as real OSRM
  // waypoints in display order, so the reported distance already includes them.
  useEffect(() => {
    const query = destination.trim()
    if (query.length < 4 || isAirportDestination) {
      setRouteStatus('idle')
      setRouteCoordinates([])
      setRouteDurationMin(null)
      return
    }

    setRouteStatus('loading')
    const waypoints = stops
      .filter(stop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
      .map(stop => ({ lat: stop.lat, lng: stop.lng }))

    const timer = setTimeout(() => {
      fetch('/api/rides/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: coords.lat,
          pickupLng: coords.lng,
          destination: query,
          destinationLat: destinationPlace?.lat,
          destinationLng: destinationPlace?.lng,
          waypoints,
        }),
      })
        .then(r => r.json())
        .then(d => {
          if (!d.success) {
            setRouteStatus('fallback')
            return
          }
          if (Number.isFinite(Number(d.distanceKm))) setDistanceKm(Number(d.distanceKm))
          setRouteDurationMin(Number.isFinite(Number(d.durationMin)) ? Number(d.durationMin) : null)
          const lat = Number(d.destLat)
          const lng = Number(d.destLng)
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setResolvedDestination({ lat, lng, label: d.resolvedAddress || query })
          }
          if (Array.isArray(d.routeCoordinates)) setRouteCoordinates(d.routeCoordinates)
          setRouteStatus(d.isFallback ? 'fallback' : 'ready')
        })
        .catch(() => setRouteStatus('fallback'))
    }, 500)
    return () => clearTimeout(timer)
  }, [destination, destinationPlace, coords.lat, coords.lng, isAirportDestination, stops])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  // watchPosition both requests permission and keeps the A pin current while
  // the rider is moving. Manual pickup selection stops following the device.
  useEffect(() => {
    setPwaStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    )
    if (!('geolocation' in navigator)) {
      setGpsState('unavailable')
      return
    }
    setGpsState('prompt')
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!followGpsRef.current) return
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsState('granted')
        setPickupPlace(null)
        setPickupAddress(GPS_PICKUP)
      },
      (err) => {
        setGpsState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Quick destination chips are position-aware road distances, not fixed copy.
  useEffect(() => {
    const params = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng) })
    let cancelled = false
    fetch(`/api/rides/quick-distances?${params.toString()}`)
      .then(r => (r.ok ? r.json() : { distances: [] }))
      .then(d => {
        if (!cancelled && Array.isArray(d.distances)) setQuickDistances(d.distances)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [coords.lat, coords.lng])

  const requestGps = () => {
    setGpsFollow(true)
    setGpsState('prompt')
    if (!('geolocation' in navigator)) {
      setGpsState('unavailable')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsState('granted')
        setPickupPlace(null)
        setPickupAddress(GPS_PICKUP)
      },
      (err) => {
        setGpsState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const res = await fetch('/api/me/rides', { cache: 'no-store' })
      if (!res.ok) throw new Error('history request failed')
      const data = await res.json()
      setHistory(Array.isArray(data.rides) ? data.rides : [])
    } catch {
      setHistoryError('No se pudo cargar tu historial.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) {
      setHistory([])
      setHistoryOpen(false)
      return
    }
    void loadHistory()
  }, [isSignedIn, loadHistory])

  const pollRideStatus = useCallback(async (id: number, token: string | null) => {
    try {
      const qs = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng) })
      if (token) qs.set('token', token)
      const res = await fetch(`/api/rides/${id}/status?${qs}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ride) {
          setActiveRide(data.ride)
          if (['cancelled', 'completed'].includes(data.ride.status) ||
              ['cancelled', 'completed'].includes(data.ride.dispatchStatus)) {
            setRideTerminal(true)
          }
        }
      }
    } catch { /* ignore */ }
  }, [coords.lat, coords.lng])

  useEffect(() => {
    if (!activeRideId || rideTerminal) return
    pollRideStatus(activeRideId, rideToken)
    const interval = setInterval(() => {
      if (!document.hidden) pollRideStatus(activeRideId, rideToken)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeRideId, rideToken, pollRideStatus, rideTerminal])

  const validStops = stops.map(stop => stop.label.trim()).filter(Boolean)
  const routeReady = routeStatus === 'ready' || routeStatus === 'fallback'
  const selectedRule = pricing.find(c => c.category === category) || pricing[0]
  const quote = calculateRideQuote(selectedRule, distanceKm, taxRate)
  const estimatedPrice = quote.totalUsd
  const estimatedMinutes = quote.estimatedMinutes
  const displayMinutes = routeDurationMin ?? estimatedMinutes
  const showDetails = isDesktop || (sheetMode !== 'hidden' && (sheetMode === 'open' || Boolean(destination)))

  const handleRequestRide = async () => {
    if (!destination.trim() || isAirportDestination || !routeReady || submitting) return
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
          destinationLat: destinationPlace?.lat ?? resolvedDestination?.lat,
          destinationLng: destinationPlace?.lng ?? resolvedDestination?.lng,
          stops: validStops,
          category,
          distanceKm,
          distanceIncludesStops: true,
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
      setRideTerminal(false)
      setActiveRide(null)
      try {
        localStorage.setItem('lp_active_ride', JSON.stringify({ rideId: data.rideId, rideToken: data.rideToken }))
      } catch { /* ignore */ }
      void loadHistory()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
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
    setRideTerminal(false)
    try { localStorage.removeItem('lp_active_ride') } catch { /* ignore */ }
  }

  const pickupPoint: MapPoint | null = pickupPlace
    ? { lat: pickupPlace.lat, lng: pickupPlace.lng, label: pickupAddress }
    : followGps && gpsState === 'granted'
      ? { lat: coords.lat, lng: coords.lng, label: GPS_PICKUP }
      : null
  const destinationPoint: MapPoint | null = destinationPlace
    ? { lat: destinationPlace.lat, lng: destinationPlace.lng, label: destinationPlace.label }
    : resolvedDestination
  const driverPoint: MapPoint | null = activeRide?.driver?.lat != null && activeRide.driver.lng != null
    ? {
        lat: activeRide.driver.lat,
        lng: activeRide.driver.lng,
        label: `${activeRide.driver.name || 'Conductor'} · ${activeRide.driver.plate || ''}`.trim(),
      }
    : null

  const rideCancelled = activeRide?.status === 'cancelled' || activeRide?.dispatchStatus === 'cancelled'
  const rideRefunded = String(activeRide?.paymentStatus || '').toLowerCase() === 'refunded'
  const rideAwaitingPayment = !activeRide || String(activeRide.paymentStatus || '') === 'pending'

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b0d14] text-[#f0f2f5] flex flex-col">
      {/* Full-bleed map: A = pickup, B = destination, D = assigned driver */}
      <div className="absolute inset-0 z-0">
        <RideMap
          pickup={pickupPoint}
          destination={destinationPoint}
          driver={driverPoint}
          routeCoordinates={routeCoordinates}
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

        <div className="pointer-events-auto flex items-center gap-1.5">
          {isSignedIn && (
            <button
              type="button"
              onClick={() => setHistoryOpen(open => !open)}
              aria-expanded={historyOpen}
              aria-label="Mis viajes"
              className={`px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-xl border text-[11px] font-semibold shadow-lg transition ${
                historyOpen ? 'border-emerald-400/60 text-emerald-300' : 'border-white/10 text-zinc-200 hover:text-white'
              }`}
            >
              Mis viajes
            </button>
          )}
          <button
            type="button"
            onClick={requestGps}
            aria-label="Activar GPS"
            title={gpsState === 'denied'
              ? 'Permite la ubicación en tu navegador para fijar el punto A'
              : pwaStandalone ? 'Ubicación activa en la app instalada' : 'Solicitar ubicación del dispositivo'}
            className="px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-white/10 text-[11px] text-emerald-400 font-medium shadow-lg hover:text-white"
          >
            {gpsState === 'granted'
              ? `● GPS${pwaStandalone ? ' · App' : ''}`
              : gpsState === 'denied'
                ? 'GPS bloqueado'
                : gpsState === 'unavailable'
                  ? 'Sin GPS'
                  : 'Activar GPS'}
          </button>
        </div>
      </header>

      {historyOpen && isSignedIn && (
        <div className="absolute left-2 right-2 top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] z-30 mx-auto max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Viajes recientes</h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Cerrar historial"
                className="rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[45dvh] divide-y divide-white/5 overflow-y-auto">
              {historyLoading ? (
                <p className="px-4 py-6 text-center text-xs text-zinc-400">Cargando tus viajes...</p>
              ) : historyError ? (
                <p className="px-4 py-6 text-center text-xs text-red-300">{historyError}</p>
              ) : history.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-zinc-400">
                  Todavía no tenés viajes guardados.
                </p>
              ) : (
                history.map((ride) => {
                  const status = HISTORY_STATUS[ride.status] || HISTORY_STATUS.requested
                  return (
                    <article key={ride.id || ride.bookingReference} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                              {status.label}
                            </span>
                            {ride.createdAt && (
                              <time className="text-[10px] text-zinc-500">
                                {new Date(ride.createdAt).toLocaleDateString('es-CO')}
                              </time>
                            )}
                          </div>
                          <p className="mt-1.5 truncate text-xs font-semibold text-white">
                            {ride.driver?.name || 'Conductor por asignar'}
                          </p>
                          {ride.driver && (
                            <p className="truncate text-[10px] text-zinc-400">
                              {ride.driver.vehicle || 'Vehículo'} · {ride.driver.plate || '—'} · ★{' '}
                              {ride.driver.rating != null ? Number(ride.driver.rating).toFixed(1) : 'Sin calificar'}
                            </p>
                          )}
                          <p className="mt-1 truncate text-[11px] text-zinc-300">
                            {ride.pickup ? `${ride.pickup} → ` : ''}{ride.destination || 'Destino no registrado'}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-600">{ride.bookingReference}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-emerald-400">
                            {ride.price != null ? `$${Number(ride.price).toFixed(2)}` : '—'}
                          </p>
                          <p className="text-[10px] text-zinc-500">{(ride.currency || 'USD').toUpperCase()}</p>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: fixed left panel. Mobile: collapsible bottom sheet. */}
      <div className="relative z-20 mt-auto w-full mx-auto px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:mx-0 lg:mt-0 lg:h-dvh lg:w-[420px] lg:shrink-0 lg:px-0 lg:pb-0 xl:w-[460px]">
        <div
          data-ride-sheet
          data-ride-panel
          className={`rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-5 max-h-[72dvh] overflow-y-auto space-y-4 lg:h-full lg:max-h-none lg:rounded-none lg:border-y-0 lg:border-l-0 ${
            sheetMode === 'hidden' && !isDesktop ? '!p-2 max-h-none' : ''
          }`}
        >
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setSheetMode(mode => mode === 'hidden' ? 'open' : 'hidden')}
              aria-expanded={sheetMode !== 'hidden'}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <span aria-hidden="true" className="h-1 w-8 rounded-full bg-white/25" />
              {sheetMode === 'hidden' ? 'Ver panel de ruta' : 'Ocultar panel'}
            </button>
          )}
          {sheetMode === 'hidden' && !isDesktop ? null : (
            activeTab === 'airport' ? (
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
                <span className={`text-xs font-bold uppercase tracking-wider ${rideCancelled ? 'text-red-400' : 'text-emerald-400'}`}>
                  ● {rideCancelled
                    ? 'Servicio cancelado'
                    : rideAwaitingPayment
                      ? 'Pago pendiente'
                      : activeRide?.driver
                        ? 'Conductor en camino'
                        : 'Buscando conductor'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{activeRide?.bookingReference || `#${activeRideId}`}</span>
              </div>

              {rideCancelled ? (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 space-y-1">
                  <div className="font-semibold text-white">No encontramos un conductor disponible.</div>
                  <p className="text-red-200/80">
                    {rideRefunded
                      ? 'Cancelamos el servicio automáticamente y devolvimos el importe a tu método de pago. El reembolso puede tardar unos días en reflejarse.'
                      : 'Cancelamos el servicio automáticamente y liberamos a los conductores consultados. Tu tarjeta no fue cobrada.'}
                  </p>
                </div>
              ) : activeRide?.driver ? (
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
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-extrabold text-zinc-950">A</span>
                  <AddressAutocomplete
                    aria-label="¿Dónde te recogemos?"
                    className="flex-1"
                    value={pickupAddress === GPS_PICKUP ? '' : pickupAddress}
                    onChange={value => {
                      setGpsFollow(!value.trim())
                      setPickupPlace(null)
                      setPickupAddress(value.trim() ? value : GPS_PICKUP)
                    }}
                    onSelect={suggestion => {
                      if (!suggestion) return
                      setGpsFollow(false)
                      setPickupPlace(suggestion)
                      setCoords({ lat: suggestion.lat, lng: suggestion.lng })
                      setPickupAddress(suggestion.label)
                    }}
                    placeholder="¿Dónde te recogemos? (GPS o dirección)"
                    inputClassName="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                  />
                </div>
                {!pickupPoint && (
                  <p className="pl-8 text-[10px] text-amber-300">
                    Activa el GPS o elige una sugerencia para fijar el punto A.
                  </p>
                )}
                {gpsState === 'denied' && (
                  <button
                    type="button"
                    onClick={requestGps}
                    className="ml-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold text-amber-200"
                  >
                    Permitir ubicación del dispositivo
                  </button>
                )}
                {stops.map((stop, idx) => (
                  <div key={stop.id} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-extrabold text-zinc-950">{idx + 1}</span>
                    <AddressAutocomplete
                      aria-label={`Parada ${idx + 1}`}
                      className="flex-1"
                      value={stop.label}
                      onChange={value => setStops(previous => previous.map((item, i) =>
                        i === idx ? { ...item, label: value, lat: undefined, lng: undefined } : item))}
                      onSelect={suggestion => {
                        if (!suggestion) return
                        setStops(previous => previous.map((item, i) => i === idx ? {
                          id: item.id,
                          label: suggestion.label,
                          lat: suggestion.lat,
                          lng: suggestion.lng,
                        } : item))
                      }}
                      placeholder={`Parada ${idx + 1} (Ej: Centro Comercial Santa Fe)`}
                      inputClassName="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                    />
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveStop(idx, -1)}
                        aria-label={`Subir parada ${idx + 1}`}
                        className="rounded bg-white/5 px-2 text-[11px] text-zinc-300 disabled:opacity-25 hover:not-disabled:text-white"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={idx === stops.length - 1}
                        onClick={() => moveStop(idx, 1)}
                        aria-label={`Bajar parada ${idx + 1}`}
                        className="rounded bg-white/5 px-2 text-[11px] text-zinc-300 disabled:opacity-25 hover:not-disabled:text-white"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStops(previous => previous.filter((_, i) => i !== idx))}
                      aria-label={`Quitar parada ${idx + 1}`}
                      className="shrink-0 rounded-xl bg-zinc-900 px-2.5 py-2 text-xs text-zinc-400 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {stops.some(stop => stop.label.trim() && (stop.lat == null || stop.lng == null)) && (
                  <p className="pl-8 text-[10px] text-amber-300">
                    Elige una sugerencia en cada parada para incluirla en la ruta.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-extrabold text-zinc-950">B</span>
                  <AddressAutocomplete
                    aria-label="¿A dónde vas?"
                    className="flex-1"
                    value={destination}
                    onChange={value => setDestination(value)}
                    onSelect={suggestion => {
                      setDestinationPlace(suggestion)
                      if (suggestion) {
                        setResolvedDestination({
                          lat: suggestion.lat,
                          lng: suggestion.lng,
                          label: suggestion.label,
                        })
                      } else {
                        setResolvedDestination(null)
                        setRouteCoordinates([])
                      }
                    }}
                    placeholder="¿A dónde vas? (Ej: Provenza, Laureles...)"
                    inputClassName="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                  />
                  {stops.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setStops(previous => [...previous, {
                        id: `stop-${Date.now()}-${previous.length}`,
                        label: '',
                      }])}
                      className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-emerald-400 whitespace-nowrap"
                    >
                      + Parada
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_DESTINATIONS.map(d => {
                    const distance = quickDistances.find(item => item.placeId === d.placeId)
                    const place = LOCAL_PLACES.find(p => p.id === d.placeId)
                    return (
                      <button
                        key={d.label}
                        type="button"
                        title={distance
                          ? `~${distance.durationMin} min · ${distance.source === 'osrm' ? 'distancia por ruta' : 'distancia aproximada'}`
                          : undefined}
                        onClick={() => {
                          setDestination(place?.label || d.label)
                          setDestinationPlace(place ? {
                            id: place.id,
                            label: place.label,
                            detail: place.detail,
                            lat: place.lat,
                            lng: place.lng,
                          } : null)
                          setResolvedDestination(place ? {
                            lat: place.lat,
                            lng: place.lng,
                            label: place.label,
                          } : null)
                          setRouteCoordinates([])
                          setRouteStatus('idle')
                        }}
                        className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300"
                      >
                        {d.label}{distance && pickupPoint ? ` · ${distance.distanceKm}km` : ''}
                      </button>
                    )
                  })}
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

              {!showDetails && (
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-zinc-400">
                  Elige el punto B para dibujar la trayectoria y ver tarifa, comisión e IVA reales.
                </p>
              )}

              {showDetails && (
                <>
                  {routeStatus === 'loading' && (
                    <p role="status" className="text-[10px] text-zinc-400">Calculando ruta real...</p>
                  )}
                  {routeStatus === 'fallback' && (
                    <p className="text-[10px] text-amber-300">
                      Distancia aproximada: el proveedor de rutas no respondió.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {pricing.map(rule => {
                      const ruleQuote = calculateRideQuote(rule, distanceKm, taxRate)
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
                            <span className={routeReady ? 'text-emerald-400' : 'text-zinc-500'}>
                              {routeReady ? `$${ruleQuote.totalUsd.toFixed(2)}` : '—'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {routeReady
                              ? `~${displayMinutes} min · ${distanceKm.toFixed(1)} km · app ${ruleQuote.commPct}%`
                              : `Ruta por calcular · app ${ruleQuote.commPct}%`}
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

                  {routeReady ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-zinc-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Tarifa ({distanceKm.toFixed(1)} km)</span>
                        <span>${quote.subtotalUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Comisión app ({quote.commPct}%)</span>
                        <span>${quote.platformFeeUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>IVA ({(quote.taxRate * 100).toFixed(0)}%)</span>
                        <span>${quote.taxUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-1.5 font-bold text-white">
                        <span>Total a pagar</span>
                        <span>${quote.totalUsd.toFixed(2)} USD</span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {routeStatus === 'fallback'
                          ? 'Ruta aproximada · comisión e IVA del super_admin.'
                          : 'Ruta por OSM · comisión e IVA del super_admin.'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-zinc-400">
                      El total se calcula con la ruta real y la configuración del super_admin.
                    </div>
                  )}

                  {error && (
                    <div role="alert" className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleRequestRide}
                    disabled={!destination.trim() || isAirportDestination || !routeReady || submitting}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-sm transition-all"
                  >
                    {submitting
                      ? 'Abriendo pago seguro...'
                      : routeReady
                        ? `Pagar con Tarjeta · $${estimatedPrice.toFixed(2)} USD (~${displayMinutes} min)`
                        : 'Calculando ruta...'}
                  </button>

                  <section className="hidden border-t border-white/10 pt-4 lg:block" aria-label="Fidelización">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#e8c99b]">LocalPlug Rewards</h2>
                    <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                      {isSignedIn
                        ? `Viajes completados: ${history.filter(item => item.status === 'completed').length}. Los beneficios de cliente frecuente se activan al completar viajes.`
                        : 'Ingresa para ver tus viajes completados y beneficios de cliente frecuente.'}
                    </p>
                  </section>
                </>
              )}
            </>
          )
          )}
        </div>
      </div>
    </div>
  )
}
