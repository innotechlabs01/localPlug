'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth, SignInButton } from '@clerk/nextjs'

const CATEGORIES = [
  { id: 'standard', name: 'Standard', desc: 'Sedán cómodo · 1-3 pax', baseUsd: 8, perKm: 1.2, eta: '4-6 min' },
  { id: 'suv', name: 'SUV', desc: 'Camioneta amplia · 1-4 pax', baseUsd: 14, perKm: 1.8, eta: '5-8 min' },
  { id: 'vip', name: 'VIP', desc: 'Ejecutivo premium · 1-4 pax', baseUsd: 22, perKm: 2.5, eta: '6-10 min' },
  { id: 'luxury', name: 'Luxury', desc: 'Alta gama blindado/VIP', baseUsd: 35, perKm: 3.5, eta: '8-12 min' },
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

export default function RideAppPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<'ride' | 'airport'>('ride')
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 6.2088, lng: -75.567 })
  const [gpsReady, setGpsReady] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('Mi ubicación actual (GPS)')
  const [destination, setDestination] = useState('')
  const [category, setCategory] = useState('standard')
  const [distanceKm, setDistanceKm] = useState(6)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRideId, setActiveRideId] = useState<number | null>(null)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)

  const isAirportDestination = AIRPORT_KEYWORDS.test(destination)

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

  const pollRideStatus = useCallback(async (rideId: number) => {
    try {
      const res = await fetch(`/api/rides/${rideId}/status?lat=${coords.lat}&lng=${coords.lng}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ride) setActiveRide(data.ride)
      }
    } catch { /* ignore */ }
  }, [coords.lat, coords.lng])

  useEffect(() => {
    if (!activeRideId) return
    pollRideStatus(activeRideId)
    const interval = setInterval(() => {
      if (!document.hidden) pollRideStatus(activeRideId)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeRideId, pollRideStatus])

  const selectedCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0]
  const estimatedPrice = (selectedCat.baseUsd + distanceKm * selectedCat.perKm).toFixed(2)

  const handleRequestRide = async () => {
    if (!destination.trim() || isAirportDestination || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress,
          destinationAddress: destination.trim(),
          category,
          distanceKm,
          pickupLat: coords.lat,
          pickupLng: coords.lng,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo solicitar el viaje')
        return
      }
      setActiveRideId(data.rideId)
    } catch {
      setError('Error de red al solicitar el viaje')
    } finally {
      setSubmitting(false)
    }
  }

  const mapLat = activeRide?.driver?.lat ?? coords.lat
  const mapLng = activeRide?.driver?.lng ?? coords.lng
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(mapLng - 0.025).toFixed(5)},${(mapLat - 0.025).toFixed(5)},${(mapLng + 0.025).toFixed(5)},${(mapLat + 0.025).toFixed(5)}&layer=mapnik&marker=${mapLat.toFixed(5)},${mapLng.toFixed(5)}`

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d14', color: '#f0f2f5', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top App Bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#111318', borderBottom: '1px solid #282b38' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#f0f2f5', fontWeight: 700, fontSize: 16 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #e8c99b, #d4a574)', color: '#0b0d14', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>M</span>
          Medellín Ride
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('ride')}
            style={{
              padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
              background: activeTab === 'ride' ? '#10b981' : '#181b25',
              color: activeTab === 'ride' ? '#0b0d14' : '#9ca0b0',
            }}
          >
            🚗 Pedir Viaje
          </button>
          <button
            onClick={() => setActiveTab('airport')}
            style={{
              padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
              background: activeTab === 'airport' ? '#d4a84b' : '#181b25',
              color: activeTab === 'airport' ? '#0b0d14' : '#9ca0b0',
            }}
          >
            ✈️ Aeropuerto
          </button>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'airport' ? (
        <main style={{ flex: 1, maxWidth: 680, width: '100%', margin: '32px auto', padding: '0 20px' }}>
          <div style={{ background: '#181b25', border: '1px solid #282b38', borderRadius: 16, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✈️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Traslados Programados de Aeropuerto (JMC)</h1>
            <p style={{ fontSize: 14, color: '#9ca0b0', lineHeight: 1.6, marginBottom: 24 }}>
              Para recogidas o traslados al Aeropuerto José María Córdova (MDE), agenda tu servicio con seguimiento de vuelo,
              tarifa fija garantizada y conductor asignado con anticipación.
            </p>
            <Link
              href="/booking?plan=smooth-landing"
              style={{
                display: 'inline-block', padding: '12px 28px', borderRadius: 10,
                background: 'linear-gradient(135deg, #e8c99b, #d4a574)', color: '#0b0d14',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}
            >
              Agendar Traslado al Aeropuerto →
            </Link>
          </div>
        </main>
      ) : (
        <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 0 }}>
          {/* Live Map */}
          <div style={{ position: 'relative', minHeight: 380, background: '#111318' }}>
            <iframe
              title="Live Ride Map"
              src={osmUrl}
              style={{ width: '100%', height: '100%', minHeight: 380, border: 0 }}
              loading="lazy"
            />
            <div style={{
              position: 'absolute', top: 12, left: 12, padding: '6px 12px', borderRadius: 999,
              background: 'rgba(11,13,20,0.88)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12,
            }}>
              {activeRide?.driver?.lat
                ? `🚗 Conductor en vivo · ETA ~${activeRide.etaMinutes ?? '—'} min`
                : gpsReady ? '📍 GPS conectado' : '📍 Medellín'}
            </div>
          </div>

          {/* Ride Request / Live Status Sheet */}
          <div style={{ padding: 24, background: '#111318', borderLeft: '1px solid #282b38', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLoaded ? (
              <p style={{ color: '#9ca0b0' }}>Cargando...</p>
            ) : !isSignedIn ? (
              <div style={{ padding: 24, background: '#181b25', borderRadius: 12, border: '1px solid #282b38', textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Inicia sesión para pedir tu viaje</h2>
                <p style={{ fontSize: 13, color: '#9ca0b0', marginBottom: 16 }}>
                  Usa tu cuenta para solicitar conductores verificados con pago seguro con tarjeta.
                </p>
                <SignInButton mode="modal">
                  <button style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#10b981', color: '#0b0d14', fontWeight: 700, cursor: 'pointer' }}>
                    Iniciar Sesión
                  </button>
                </SignInButton>
              </div>
            ) : activeRideId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                    ● {activeRide?.driver ? 'Conductor Asignado' : 'Buscando conductor cercano...'}
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca0b0' }}>{activeRide?.bookingReference || `#${activeRideId}`}</span>
                </div>

                {activeRide?.driver ? (
                  <div style={{ padding: 16, borderRadius: 12, background: '#181b25', border: '1px solid rgba(16,185,129,0.4)' }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{activeRide.driver.name}</div>
                    <div style={{ fontSize: 13, color: '#9ca0b0', marginTop: 2 }}>
                      {activeRide.driver.vehicle || 'Vehículo'} · Placa <strong>{activeRide.driver.plate || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 13 }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        ETA: {activeRide.etaMinutes != null ? `~${activeRide.etaMinutes} min` : 'Calculando...'}
                      </span>
                      {activeRide.driver.phone && (
                        <a href={`tel:${activeRide.driver.phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                          📞 {activeRide.driver.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 16, borderRadius: 12, background: '#181b25', border: '1px solid #282b38', fontSize: 13, color: '#9ca0b0' }}>
                    <div style={{ fontWeight: 600, color: '#f0f2f5', marginBottom: 4 }}>
                      {(activeRide?.waitSeconds || 0) >= 25
                        ? `⏳ Alta demanda en tu zona — consultando conductor #${activeRide?.queueAttempt || 2} en cola...`
                        : `🔍 Buscando el conductor más cercano en tu zona (cola #${activeRide?.queueAttempt || 1})...`}
                    </div>
                    <div>
                      Si un conductor no responde en 30s, el sistema pasa automáticamente al siguiente conductor cercano para evitar demoras.
                    </div>
                  </div>
                )}

                <div style={{ padding: 14, borderRadius: 10, background: '#181b25', border: '1px solid #282b38', fontSize: 13 }}>
                  <div style={{ color: '#9ca0b0', fontSize: 11 }}>DESTINO</div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{activeRide?.destinationAddress || destination}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca0b0', fontSize: 12 }}>
                    <span>{activeRide?.packageName || selectedCat.name}</span>
                    <strong style={{ color: '#f0f2f5' }}>${Number(activeRide?.price || estimatedPrice).toFixed(2)} USD (Tarjeta)</strong>
                  </div>
                </div>

                <button
                  onClick={() => { setActiveRideId(null); setActiveRide(null) }}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #282b38', background: 'transparent', color: '#9ca0b0', cursor: 'pointer', fontSize: 13 }}
                >
                  Solicitar otro viaje
                </button>
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>¿A dónde vas?</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    value={pickupAddress}
                    onChange={e => setPickupAddress(e.target.value)}
                    placeholder="Punto de recogida (GPS)"
                    style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', fontSize: 13.5 }}
                  />
                  <input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Ingresa tu destino en Medellín (Ej: Provenza, Laureles...)"
                    style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', fontSize: 13.5 }}
                  />
                </div>

                {/* Smart Airport Guard */}
                {isAirportDestination && (
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.45)', fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                      ✈️ ¿Vas o vienes del Aeropuerto JMC?
                    </div>
                    <p style={{ margin: '0 0 10px', color: '#f0f2f5', lineHeight: 1.45 }}>
                      Los traslados de aeropuerto se agendan desde la pestaña <strong>Aeropuerto</strong> para incluir seguimiento de vuelo y tarifa fija.
                    </p>
                    <button
                      onClick={() => setActiveTab('airport')}
                      style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#d4a84b', color: '#0b0d14', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      Ir a pestaña Aeropuerto →
                    </button>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, color: '#9ca0b0', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Distancia estimada</span>
                    <strong>{distanceKm} km</strong>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={40}
                    value={distanceKm}
                    onChange={e => setDistanceKm(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {CATEGORIES.map(c => {
                    const price = (c.baseUsd + distanceKm * c.perKm).toFixed(0)
                    const active = category === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        style={{
                          textAlign: 'left', padding: 12, borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${active ? '#10b981' : '#282b38'}`,
                          background: active ? 'rgba(16,185,129,0.12)' : '#181b25',
                          color: '#f0f2f5',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13.5 }}>
                          <span>{c.name}</span>
                          <span style={{ color: '#10b981' }}>${price}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca0b0', marginTop: 3 }}>{c.desc}</div>
                        <div style={{ fontSize: 10, color: '#646880', marginTop: 2 }}>Recogida: {c.eta}</div>
                      </button>
                    )
                  })}
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#181b25', border: '1px solid #282b38', fontSize: 12, color: '#9ca0b0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>💳 Método de pago aceptado</span>
                  <strong style={{ color: '#f0f2f5' }}>Solo Tarjeta (USD)</strong>
                </div>

                {error && (
                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,80,0.14)', color: '#ef4450', fontSize: 12.5 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleRequestRide}
                  disabled={!destination.trim() || isAirportDestination || submitting}
                  style={{
                    padding: '14px 20px', borderRadius: 10, border: 'none',
                    background: (!destination.trim() || isAirportDestination) ? '#282b38' : '#10b981',
                    color: (!destination.trim() || isAirportDestination) ? '#646880' : '#0b0d14',
                    fontWeight: 800, fontSize: 15, cursor: (!destination.trim() || isAirportDestination) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Enviando solicitud...' : `Confirmar y Pedir ${selectedCat.name} · $${estimatedPrice} USD`}
                </button>
              </>
            )}
          </div>
        </main>
      )}
    </div>
  )
}
