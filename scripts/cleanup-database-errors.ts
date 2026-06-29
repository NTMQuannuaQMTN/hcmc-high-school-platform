import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function cleanupData() {
  console.log('🧹 Cleaning up database anomalies...\n')

  const toDeleteIds: string[] = []

  // 1. Clean up "THPT Chuyên Trần Đại Nghĩa" Chuyên Sử & Chuyên Địa (year < 2024)
  const { data: schoolsTDN } = await supabase
    .from('schools')
    .select('id, name')
    .eq('name', 'THPT Chuyên Trần Đại Nghĩa')

  if (schoolsTDN && schoolsTDN.length > 0) {
    const schoolId = schoolsTDN[0].id
    const { data: progs } = await supabase
      .from('programs')
      .select('id, name')
      .eq('school_id', schoolId)
      .in('name', ['Chuyên Sử', 'Chuyên Địa'])

    if (progs && progs.length > 0) {
      const progIds = progs.map(p => p.id)
      const { data: cutoffs } = await supabase
        .from('cutoffs')
        .select('id, year, cutoff_score, programs(name, schools(name))')
        .in('program_id', progIds)
        .lt('year', 2024)

      if (cutoffs && cutoffs.length > 0) {
        console.log(`⚠️  Found ${cutoffs.length} incorrect specialized cutoffs for THPT Chuyên Trần Đại Nghĩa:`)
        cutoffs.forEach((c: any) => {
          console.log(`   - ${c.programs?.name} (${c.year}) = ${c.cutoff_score}`)
          toDeleteIds.push(c.id)
        })
      }
    }
  }

  // 2. Clean up "THCS-THPT Trần Đại Nghĩa" (year < 2024)
  const { data: schoolsRegularTDN } = await supabase
    .from('schools')
    .select('id, name')
    .eq('name', 'THCS-THPT Trần Đại Nghĩa')

  if (schoolsRegularTDN && schoolsRegularTDN.length > 0) {
    const schoolId = schoolsRegularTDN[0].id
    const { data: progs } = await supabase
      .from('programs')
      .select('id, name')
      .eq('school_id', schoolId)

    if (progs && progs.length > 0) {
      const progIds = progs.map(p => p.id)
      const { data: cutoffs } = await supabase
        .from('cutoffs')
        .select('id, year, cutoff_score, programs(name, schools(name))')
        .in('program_id', progIds)
        .lt('year', 2024)

      if (cutoffs && cutoffs.length > 0) {
        console.log(`⚠️  Found ${cutoffs.length} incorrect cutoffs for THCS-THPT Trần Đại Nghĩa (established 2024):`)
        cutoffs.forEach((c: any) => {
          console.log(`   - ${c.programs?.name} (${c.year}) = ${c.cutoff_score}`)
          toDeleteIds.push(c.id)
        })
      }
    }
  }

  // Execute deletion if any found
  if (toDeleteIds.length === 0) {
    console.log('✨ No anomalies found to delete.')
    return
  }

  console.log(`\n🔥 Deleting ${toDeleteIds.length} cutoff records...`)
  const { error } = await supabase
    .from('cutoffs')
    .delete()
    .in('id', toDeleteIds)

  if (error) {
    console.error('❌ Deletion failed:', error.message)
  } else {
    console.log('✅ Successfully deleted all targeted incorrect cutoff records!')
  }
}

cleanupData().catch(console.error)
