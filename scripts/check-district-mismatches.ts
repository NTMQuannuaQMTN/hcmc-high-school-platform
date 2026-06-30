import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { DISTRICT_MAP, getActualDistrict } from '../src/lib/utils'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to extract district from address
function getDistrictFromAddress(address: string): string | null {
  const normalized = address.toLowerCase()
  
  // Look for "Quận X", "Q. X", "Q.X", "Huyện Y", "Thành phố Thủ Đức", "TP. Thủ Đức"
  const qMatch = normalized.match(/(?:quận|q\.|huyện|tp\.|thành phố)\s+([0-9a-z\sđướăâôêíỳế]+)/)
  if (qMatch) {
    const dStr = qMatch[1].trim()
    if (dStr.includes('bình thạnh')) return 'Quận Bình Thạnh'
    if (dStr.includes('gò vấp')) return 'Quận Gò Vấp'
    if (dStr.includes('phú nhuận')) return 'Quận Phú Nhuận'
    if (dStr.includes('tân bình')) return 'Quận Tân Bình'
    if (dStr.includes('tân phú')) return 'Quận Tân Phú'
    if (dStr.includes('bình tân')) return 'Quận Bình Tân'
    if (dStr.includes('thủ đức')) return 'Thành phố Thủ Đức'
    if (dStr.includes('bình chánh')) return 'Huyện Bình Chánh'
    if (dStr.includes('củ chi')) return 'Huyện Củ Chi'
    if (dStr.includes('nhà bè')) return 'Huyện Nhà Bè'
    if (dStr.includes('cần giờ')) return 'Huyện Cần Giờ'
    if (dStr.includes('hóc môn')) return 'Huyện Hóc Môn'
    
    // Numbers
    const numMatch = dStr.match(/^\d+/)
    if (numMatch) {
      return `Quận ${numMatch[0]}`
    }
  }
  
  // Direct matching check
  if (normalized.includes('bình thạnh')) return 'Quận Bình Thạnh'
  if (normalized.includes('gò vấp')) return 'Quận Gò Vấp'
  if (normalized.includes('phú nhuận')) return 'Quận Phú Nhuận'
  if (normalized.includes('tân bình')) return 'Quận Tân Bình'
  if (normalized.includes('tân phú')) return 'Quận Tân Phú'
  if (normalized.includes('bình tân')) return 'Quận Bình Tân'
  if (normalized.includes('thủ đức')) return 'Thành phố Thủ Đức'
  if (normalized.includes('bình chánh')) return 'Huyện Bình Chánh'
  if (normalized.includes('củ chi')) return 'Huyện Củ Chi'
  if (normalized.includes('nhà bè')) return 'Huyện Nhà Bè'
  if (normalized.includes('cần giờ')) return 'Huyện Cần Giờ'
  if (normalized.includes('hóc môn')) return 'Huyện Hóc Môn'
  
  // Wards / districts with numbers at end of address
  for (let i = 1; i <= 12; i++) {
    if (normalized.includes(`quận ${i}`) || normalized.includes(`q.${i}`) || normalized.endsWith(`q ${i}`)) {
      return `Quận ${i}`
    }
  }

  return null
}

async function audit() {
  console.log('🔍 Listing all schools with their resolved districts...\n')

  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, district, address')

  if (error || !schools) {
    console.error('❌ Failed to read schools:', error?.message)
    return
  }

  schools.forEach((s, i) => {
    const resolvedDistrict = getActualDistrict(s.district)
    console.log(`${i + 1}. "${s.name}"`)
    console.log(`   - DB District key: "${s.district}"`)
    console.log(`   - Resolved:        ${resolvedDistrict}`)
    console.log(`   - Address:         "${s.address}"`)
    console.log('--------------------------------------------------')
  })
}

audit().catch(console.error)
