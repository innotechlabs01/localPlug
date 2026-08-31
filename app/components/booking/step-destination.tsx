'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('@/app/components/ui/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 rounded-[var(--radius-md)] border border-[var(--border)] bg-gradient-to-br from-[rgba(212,165,116,0.08)] to-[rgba(212,165,116,0.02)]">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
        <span className="text-xs text-[var(--text-muted)]">Loading map...</span>
      </div>
    </div>
  ),
})

interface HotelData {
  id: number
  name: string
  slug: string
  description: string
  address: string
  stars: number
  phone: string
  email: string
  photos: string
  commission_rate: number
  rooms: RoomData[]
}

interface RoomData {
  id: number
  hotel_id: number
  name: string
  description: string
  capacity: number
  price_per_night: number
  display_price: number
  amenities: string
  photos: string
  status: string
}

interface DestinationData {
  hasPlace: boolean
  address: string
  wantsGuatape: boolean
  additionalTrips?: string[]
  numPeople?: number
  selectedHotelId?: number
  selectedRoomId?: number
}

interface BookingConfig {
  packages: Record<string, {
    name: string
    base_price_usd?: number
    price?: number
    service_fee_flat?: number
    features?: string[]
    tours?: Array<{ id: number; name: string; price_per_person_usd: number; vehicle_type: string; duration_hours: number }>
    is_popular?: boolean
  }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
  trm?: number
}

interface StepDestinationProps {
  data: DestinationData
  onChange: (data: DestinationData) => void
  customerNotes?: string
  onCustomerNotesChange?: (notes: string) => void
  config?: BookingConfig | null
}

export default function StepDestination({ data, onChange, customerNotes = '', onCustomerNotesChange, config }: StepDestinationProps) {
  const { t } = useI18n()
  const destT = t.booking.steps.destination

  const [hotels, setHotels] = useState<HotelData[]>([])
  const [hotelsLoading, setHotelsLoading] = useState(false)
  const [expandedHotel, setExpandedHotel] = useState<number | null>(null)

  // Tours come from packages (only full-insider has tours)
  const allTours = Object.values(config?.packages || {}).flatMap((pkg: any) => pkg.tours || [])
  // Deduplicate by id
  const uniqueTours = Array.from(new Map(allTours.map((t: any) => [String(t.id), t])).values()) as any[]
  const AVAILABLE_TRIPS = uniqueTours.map((trip: any) => ({
    id: String(trip.id),
    label: destT.trips[trip.id as keyof typeof destT.trips] || trip.name,
  }))

  const tripPrices: Record<string, number> = {}
  uniqueTours.forEach((trip: any) => {
    tripPrices[String(trip.id)] = Number(trip.price_per_person_usd) || 0
  })
  const numPeople = Math.max(1, Math.floor(data.numPeople || 1))
  const selectedTrips = data.additionalTrips ?? []
  const toursTotal = selectedTrips.reduce((sum: number, id: string) => sum + (tripPrices[id] ?? 0) * numPeople, 0)

  const togglePlace = (value: boolean) => {
    onChange({ ...data, hasPlace: value, address: value ? data.address : '' })
  }

  const toggleTrip = (tripId: string) => {
    const current = data.additionalTrips ?? []
    const next = current.includes(tripId)
      ? current.filter((id) => id !== tripId)
      : [...current, tripId]
    onChange({ ...data, additionalTrips: next })
  }

  const setNumPeople = (value: number) => {
    const clamped = Math.min(50, Math.max(1, Math.floor(value || 1)))
    onChange({ ...data, numPeople: clamped })
  }

  const selectRoom = (hotelId: number, roomId: number) => {
    onChange({ ...data, selectedHotelId: hotelId, selectedRoomId: roomId })
  }

  // Fetch hotels when user selects "I need suggestions"
  useEffect(() => {
    if (!data.hasPlace && hotels.length === 0 && !hotelsLoading) {
      setHotelsLoading(true)
      fetch('/api/hotels')
        .then(r => r.json())
        .then(d => {
          if (d.hotels) {
            // Parse amenities from JSON string for each room
            const parsed = d.hotels.map((h: any) => ({
              ...h,
              rooms: (h.rooms || []).map((r: any) => ({
                ...r,
                amenities: typeof r.amenities === 'string' ? tryParseJson(r.amenities) : r.amenities,
                photos: typeof r.photos === 'string' ? tryParseJson(r.photos) : r.photos,
              })),
            }))
            setHotels(parsed)
          }
        })
        .catch((err) => {
          console.error('[StepDestination] Failed to load hotels:', err)
        })
        .finally(() => setHotelsLoading(false))
    }
  }, [data.hasPlace, hotels.length, hotelsLoading])

  const renderStars = (n: number) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < n ? 'var(--accent-gold)' : 'var(--border)' }}>★</span>
  ))

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{destT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {destT.subtitle}
      </p>

      <div className="space-y-6">
        <div>
          <p className="text-label-md text-[var(--text-primary)] mb-3">
            {destT.hasPlace}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => togglePlace(true)}
              className={`flex-1 p-4 rounded-[var(--radius-md)] border-2 text-center transition-all duration-200 ${
                data.hasPlace
                  ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
              }`}
            >
              <span className={`text-label-md ${data.hasPlace ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                {destT.yesAddress}
              </span>
            </button>
            <button
              type="button"
              onClick={() => togglePlace(false)}
              className={`flex-1 p-4 rounded-[var(--radius-md)] border-2 text-center transition-all duration-200 ${
                !data.hasPlace
                  ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
              }`}
            >
              <span className={`text-label-md ${!data.hasPlace ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                {destT.needSuggestions}
              </span>
            </button>
          </div>
        </div>

        {data.hasPlace && (
          <div className="flex flex-col gap-3">
            <label htmlFor="address" className="text-label-md text-[var(--text-primary)]">
              {destT.addressLabel}
            </label>
            <div className="relative">
              <input
                id="address"
                type="text"
                placeholder={destT.addressPlaceholder}
                value={data.address}
                onChange={(e) => onChange({ ...data, address: e.target.value })}
                className="w-full px-4 py-3.5 pl-11 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>

            <LeafletMap address={data.address} className="h-48" />
          </div>
        )}

        {!data.hasPlace && (
          <div className="space-y-4">
            <p className="text-label-md text-[var(--text-primary)]">
              {destT.willHelp || 'Available hotels in Medellin'}
            </p>

            {hotelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-gold)' }} />
              </div>
            ) : hotels.length === 0 ? (
              <p className="text-body-md text-[var(--text-secondary)] py-6 text-center">
                {destT.noHotels || 'Loading hotels...'}
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {hotels.map(hotel => {
                  const isExpanded = expandedHotel === hotel.id
                  const selected = data.selectedHotelId === hotel.id
                  return (
                    <div
                      key={hotel.id}
                      className={`rounded-[var(--radius-md)] border ${selected ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.06)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'} transition-all`}
                    >
                      {/* Hotel header */}
                      <button
                        type="button"
                        onClick={() => setExpandedHotel(isExpanded ? null : hotel.id)}
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-[var(--radius-md)]"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--accent-gold), #b8860b)' }}>
                          {hotel.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-md font-medium text-white">{hotel.name}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span>{renderStars(hotel.stars)}</span>
                            <span className="text-[var(--text-muted)]">
                              {hotel.rooms.length} room{hotel.rooms.length !== 1 ? 's' : ''} available
                            </span>
                          </div>
                          {hotel.address ? (
                            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{hotel.address}</p>
                          ) : null}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
                          className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {/* Expanded rooms */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-[var(--border)]">
                          {hotel.rooms.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No rooms available</p>
                          ) : (
                            <div className="space-y-2 pt-3">
                              {hotel.rooms.map(room => {
                                const isRoomSelected = data.selectedRoomId === room.id && data.selectedHotelId === hotel.id
                                const amenities = Array.isArray(room.amenities) ? room.amenities : []
                                return (
                                  <div
                                    key={room.id}
                                    onClick={() => selectRoom(hotel.id, room.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                      isRoomSelected
                                        ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.1)]'
                                        : 'border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--border-light)]'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-medium text-white">{room.name}</p>
                                        {room.description && (
                                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{room.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs text-[var(--text-muted)]">
                                            🛏 {room.capacity} guest{room.capacity > 1 ? 's' : ''}
                                          </span>
                                          <span className="text-xs text-[var(--text-muted)]">
                                            📍 {room.status}
                                          </span>
                                        </div>
                                        {amenities.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {amenities.map((a: string, i: number) => (
                                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(212,165,116,0.12)] text-[var(--accent-gold)]">
                                                {a}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-[var(--accent-gold)]">
                                          ${Number(room.display_price).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-muted)]">per night</p>
                                        {isRoomSelected && (
                                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-gold)] text-[var(--bg-dark)] font-medium">
                                            Selected
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-6">
          <p className="text-label-md text-[var(--text-primary)] mb-4">
            {destT.additionalTrips}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_TRIPS.map((trip: any) => {
              const selected = selectedTrips.includes(trip.id)
              const price = tripPrices[trip.id]
              return (
                <label
                  key={trip.id}
                  className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all duration-200 ${
                    selected
                      ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                      : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleTrip(trip.id)}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 focus:ring-2 shrink-0"
                  />
                  <span className={`flex-1 text-body-md ${selected ? 'text-[var(--accent-gold)] font-medium' : 'text-[var(--text-primary)]'}`}>
                    {trip.label}
                  </span>
                  {typeof price === 'number' && price > 0 && (
                    <span className="text-[13px] font-semibold text-white shrink-0">
                      ${price.toFixed(2)}
                      <span className="text-[11px] font-normal text-[var(--text-muted)]"> {destT.perPerson}</span>
                      {config?.trm && (
                        <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">
                          ({(price * Number(config.trm)).toLocaleString('es-CO')} COP)
                        </span>
                      )}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <p className="text-label-md text-[var(--text-primary)] mb-3">{destT.numPeople}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
              <button
                type="button"
                onClick={() => setNumPeople(numPeople - 1)}
                className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                aria-label="Decrease travelers"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span className="w-12 text-center text-body-md font-semibold text-white">{numPeople}</span>
              <button
                type="button"
                onClick={() => setNumPeople(numPeople + 1)}
                className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                aria-label="Increase travelers"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            {selectedTrips.length > 0 && (
              <div className="text-[13px] text-[var(--text-secondary)]">
                {t.booking.steps.payment.summaryExperiences}:{' '}
                <span className="font-semibold text-[var(--accent-gold)]">${toursTotal.toFixed(2)} USD</span>
              </div>
            )}
            {selectedTrips.length === 0 && numPeople > 1 && (
              <span className="text-[12px] text-[var(--text-secondary)]">
                Service fee applies per traveler
              </span>
            )}
          </div>
        </div>

        {onCustomerNotesChange && (
          <div className="mt-6">
            <label className="block text-label-md text-[var(--text-primary)] font-semibold mb-1.5">{destT.specialRequests}</label>
            <textarea rows={3} placeholder={destT.specialRequestsPlaceholder}
              value={customerNotes} onChange={(e) => onCustomerNotesChange(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-body-md text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/40 focus:border-[var(--accent-gold)] transition-all resize-none" />
          </div>
        )}
      </div>
    </div>
  )
}

function tryParseJson(val: any): any {
  if (Array.isArray(val)) return val
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return val }
}
