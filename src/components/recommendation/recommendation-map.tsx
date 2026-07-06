'use client'
import { useEffect, useRef, useState } from 'react'

interface MapSchool {
  id: string
  name: string
  lat: number
  lng: number
  role: string
  color: string
  distance_km: number | null
}

interface Props {
  home?: { lat: number; lng: number } | null
  schools: MapSchool[]
  hoveredSchoolId: string | null
}

export function RecommendationMap({ home, schools, hoveredSchoolId }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const polylinesRef = useRef<any[]>([])
  const homeMarkerRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Load Leaflet and its CSS on client-side only
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Inject leaflet stylesheet dynamically to prevent SSR compile problems
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    setLeafletLoaded(true)

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [])

  // Travel time helper
  const getTravelTimeText = (distance: number | null) => {
    if (distance === null) return ''
    const motoMin = Math.round(distance * 2.4)
    const busMin = Math.round(distance * 4) + 10
    return `<div class="mt-1.5 pt-1 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground font-medium">
      <div class="flex items-center gap-1">🛵 Xe máy: ~${motoMin} phút</div>
      <div class="flex items-center gap-1">🚌 Xe buýt: ~${busMin} phút</div>
    </div>`
  }

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return

    import('leaflet').then((L) => {
      // Default to central HCMC coords
      const centerLat = home?.lat || 10.762622
      const centerLng = home?.lng || 106.660172

      const map = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([centerLat, centerLng], 12)

      // Use CartoDB Voyager tiles (looks extremely clean)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [leafletLoaded])

  // Update map markers, routes, and fits bounds when schools or home changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    import('leaflet').then((L) => {
      // 1. Clear existing markers and lines
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()

      polylinesRef.current.forEach((p) => p.remove())
      polylinesRef.current = []

      if (homeMarkerRef.current) {
        homeMarkerRef.current.remove()
        homeMarkerRef.current = null
      }

      const bounds: any[] = []

      // 2. Add Home Marker
      if (home?.lat && home?.lng) {
        const homeIcon = L.divIcon({
          className: 'custom-home-icon',
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary shadow-lg backdrop-blur-sm animate-pulse">
            <div class="w-3.5 h-3.5 rounded-full bg-primary shadow-inner"></div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const homeMarker = L.marker([home.lat, home.lng], { icon: homeIcon })
          .addTo(map)
          .bindPopup(`<div class="text-[11px] font-bold">📍 Vị trí nhà của bạn</div>`)
        
        homeMarkerRef.current = homeMarker
        bounds.push([home.lat, home.lng])
      }

      // 3. Add School Markers & Lines
      schools.forEach((s) => {
        const color = s.color || '#3b82f6'
        const iconHtml = `<div class="leaflet-school-marker-container flex flex-col items-center select-none" id="marker-school-${s.id}">
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-card border-2 shadow-md relative" style="border-color: ${color}">
            <span class="text-[9px] font-extrabold" style="color: ${color}">${s.role}</span>
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-1 bg-card border-r border-b" style="border-color: ${color}"></div>
        </div>`

        const customIcon = L.divIcon({
          className: 'custom-school-icon',
          html: iconHtml,
          iconSize: [32, 36],
          iconAnchor: [16, 36],
        })

        const marker = L.marker([s.lat, s.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<div class="text-xs p-0.5">
            <div class="font-extrabold text-[12px] text-foreground leading-snug">${s.name}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5 font-semibold flex items-center gap-1">
              <span>Đại diện:</span>
              <span class="px-1.5 py-0.5 rounded-full font-bold text-[9px] text-white" style="background-color: ${color}">${s.role}</span>
            </div>
            ${s.distance_km != null ? `<div class="text-[10px] text-muted-foreground mt-1 font-mono">📍 Cách nhà: ${s.distance_km} km</div>` : ''}
            ${getTravelTimeText(s.distance_km)}
          </div>`)

        markersRef.current.set(s.id, marker)
        bounds.push([s.lat, s.lng])

        // 4. Draw route lines connecting Home to Schools
        if (home?.lat && home?.lng) {
          const polyline = L.polyline([[home.lat, home.lng], [s.lat, s.lng]], {
            color: color,
            weight: 2,
            opacity: 0.65,
            dashArray: '5, 8',
          }).addTo(map)
          
          polylinesRef.current.push(polyline)
        }
      })

      // 5. Fit bounds to show all elements with a padding margin
      if (bounds.length > 0) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
          duration: 1.2,
        })
      }
    })
  }, [schools, home, leafletLoaded])

  // Update hovered pulsing state
  useEffect(() => {
    if (!leafletLoaded) return

    schools.forEach((s) => {
      const marker = markersRef.current.get(s.id)
      if (!marker) return

      const isHovered = hoveredSchoolId === s.id
      const element = document.getElementById(`marker-school-${s.id}`)
      
      if (element) {
        if (isHovered) {
          element.classList.add('leaflet-pulsing-marker')
          // Add custom text color matching role color for current pulse ring
          const color = s.color || '#3b82f6'
          element.style.color = color
          
          // Smoothly pan map to this marker
          mapRef.current?.panTo(marker.getLatLng(), {
            animate: true,
            duration: 0.5,
          })
          
          // Open popup
          marker.openPopup()
        } else {
          element.classList.remove('leaflet-pulsing-marker')
          element.style.color = ''
        }
      }
    })
  }, [hoveredSchoolId, schools, leafletLoaded])

  return (
    <div className="w-full h-full min-h-[300px] lg:min-h-0 rounded-2xl overflow-hidden border shadow-inner relative bg-muted/20">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Dynamic Overlay labels inside the map container */}
      <div className="absolute top-3 left-3 z-[1000] bg-background/85 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-sm pointer-events-none max-w-[200px]">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 leading-none">Bản đồ số tuyển sinh</p>
        <p className="text-[11px] font-semibold text-foreground leading-normal">
          {schools.length > 0 ? `Đang chỉ đường ${schools.length} NV` : 'Chờ định vị nhà để vẽ tuyến đường'}
        </p>
      </div>
    </div>
  )
}
