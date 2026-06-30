import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const schoolNames = [
    'Trường Tiểu học, THCS và THPT Lê Thị Riêng',
    'THPT Lê Thị Riêng',
    'Trường THPT Phan Văn Hớn',
    'THPT Phan Văn Hớn',
    'Trường THPT Thoại Ngọc Hầu',
    'THPT Thoại Ngọc Hầu',
    'Trường THPT Hà Huy Tập',
    'THPT Hà Huy Tập',
    'Trường THPT Võ Nguyên Giáp',
    'THPT Võ Nguyên Giáp'
  ]

  console.log('🔍 Checking for new schools in Supabase database...\n')

  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, district, address')
    .in('name', schoolNames)

  if (error) {
    console.error('❌ Error reading schools:', error.message)
    return
  }

  console.log(`🏫 Found ${schools?.length ?? 0} matching schools:`)
  schools?.forEach(s => {
    console.log(`   - ${s.name} | District: ${s.district} | Address: ${s.address}`)
  })
}

check().catch(console.error)
