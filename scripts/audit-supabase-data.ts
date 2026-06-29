import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function auditData() {
  console.log('🔍 Starting database audit...\n')

  // 1. Fetch schools, programs, cutoffs
  const { data: schools } = await supabase.from('schools').select('*')
  const { data: programs } = await supabase.from('programs').select('*')
  const { data: cutoffs } = await supabase.from('cutoffs').select('*')

  if (!schools || !programs || !cutoffs) {
    console.error('❌ Failed to fetch data from Supabase')
    return
  }

  console.log(`📊 Loaded ${schools.length} schools, ${programs.length} programs, ${cutoffs.length} cutoffs.\n`)

  const schoolMap = new Map(schools.map(s => [s.id, s]))
  const programMap = new Map(programs.map(p => [p.id, p]))

  // 2. Check for duplicate programs (same name under same school)
  const programNamesBySchool = new Map<string, string[]>()
  programs.forEach(p => {
    const key = p.school_id
    if (!programNamesBySchool.has(key)) {
      programNamesBySchool.set(key, [])
    }
    programNamesBySchool.get(key)!.push(p.name)
  })

  let programDuplicates = 0
  programNamesBySchool.forEach((names, schoolId) => {
    const school = schoolMap.get(schoolId)
    const schoolName = school ? school.name : 'Unknown'
    const seen = new Set<string>()
    names.forEach(name => {
      if (seen.has(name)) {
        console.log(`⚠️  Duplicate program name found: "${name}" under school "${schoolName}"`)
        programDuplicates++
      }
      seen.add(name)
    })
  })

  // 3. Check for duplicate cutoffs (same program + same year)
  const cutoffKeys = new Set<string>()
  let cutoffDuplicates = 0
  cutoffs.forEach(c => {
    const key = `${c.program_id}::${c.year}`
    if (cutoffKeys.has(key)) {
      const p = programMap.get(c.program_id)
      const progName = p ? p.name : 'Unknown'
      const school = p ? schoolMap.get(p.school_id) : null
      const schoolName = school ? school.name : 'Unknown'
      console.log(`⚠️  Duplicate cutoff entry: ${schoolName} - ${progName} for year ${c.year}`)
      cutoffDuplicates++
    }
    cutoffKeys.add(key)
  })

  // 4. Audit specialized programs (Chuyên / Tích hợp) for incorrect years
  console.log('\n🏫 Auditing Specialized/Integrated Programs:')
  let specializedAnomalies = 0

  cutoffs.forEach(c => {
    const p = programMap.get(c.program_id)
    if (!p) return
    const school = schoolMap.get(p.school_id)
    if (!school) return

    const schoolName = school.name
    const progName = p.name
    const year = c.year
    const score = c.cutoff_score

    // Tran Dai Nghia - Chuyên Địa starts in 2024
    if (schoolName === 'THPT Chuyên Trần Đại Nghĩa' && progName === 'Chuyên Địa' && year < 2024) {
      console.log(`❌ Anomaly: ${schoolName} / ${progName} has cutoff in ${year} (score: ${score}). This program only started in 2024!`)
      specializedAnomalies++
    }

    // THPT Chuyên Hùng Vương and THPT Chuyên Lê Quý Đôn only started in 2026
    if ((schoolName === 'THPT Chuyên Hùng Vương' || schoolName === 'THPT Chuyên Lê Quý Đôn') && year < 2026) {
      console.log(`❌ Anomaly: ${schoolName} / ${progName} has cutoff in ${year} (score: ${score}). This school only started specialized programs in 2026!`)
      specializedAnomalies++
    }

    // Check for suspicious scores
    if (p.type === 'regular' && score > 30) {
      console.log(`❌ Suspiciously high score: ${schoolName} / ${progName} in ${year} has score ${score} (Regular program max is 30)`)
      specializedAnomalies++
    }
    if (p.type === 'specialized' && score > 50 && year >= 2021) {
      console.log(`❌ Invalid score: ${schoolName} / ${progName} in ${year} has score ${score} (Specialized program max is 50)`)
      specializedAnomalies++
    }
  })

  console.log(`\n📋 Audit Summary:`)
  console.log(`   - Duplicate programs: ${programDuplicates}`)
  console.log(`   - Duplicate cutoffs: ${cutoffDuplicates}`)
  console.log(`   - Specialized/Score anomalies: ${specializedAnomalies}`)
  console.log('\n✅ Audit complete!')
}

auditData().catch(console.error)
