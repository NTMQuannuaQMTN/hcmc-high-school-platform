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
      next: { revalidate: 0 },
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

  if (!address) {
    return NextResponse.json({ error: 'Address query is required' }, { status: 400 })
  }

  // Build query with city context to improve search accuracy
  const query = address.toLowerCase().includes('hồ chí minh') || address.toLowerCase().includes('hcm')
    ? address
    : `${address}, Thành phố Hồ Chí Minh, Việt Nam`

  try {
    let results = await fetchNominatim(query)

    // Fallback 1: If query has slashes like "529/12A Điện Biên Phủ" and returns no results,
    // try to simplify the alley number to the main street number: "529 Điện Biên Phủ"
    if (results.length === 0 && address.includes('/')) {
      const simplified = address.replace(/^(\d+)\/[^\s]+/, '$1')
      if (simplified !== address) {
        const fallbackQuery = simplified.toLowerCase().includes('hồ chí minh') || simplified.toLowerCase().includes('hcm')
          ? simplified
          : `${simplified}, Thành phố Hồ Chí Minh, Việt Nam`
        results = await fetchNominatim(fallbackQuery)
      }
    }

    // Fallback 2: If still no results, strip the address number entirely
    // e.g. "529 Điện Biên Phủ" -> "Điện Biên Phủ"
    if (results.length === 0) {
      const strippedNumber = address.replace(/^\d+[\/\w]*\s+/, '')
      if (strippedNumber !== address && strippedNumber.trim().length > 3) {
        const fallbackQuery = strippedNumber.toLowerCase().includes('hồ chí minh') || strippedNumber.toLowerCase().includes('hcm')
          ? strippedNumber
          : `${strippedNumber}, Thành phố Hồ Chí Minh, Việt Nam`
        results = await fetchNominatim(fallbackQuery)
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



