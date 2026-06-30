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
    .select('district')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  const districts = new Set(schools.map(s => s.district))
  console.log('📋 Distinct values in district column:')
  console.log(Array.from(districts).sort())
}

check().catch(console.error)
