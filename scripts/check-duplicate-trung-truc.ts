import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, district, address')
    .ilike('name', '%Nguyễn Trung Trực%')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`🏫 Found ${schools.length} schools matching "Nguyễn Trung Trực":`)
  schools.forEach(s => {
    console.log(`   - ID: ${s.id} | Name: "${s.name}" | District: "${s.district}" | Address: "${s.address}"`)
  })
}

check().catch(console.error)
