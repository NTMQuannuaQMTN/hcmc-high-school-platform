import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function auditData() {
  console.log('🔍 Starting comprehensive database audit...\n')

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

  let anomalies = 0

  // 2. Audit schools that did not exist in certain years
  console.log('🏫 Checking school establishment / name years:')
  
  // THCS-THPT Trần Đại Nghĩa was established in 2024 (split from Chuyên Trần Đại Nghĩa)
  // So it cannot have cutoffs in 2022 or 2023.
  // Any cutoffs for THCS-THPT Trần Đại Nghĩa before 2024 are anomalies.
  cutoffs.forEach(c => {
    const p = programMap.get(c.program_id)
    if (!p) return
    const school = schoolMap.get(p.school_id)
    if (!school) return

    const schoolName = school.name
    const progName = p.name
    const year = c.year
    const score = c.cutoff_score

    if (schoolName === 'THCS-THPT Trần Đại Nghĩa' && year < 2024) {
      console.log(`❌ Anomaly: "${schoolName}" has cutoff in ${year} (program: "${progName}", score: ${score}). School was only established in 2024!`)
      anomalies++
    }

    if ((schoolName === 'THPT Chuyên Hùng Vương' || schoolName === 'THPT Chuyên Lê Quý Đôn') && year < 2026) {
      console.log(`❌ Anomaly: "${schoolName}" has cutoff in ${year} (program: "${progName}", score: ${score}). This school only joined the specialized system in 2026!`)
      anomalies++
    }

    if (schoolName === 'THPT Chuyên Trần Đại Nghĩa' && (progName === 'Chuyên Địa' || progName === 'Chuyên Sử') && year < 2024) {
      console.log(`❌ Anomaly: "${schoolName}" has cutoff in ${year} for "${progName}" (score: ${score}). This program only started in 2024!`)
      anomalies++
    }
  })

  // 3. Group and print all specialized/integrated programs by school and their years
  console.log('\n📚 Specialized/Integrated Programs in Database:')
  const specializedGroups = new Map<string, Map<string, number[]>>()

  programs.forEach(p => {
    if (p.type === 'NORMAL') return
    const school = schoolMap.get(p.school_id)
    if (!school) return

    if (!specializedGroups.has(school.name)) {
      specializedGroups.set(school.name, new Map())
    }
    specializedGroups.get(school.name)!.set(p.name, [])
  })

  cutoffs.forEach(c => {
    const p = programMap.get(c.program_id)
    if (!p || p.type === 'NORMAL') return
    const school = schoolMap.get(p.school_id)
    if (!school) return

    const years = specializedGroups.get(school.name)?.get(p.name)
    if (years) {
      years.push(c.year)
    }
  })

  specializedGroups.forEach((progMap, schoolName) => {
    console.log(`🔹 School: ${schoolName}`)
    progMap.forEach((years, progName) => {
      years.sort()
      console.log(`   - ${progName}: [${years.join(', ')}]`)
    });
  })

  // 4. Verify regular school cutoff ranges (max 30) and specialized (max 50)
  console.log('\n📈 Checking cutoff score values:')
  cutoffs.forEach(c => {
    const p = programMap.get(c.program_id)
    if (!p) return
    const school = schoolMap.get(p.school_id)
    if (!school) return

    const score = c.cutoff_score
    if (p.type === 'NORMAL') {
      if (score > 30 || score < 5) {
        console.log(`❌ Suspicious Regular Score: ${school.name} / ${p.name} (${c.year}) = ${score}`)
        anomalies++
      }
    } else {
      if (score > 50 || score < 10) {
        console.log(`❌ Suspicious Specialized Score: ${school.name} / ${p.name} (${c.year}) = ${score}`)
        anomalies++
      }
    }
  })

  // 5. Check duplicate programs and duplicate cutoffs
  let programDuplicates = 0
  const progNamesBySchool = new Map<string, Set<string>>()
  programs.forEach(p => {
    if (!progNamesBySchool.has(p.school_id)) {
      progNamesBySchool.set(p.school_id, new Set())
    }
    const set = progNamesBySchool.get(p.school_id)!
    if (set.has(p.name)) {
      const s = schoolMap.get(p.school_id)
      console.log(`❌ Duplicate Program: "${p.name}" under school "${s?.name}"`)
      programDuplicates++
      anomalies++
    }
    set.add(p.name)
  })

  let cutoffDuplicates = 0
  const cutoffSet = new Set<string>()
  cutoffs.forEach(c => {
    const key = `${c.program_id}::${c.year}`
    if (cutoffSet.has(key)) {
      const p = programMap.get(c.program_id)
      const s = p ? schoolMap.get(p.school_id) : null
      console.log(`❌ Duplicate Cutoff Entry: ${s?.name} / ${p?.name} for year ${c.year}`)
      cutoffDuplicates++
      anomalies++
    }
    cutoffSet.add(key)
  })

  console.log(`\n📋 Audit Summary:`)
  console.log(`   - Duplicate programs: ${programDuplicates}`)
  console.log(`   - Duplicate cutoffs: ${cutoffDuplicates}`)
  console.log(`   - Total Anomalies detected: ${anomalies}`)
  console.log('\n✅ Audit complete!')
}

auditData().catch(console.error)
