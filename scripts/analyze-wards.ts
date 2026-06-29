import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function extractWard(address: string): string | null {
  // Regex to match "Phường X", "phường X", "P. X", "P.X", "Xã X", "xã X", "Thị trấn X", "thị trấn X"
  const match = address.match(/(?:Phường|phường|P\.|P\s|Xã|xã|Thị trấn|thị trấn)\s+([^,]+)/)
  if (match) {
    return match[1].trim()
  }
  return null
}

async function test() {
  const { data: schools } = await supabase.from('schools').select('id, name, address, district')
  if (!schools) return

  console.log(`Analyzing ${schools.length} schools:`)
  const wards = new Set<string>()
  schools.forEach(s => {
    const ward = extractWard(s.address)
    if (ward) {
      wards.add(ward)
    } else {
      // Fallback: check if the district field itself is a ward name
      // (some schools might have ward names stored in district, like "Bến Thành" or "Vườn Lài")
      if (s.district && !s.district.toLowerCase().includes('quận') && !s.district.toLowerCase().includes('huyện')) {
        wards.add(s.district)
      }
    }
  })

  console.log(`\nFound ${wards.size} unique wards. E.g.:`)
  console.log(Array.from(wards).slice(0, 30))
}

test().catch(console.error)
