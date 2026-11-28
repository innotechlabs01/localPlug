'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export interface RideMapPoint {
  lat: number
  lng: number
  label: string
}

interface RideMapProps {
  pickup: RideMapPoint | null
  destination: RideMapPoint | null
  driver?: RideMapPoint | null
  routeCoordinates?: Array<[number, number]>
  className?: string
}

const DEFAULT_CENTER: [number, number] = [6.2088, -75.567]

function isValidPoint(point: RideMapPoint | null | undefined): point is RideMapPoint {
  return Boolean(point && Number.isFinite(point.lat) && Number.isFinite(point.lng))
}

/**
 * Full-bleed Leaflet map for the on-demand ride flow. Unlike the embedded OSM
 * iframe this renders independent pickup, destination and driver markers plus
 * the road route returned by the estimate endpoint.
 */
export default function RideMap({
  pickup,
  destination,
  driver,
  routeCoordinates = [],
  className = '',
}: RideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const fitRef = useRef<(() => void) | null>(null)

  // The panel is on the left on desktop and below the map on mobile. Fit the
  // pins into the uncovered region instead of behind the UI.
  const getPadding = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      const panel = document.querySelector<HTMLElement>('[data-ride-panel]')
      // Use the panel's right edge so any margin is respected as well.
      const left = panel?.getBoundingClientRect().right ?? 420
      return {
        paddingTopLeft: [left + 16, 80] as [number, number],
        paddingBottomRight: [0, 24] as [number, number],
      }
    }
    const sheet = document.querySelector<HTMLElement>('[data-ride-sheet]')
    const sheetHeight = sheet?.getBoundingClientRect().height ?? window.innerHeight * 0.55
    const bottomInset = Math.min(sheetHeight + 16, Math.max(0, window.innerHeight - 160))
    return {
      paddingTopLeft: [0, 80] as [number, number],
      paddingBottomRight: [0, bottomInset] as [number, number],
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const L = require('leaflet')

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = layerRef.current
    if (!map || !group) return
    const L = require('leaflet')

    group.clearLayers()

    const markerColors = {
      pickup: '#34d399',
      destination: '#f59e0b',
      driver: '#60a5fa',
    }
    const markerLetters = { pickup: 'A', destination: 'B', driver: 'D' }

    const points: Array<{ point: RideMapPoint; kind: keyof typeof markerColors }> = []
    if (isValidPoint(pickup)) points.push({ point: pickup, kind: 'pickup' })
    if (isValidPoint(destination)) points.push({ point: destination, kind: 'destination' })
    if (isValidPoint(driver)) points.push({ point: driver, kind: 'driver' })

    if (routeCoordinates.length >= 2) {
      const validRoute = routeCoordinates
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
        .map(([lat, lng]) => [lat, lng] as [number, number])
      if (validRoute.length >= 2) {
        L.polyline(validRoute, {
          color: markerColors.pickup,
          weight: 4,
          opacity: 0.85,
        }).addTo(group)
      }
    }

    const bounds: Array<[number, number]> = []
    for (const { point, kind } of points) {
      const icon = L.divIcon({
        className: 'ride-map-pin',
        html: `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${markerColors[kind]};color:#0b0d14;border:3px solid #fff;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.45)">${markerLetters[kind]}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })
      const marker = L.marker([point.lat, point.lng], { icon }).addTo(group)
      const tooltip = document.createElement('span')
      tooltip.textContent = point.label
      marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -18] })
      bounds.push([point.lat, point.lng])
    }

    const fit = () => {
      const padding = getPadding()
      if (bounds.length > 0) {
        map.fitBounds(bounds, { ...padding, maxZoom: 15 })
      } else {
        map.fitBounds([DEFAULT_CENTER, DEFAULT_CENTER], { ...padding, maxZoom: 13 })
      }
    }
    fitRef.current = fit
    fit()

    // Leaflet needs a size recalculation after the bottom sheet is laid out.
    const timer = window.setTimeout(() => {
      map.invalidateSize()
      fit()
    }, 50)
    return () => window.clearTimeout(timer)
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, driver?.lat, driver?.lng, routeCoordinates])

  useEffect(() => {
    const targets = [
      document.querySelector('[data-ride-sheet]'),
      document.querySelector('[data-ride-panel]'),
    ].filter((element): element is Element => Boolean(element))

    const refit = () => {
      const map = mapRef.current
      if (!map) return
      map.invalidateSize()
      fitRef.current?.()
    }

    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(refit)
    targets.forEach((target) => observer?.observe(target))

    const media = window.matchMedia('(min-width: 1024px)')
    media.addEventListener('change', refit)
    window.addEventListener('resize', refit)
    return () => {
      observer?.disconnect()
      media.removeEventListener('change', refit)
      window.removeEventListener('resize', refit)
    }
  }, [])

  return <div ref={containerRef} className={`h-full w-full ${className}`} aria-label="Mapa del viaje" />
}
