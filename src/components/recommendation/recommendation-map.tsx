'use client'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MapPin, Globe, Moon, Map as MapIcon, LocateFixed, Loader2 } from 'lucide-react'

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
  onHomeChange?: (coords: { lat: number; lng: number }) => void
}

export function RecommendationMap({ home, schools, hoveredSchoolId, onHomeChange }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const polylinesRef = useRef<any[]>([])
  const homeMarkerRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const [gpsLoading, setGpsLoading] = useState(false)

  function handleGps() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        onHomeChange?.({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // VIP Map Tile Styles
  const [mapStyle, setMapStyle] = useState<'clean' | 'dark' | 'satellite'>('dark')
  const tileLayerRef = useRef<any>(null)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  // Resolve active school for HUD detail display
  const activeSchool = schools.find(s => s.id === (hoveredSchoolId || selectedSchoolId)) || schools[0]

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

      const mapInstance = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([centerLat, centerLng], 12)

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)

      mapRef.current = mapInstance
      setMap(mapInstance)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setMap(null)
      }
    }
  }, [leafletLoaded])

  // Handle VIP map tile layer changes
  useEffect(() => {
    if (!map) return

    import('leaflet').then((L) => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }

      let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
      let options: any = { maxZoom: 19 }

      if (mapStyle === 'clean') {
        url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      } else if (mapStyle === 'satellite') {
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        options = {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
        }
      }

      const layer = L.tileLayer(url, options).addTo(map)
      tileLayerRef.current = layer
    })
  }, [map, mapStyle])

  // Update map markers, routes, and fits bounds when schools or home changes
  useEffect(() => {
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
          <div class="flex items-center justify-center min-w-[28px] px-2 py-1 rounded-full bg-card border-2 shadow-md whitespace-nowrap" style="border-color: ${color}">
            <span class="text-[9px] font-extrabold leading-none" style="color: ${color}">${s.role}</span>
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-1 bg-card border-r border-b" style="border-color: ${color}"></div>
        </div>`

        const customIcon = L.divIcon({
          className: 'custom-school-icon',
          html: iconHtml,
          iconSize: [48, 36],
          iconAnchor: [24, 36],
        })

        const marker = L.marker([s.lat, s.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<div class="text-xs p-0.5">
            <div class="font-extrabold text-[12px] text-foreground leading-snug">${s.name}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5 font-semibold flex items-center gap-1">
              <span>Đại diện:</span>
              <span class="px-1.5 py-0.5 rounded-full font-bold text-[9px] text-white" style="background-color: ${color}">${s.role}</span>
            </div>
            ${s.distance_km != null ? `<div class="text-[10px] text-muted-foreground mt-1 font-mono">📍 Đường đi: ${s.distance_km} km</div>` : ''}
            ${getTravelTimeText(s.distance_km)}
          </div>`)
          .on('click', () => {
            setSelectedSchoolId(s.id)
          })

        markersRef.current.set(s.id, marker)
        bounds.push([s.lat, s.lng])

        // 4. Draw route lines connecting Home to Schools
        if (home?.lat && home?.lng) {
          const routeUrl = `https://router.project-osrm.org/route/v1/driving/${home.lng},${home.lat};${s.lng},${s.lat}?overview=full&geometries=geojson`
          
          fetch(routeUrl)
            .then((res) => res.json())
            .then((data) => {
              if (data.routes && data.routes.length > 0) {
                const route = data.routes[0]
                const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
                
                // Connect the route line directly to the home and school markers to close the road snapping gap
                coords.unshift([home.lat, home.lng])
                coords.push([s.lat, s.lng])
                
                // Draw precise road route with VIP flow class
                const polyline = L.polyline(coords, {
                  color: color,
                  weight: 3.5,
                  opacity: 0.85,
                  className: 'animated-route-line',
                }).addTo(map)

                polylinesRef.current.push(polyline)

                // Update popup to show precise route distance & duration
                const realDist = Math.round((route.distance / 1000) * 10) / 10
                const motoTime = Math.round(route.duration / 60)
                const busTime = Math.round(realDist * 4) + 10

                marker.setPopupContent(`<div class="text-xs p-0.5">
                  <div class="font-extrabold text-[12px] text-foreground leading-snug">${s.name}</div>
                  <div class="text-[10px] text-muted-foreground mt-0.5 font-semibold flex items-center gap-1">
                    <span>Đại diện:</span>
                    <span class="px-1.5 py-0.5 rounded-full font-bold text-[9px] text-white" style="background-color: ${color}">${s.role}</span>
                  </div>
                  <div class="text-[10px] text-muted-foreground mt-1 font-mono">📍 Đường đi: ${realDist} km</div>
                  <div class="mt-1.5 pt-1 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground font-medium">
                    <div class="flex items-center gap-1">🛵 Xe máy: ~${motoTime} phút</div>
                    <div class="flex items-center gap-1">🚌 Xe buýt: ~${busTime} phút</div>
                  </div>
                </div>`)
              } else {
                // Fallback straight dashed line
                const polyline = L.polyline([[home.lat, home.lng], [s.lat, s.lng]], {
                  color: color,
                  weight: 2.5,
                  opacity: 0.65,
                  dashArray: '5, 8',
                }).addTo(map)
                polylinesRef.current.push(polyline)
              }
            })
            .catch(() => {
              // Fallback straight dashed line
              const polyline = L.polyline([[home.lat, home.lng], [s.lat, s.lng]], {
                color: color,
                weight: 2.5,
                opacity: 0.65,
                dashArray: '5, 8',
              }).addTo(map)
              polylinesRef.current.push(polyline)
            })
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
  }, [map, schools, home, leafletLoaded])

  // Update hovered pulsing state
  useEffect(() => {
    if (!map || !leafletLoaded) return

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
          map.panTo(marker.getLatLng(), {
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
  }, [map, hoveredSchoolId, schools, leafletLoaded])

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border shadow-inner relative bg-muted/20">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Top Left Overlay: digital map label */}
      <div className="absolute top-3 left-3 z-[1000] bg-background/85 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-sm pointer-events-none max-w-[200px]">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 leading-none">Bản đồ số tuyển sinh</p>
        <p className="text-[11px] font-semibold text-foreground leading-normal">
          {schools.length > 0 ? `Đang chỉ đường ${schools.length} NV` : 'Chờ định vị nhà để vẽ tuyến đường'}
        </p>
      </div>

      {/* Top Right Overlay: VIP style switcher + GPS button */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1.5">
        {onHomeChange && (
          <button
            type="button"
            onClick={handleGps}
            disabled={gpsLoading}
            className={cn(
              "p-1.5 rounded-xl border shadow-sm bg-background/80 backdrop-blur-md transition-all flex items-center justify-center",
              gpsLoading ? "text-muted-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"
            )}
            title="Lấy vị trí hiện tại"
          >
            {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          </button>
        )}
        <div className="flex gap-1 bg-background/80 backdrop-blur-md p-1 rounded-xl border shadow-sm">
          {(['clean', 'dark', 'satellite'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setMapStyle(style)}
              className={cn(
                "p-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider",
                mapStyle === style
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title={style === 'clean' ? 'Bản đồ sáng' : style === 'dark' ? 'Bản đồ tối' : 'Ảnh vệ tinh'}
            >
              {style === 'clean' && <MapIcon className="h-3.5 w-3.5" />}
              {style === 'dark' && <Moon className="h-3.5 w-3.5" />}
              {style === 'satellite' && <Globe className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Left Overlay: Glassmorphic School Detail HUD */}
      {activeSchool && (
        <div className="absolute bottom-3 left-3 right-3 lg:right-auto z-[1000] lg:max-w-xs bg-background/85 backdrop-blur-md p-3.5 rounded-xl border shadow-md space-y-2.5 transition-all duration-300">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full inline-block mb-1" style={{ backgroundColor: activeSchool.color }}>
                {activeSchool.role}
              </span>
              <h3 className="text-xs font-bold text-foreground leading-tight">{activeSchool.name}</h3>
            </div>
            {activeSchool.distance_km != null && (
              <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0 flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {activeSchool.distance_km} km
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/40 pt-2 font-medium">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>🛵</span>
              <span>Xe máy: ~{activeSchool.distance_km != null ? Math.round(activeSchool.distance_km * 2.4) : '—'} phút</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>🚌</span>
              <span>Xe buýt: ~{activeSchool.distance_km != null ? Math.round(activeSchool.distance_km * 4) + 10 : '—'} phút</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
