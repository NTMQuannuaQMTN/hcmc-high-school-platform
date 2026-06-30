import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function listSchools() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, district, address')
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ Error reading schools:', error.message)
    return
  }

  console.log(`🏫 Total schools in database: ${schools.length}`)
  schools.forEach((s, index) => {
    console.log(`${index + 1}. ${s.name} | ${s.district} | ${s.address}`)
  })
}

listSchools().catch(console.error)
