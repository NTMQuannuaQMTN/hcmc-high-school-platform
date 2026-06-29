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

  // Find the school: THPT Chuyên Trần Đại Nghĩa
  const { data: schools, error: schoolErr } = await supabase
    .from('schools')
    .select('id, name')
    .eq('name', 'THPT Chuyên Trần Đại Nghĩa')

  if (schoolErr || !schools || schools.length === 0) {
    console.error('❌ School "THPT Chuyên Trần Đại Nghĩa" not found in database')
    return
  }

  const schoolId = schools[0].id
  console.log(`🏫 Found school "THPT Chuyên Trần Đại Nghĩa" with ID: ${schoolId}`)

  // Find the specialized programs: Chuyên Sử and Chuyên Địa under this school
  const { data: programs, error: progErr } = await supabase
    .from('programs')
    .select('id, name')
    .eq('school_id', schoolId)
    .in('name', ['Chuyên Sử', 'Chuyên Địa'])

  if (progErr || !programs || programs.length === 0) {
    console.error('❌ Specialized programs "Chuyên Sử" or "Chuyên Địa" not found under school')
    return
  }

  console.log(`📚 Found programs:`, programs.map(p => `${p.name} (ID: ${p.id})`).join(', '))

  const programIds = programs.map(p => p.id)

  // Find incorrect cutoffs (year < 2024)
  const { data: incorrectCutoffs, error: findErr } = await supabase
    .from('cutoffs')
    .select('id, program_id, year, cutoff_score')
    .in('program_id', programIds)
    .lt('year', 2024)

  if (findErr) {
    console.error('❌ Error searching for incorrect cutoffs:', findErr.message)
    return
  }

  if (!incorrectCutoffs || incorrectCutoffs.length === 0) {
    console.log('✨ No incorrect cutoff records found for years before 2024.')
    return
  }

  console.log(`⚠️  Found ${incorrectCutoffs.length} incorrect cutoff records to delete:`)
  incorrectCutoffs.forEach(c => {
    const prog = programs.find(p => p.id === c.program_id)
    console.log(`   - ${prog?.name} | Year ${c.year} | Score: ${c.cutoff_score} (ID: ${c.id})`)
  })

  // Delete them!
  const incorrectIds = incorrectCutoffs.map(c => c.id)
  const { error: deleteErr } = await supabase
    .from('cutoffs')
    .delete()
    .in('id', incorrectIds)

  if (deleteErr) {
    console.error('❌ Failed to delete incorrect cutoffs:', deleteErr.message)
  } else {
    console.log('\n✅ Successfully deleted all incorrect cutoff records!')
  }
}

cleanupData().catch(console.error)
