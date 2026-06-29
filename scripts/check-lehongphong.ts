import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: schools } = await supabase.from('schools').select('*').eq('name', 'THPT Chuyên Lê Hồng Phong')
  console.log('🏫 Schools:', schools)

  if (schools && schools.length > 0) {
    const { data: programs } = await supabase.from('programs').select('*').eq('school_id', schools[0].id)
    console.log('📚 Programs count:', programs?.length)

    if (programs && programs.length > 0) {
      const progIds = programs.map(p => p.id)
      const { data: cutoffs } = await supabase.from('cutoffs').select('*, programs(name)').in('program_id', progIds)
      
      const grouped = new Map<string, { year: number; score: number }[]>()
      cutoffs?.forEach(c => {
        const name = c.programs?.name ?? 'Unknown'
        if (!grouped.has(name)) grouped.set(name, [])
        grouped.get(name)!.push({ year: c.year, score: c.cutoff_score })
      })

      grouped.forEach((list, name) => {
        list.sort((a, b) => a.year - b.year)
        console.log(`🔹 Program: ${name}`)
        list.forEach(item => {
          console.log(`   - Year ${item.year}: ${item.score}`)
        })
      })
    }
  }
}

check().catch(console.error)
