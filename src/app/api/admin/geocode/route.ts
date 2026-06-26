import { NextResponse } from 'next/server'

function isAuthorized(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const district = searchParams.get('district')

  if (!address) return NextResponse.json({ error: 'address is required' }, { status: 400 })

  const query = [address, district, 'Thành phố Hồ Chí Minh, Việt Nam']
    .filter(Boolean)
    .join(', ')

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'vn')
  url.searchParams.set('addressdetails', '0')

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'HCMCHighSchoolNavigator/1.0 (nguyentruongmanhquan@gmail.com)',
      'Accept-Language': 'vi,en',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 })

  const results = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
  if (!results.length) return NextResponse.json({ error: 'Không tìm thấy địa chỉ' }, { status: 404 })

  const { lat, lon, display_name } = results[0]
  return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon), display_name })
}
