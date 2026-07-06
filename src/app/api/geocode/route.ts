import { NextResponse } from 'next/server'

async function fetchNominatim(q: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '6')
  url.searchParams.set('countrycodes', 'vn')
  url.searchParams.set('addressdetails', '0')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'HCMCHighSchoolNavigatorPublic/1.0 (nguyentruongmanhquan@gmail.com)',
        'Accept-Language': 'vi,en',
      },
      next: { revalidate: 3600 }, // Cache queries for 1 hour to prevent rate limits
    })
    if (!res.ok) return []
    return await res.json() as Array<{ lat: string; lon: string; display_name: string }>
  } catch {
    return []
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const ipGeo = searchParams.get('ip')

  // 1. IP Geolocation request
  if (ipGeo === 'true') {
    const lat = req.headers.get('x-vercel-ip-latitude')
    const lng = req.headers.get('x-vercel-ip-longitude')
    const city = req.headers.get('x-vercel-ip-city')
    
    if (lat && lng) {
      return NextResponse.json([{
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        display_name: city ? `Vị trí ước tính: ${decodeURIComponent(city)}` : 'Vị trí hiện tại (ước tính từ IP)'
      }])
    }

    // Local/Server-side fallback when Vercel headers are missing
    try {
      const geoRes = await fetch('https://ipapi.co/json/')
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData.latitude && geoData.longitude) {
          return NextResponse.json([{
            lat: geoData.latitude,
            lng: geoData.longitude,
            display_name: `Vị trí ước tính: ${geoData.city || 'Việt Nam'}`
          }])
        }
      }
    } catch {
      // Ignore and proceed
    }

    return NextResponse.json({ error: 'Could not determine IP location' }, { status: 404 })
  }

  if (!address) {
    return NextResponse.json({ error: 'Address query is required' }, { status: 400 })
  }

  const cleanAddress = address.trim()

  // Build a list of fallback queries to try sequentially
  const queriesToTry: string[] = []

  // Attempt 1: Full query with HCM/Vietnam context
  const hasHCMC = cleanAddress.toLowerCase().includes('hồ chí minh') || cleanAddress.toLowerCase().includes('hcm')
  queriesToTry.push(hasHCMC ? cleanAddress : `${cleanAddress}, Thành phố Hồ Chí Minh, Việt Nam`)

  // Attempt 2: Simplified house number (e.g. 529/12A/3 -> 529)
  if (cleanAddress.includes('/')) {
    const simplified = cleanAddress.replace(/(\d+)\/[\w\d\/]+/g, '$1')
    if (simplified !== cleanAddress) {
      queriesToTry.push(hasHCMC ? simplified : `${simplified}, Thành phố Hồ Chí Minh, Việt Nam`)
    }
  }

  // Attempt 3: Strip house number entirely (e.g. 529/12A Điện Biên Phủ -> Điện Biên Phủ)
  const streetOnly = cleanAddress.replace(/^(?:số|hẻm|ngõ|ngách|kiệt)?\s*\d+[\/\w\d\-]*\s+/i, '')
  if (streetOnly !== cleanAddress && streetOnly.trim().length > 3) {
    queriesToTry.push(hasHCMC ? streetOnly : `${streetOnly}, Thành phố Hồ Chí Minh, Việt Nam`)
  }

  // Attempt 4: If address has ward/district info (e.g. "Phường Võ Thị Sáu, Quận 3"), try just that
  const wardDistrictMatch = cleanAddress.match(/(?:phường|quận|huyện|thành phố|thị xã|xã|p\.|q\.|h\.)\s+[^,]+/i)
  if (wardDistrictMatch) {
    const fallbackArea = cleanAddress.substring(cleanAddress.indexOf(wardDistrictMatch[0]))
    if (fallbackArea !== cleanAddress && fallbackArea.trim().length > 3) {
      queriesToTry.push(hasHCMC ? fallbackArea : `${fallbackArea}, Thành phố Hồ Chí Minh, Việt Nam`)
    }
  }

  try {
    let results: any[] = []

    // Execute queries in sequence until we get results
    for (const q of queriesToTry) {
      results = await fetchNominatim(q)
      if (results.length > 0) {
        break
      }
    }

    // Map and return the list of matching places
    const suggestions = results.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      display_name: shortenAddress(r.display_name),
    }))

    return NextResponse.json(suggestions)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Geocoding error' }, { status: 500 })
  }
}

function shortenAddress(addr: string): string {
  if (!addr) return ''
  return addr
    // Remove "Việt Nam" at the end, along with any postal codes
    .replace(/,\s*(?:\d{5,6},\s*)?Việt Nam$/i, '')
    // Remove HCMC city suffixes at the end
    .replace(/,\s*(?:Thành\s*phố\s+Hồ\s+Chí\s+Minh|Thành\s*phố\s+HCM|TP\.\s*Hồ\s+Chí\s+Minh|TP\s+Hồ\s+Chí\s+Minh|TP\.HCM|TPHCM)$/i, '')
    // Remove "Thành phố Thủ Đức" suffixes since it belongs to HCMC
    .replace(/,\s*(?:Thành\s*phố\s+Thủ\s+Đức|TP\.\s*Thủ\s+Đức|TP\s+Thủ\s+Đức|Thủ\s+Đức)$/i, '')
    .trim()
}
