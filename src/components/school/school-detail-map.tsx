'use client'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MapPin, Globe, Moon, Map as MapIcon, ExternalLink } from 'lucide-react'

interface Props {
  name: string
  address: string
  district: string
  latitude: number
  longitude: number
}

export function SchoolDetailMap({ name, address, district, latitude, longitude }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const markerRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Map settings
  const [mapStyle, setMapStyle] = useState<'satellite' | 'clean' | 'dark'>('satellite')
  const tileLayerRef = useRef<any>(null)

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return

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

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return

    import('leaflet').then((L) => {
      const mapInstance = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 18) // high zoom for close look

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
  }, [leafletLoaded, latitude, longitude])

  // Handle Layer switching
  useEffect(() => {
    if (!map) return

    import('leaflet').then((L) => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }

      let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      let options: any = {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
      }

      if (mapStyle === 'clean') {
        url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        options = { maxZoom: 19 }
      } else if (mapStyle === 'dark') {
        url = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
        options = { maxZoom: 19 }
      }

      const layer = L.tileLayer(url, options).addTo(map)
      tileLayerRef.current = layer
    })
  }, [map, mapStyle])

  // Add marker with glowing wave pulse
  useEffect(() => {
    if (!map) return

    import('leaflet').then((L) => {
      if (markerRef.current) {
        markerRef.current.remove()
      }

      const iconHtml = `<div class="leaflet-school-marker-container leaflet-pulsing-marker flex flex-col items-center select-none" style="color: #6366f1;">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-card border-2 shadow-lg relative" style="border-color: #6366f1;">
          <span class="text-xs">🏫</span>
        </div>
        <div class="w-1.5 h-1.5 rotate-45 -mt-1 bg-card border-r border-b" style="border-color: #6366f1;"></div>
      </div>`

      const customIcon = L.divIcon({
        className: 'custom-school-detail-icon',
        html: iconHtml,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
      })

      const marker = L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<div class="text-xs p-0.5">
          <div class="font-extrabold text-[12px] text-foreground leading-snug">${name}</div>
          <div class="text-[10px] text-muted-foreground mt-0.5">${address}</div>
        </div>`)

      markerRef.current = marker
    })
  }, [map, latitude, longitude, name, address])

  // Google Maps 3D Satellite link
  const googleMaps3dUrl = `https://www.google.com/maps/@${latitude},${longitude},19z/data=!3m1!1e3`
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border shadow-inner relative bg-muted/20">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Top Left Overlay: digital map label */}
      <div className="absolute top-3 left-3 z-[1000] bg-background/85 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-sm pointer-events-none">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 leading-none">Không ảnh vệ tinh</p>
        <p className="text-[11px] font-semibold text-foreground leading-normal">{name}</p>
      </div>

      {/* Top Right Overlay: style switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-background/80 backdrop-blur-md p-1 rounded-xl border shadow-sm items-center">
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
            title={style === 'clean' ? 'Bản đồ sáng' : style === 'dark' ? 'Bản đồ tối' : 'Không ảnh vệ tinh'}
          >
            {style === 'clean' && <MapIcon className="h-3.5 w-3.5" />}
            {style === 'dark' && <Moon className="h-3.5 w-3.5" />}
            {style === 'satellite' && <Globe className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>

      {/* Bottom HUD overlays: coordinates and 3D direct buttons */}
      <div className="absolute bottom-3 left-3 right-3 lg:right-auto z-[1000] lg:max-w-xs bg-background/85 backdrop-blur-md p-3.5 rounded-xl border shadow-md space-y-2.5">
        <div>
          <h4 className="text-xs font-bold text-foreground leading-tight mb-0.5">{name}</h4>
          <p className="text-[10px] text-muted-foreground leading-snug">{address}, {district}</p>
        </div>
        
        <div className="flex gap-2">
          <a
            href={googleMaps3dUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-primary text-primary-foreground text-[10px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-all shadow-sm"
          >
            <Globe className="h-3 w-3" />
            Xem vệ tinh 3D
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <a
            href={googleDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-[10px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <MapIcon className="h-3 w-3" />
            Chỉ đường
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
