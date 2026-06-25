'use client'
import { useEffect, useRef } from 'react'

interface MapMarker {
  lat: number
  lng: number
  title?: string
}

interface GoogleMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  className?: string
}

/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    initMap: () => void
  }
}

export function GoogleMap({ center, zoom = 14, markers = [], className }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return
    if (!window.google?.maps) return

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
    })

    markers.forEach((m) => {
      new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapInstance.current!,
        title: m.title,
      })
    })
  }, [center, zoom, markers])

  return <div ref={mapRef} className={className ?? 'w-full h-64 rounded-lg'} />
}

export function GoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null
  return (
    <script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
      async
      defer
    />
  )
}
