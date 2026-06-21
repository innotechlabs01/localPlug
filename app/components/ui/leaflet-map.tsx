'use client'

import { useEffect, useRef, useState } from 'react'

interface LeafletMapProps {
  address: string
  className?: string
}

export default function LeafletMap({ address, className }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)

  // Medellín default center
  const defaultCenter: [number, number] = [6.2442, -75.5812]

  useEffect(() => {
    if (!address || address.trim().length < 3) {
      setPosition(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    // Geocode address using Nominatim
    const encoded = encodeURIComponent(address.trim())
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=co`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data && data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        } else {
          setPosition(null)
          setError('Address not found on map')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not search address')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [address])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return
    const L = require('leaflet')

    // Only create map once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)

      L.marker(defaultCenter).addTo(mapInstanceRef.current).bindPopup('Medellín')
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update marker when position changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const L = require('leaflet')

    // Remove old marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }

    if (position) {
      markerRef.current = L.marker(position).addTo(mapInstanceRef.current)
        .bindPopup(address.slice(0, 50))
        .openPopup()
      mapInstanceRef.current.flyTo(position, 15, { duration: 1 })
    } else if (error) {
      // If address not found, keep default view
      mapInstanceRef.current.setView(defaultCenter, 13)
    }
  }, [position, address, error])

  return (
    <div className={`relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] ${className || ''}`}>
      <div ref={mapRef} style={{ height: 200, width: '100%', zIndex: 1 }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)] z-10">
          <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
        </div>
      )}
      {error && !loading && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <p className="text-[11px] px-2 py-1 rounded bg-[var(--surface-glass)] backdrop-blur-sm text-[var(--text-muted)]">
            {error} — showing Medellín area
          </p>
        </div>
      )}
    </div>
  )
}

// Add Leaflet CSS once
let cssAdded = false
export function addLeafletCss() {
  if (typeof document !== 'undefined' && !cssAdded) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    cssAdded = true
  }
}
