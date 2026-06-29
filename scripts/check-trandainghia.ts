import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: schools } = await supabase.from('schools').select('*').eq('name', 'THCS-THPT Trần Đại Nghĩa')
  console.log('🏫 Schools:', schools)

  if (schools && schools.length > 0) {
    const { data: programs } = await supabase.from('programs').select('*').eq('school_id', schools[0].id)
    console.log('📚 Programs:', programs)

    if (programs && programs.length > 0) {
      const progIds = programs.map(p => p.id)
      const { data: cutoffs } = await supabase.from('cutoffs').select('*').in('program_id', progIds)
      console.log('📊 Cutoffs:', cutoffs)
    }
  }
}

check().catch(console.error)
