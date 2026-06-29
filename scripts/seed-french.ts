/**
 * Safe incremental seed — adds French program data WITHOUT overwriting existing data.
 * Only inserts new programs, cutoffs, and reviews that don't already exist.
 * Usage: npx tsx scripts/seed-french.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Song ngữ Tiếng Pháp programs to add ──
// Chuyên Pháp @ Lê Hồng Phong already exists in DB — skip it.
// We only need to add INTEGRATED Song ngữ programs and historical cutoffs.

const FRENCH_PROGRAMS: { schoolName: string; programName: string; type: string }[] = [
  { schoolName: 'THPT Chuyên Lê Hồng Phong', programName: 'Song ngữ Tiếng Pháp', type: 'INTEGRATED' },
  { schoolName: 'THPT Nguyễn Thị Minh Khai',  programName: 'Song ngữ Tiếng Pháp', type: 'INTEGRATED' },
  { schoolName: 'THPT Marie Curie',            programName: 'Song ngữ Tiếng Pháp', type: 'INTEGRATED' },
]

// Historical cutoffs to add (won't conflict with existing 2026 data)
const FRENCH_CUTOFFS: Record<string, Record<string, [number, number][]>> = {
  // Chuyên Pháp already exists with 2026 cutoff. Add historical years only.
  'Chuyên Pháp @ THPT Chuyên Lê Hồng Phong': {
    'Chuyên Pháp': [[2021, 37.00], [2022, 24.25], [2023, 30.50], [2024, 31.00]],
  },
  // New Song ngữ programs — add all years
  'Song ngữ Tiếng Pháp @ THPT Chuyên Lê Hồng Phong': {
    'Song ngữ Tiếng Pháp': [[2021, 40.50], [2022, 38.00], [2023, 39.75], [2024, 41.00]],
  },
  'Song ngữ Tiếng Pháp @ THPT Nguyễn Thị Minh Khai': {
    'Song ngữ Tiếng Pháp': [[2021, 38.50], [2022, 36.75], [2023, 38.00], [2024, 39.50]],
  },
  'Song ngữ Tiếng Pháp @ THPT Marie Curie': {
    'Song ngữ Tiếng Pháp': [[2021, 37.50], [2022, 35.50], [2023, 37.25], [2024, 38.75]],
  },
}

const FRENCH_REVIEWS = [
  { schoolName: 'THPT Chuyên Lê Hồng Phong', source: 'Học sinh chuyên Pháp', content: 'Lớp chuyên Pháp sĩ số ít, thầy cô quan tâm sát sao. Được tham gia nhiều cuộc thi Pháp ngữ quốc tế như DELF/DALF.' },
  { schoolName: 'THPT Chuyên Lê Hồng Phong', source: 'Phụ huynh', content: 'Con tôi học chuyên Pháp ở đây 3 năm, tiếng Pháp tiến bộ vượt bậc. Nhiều cơ hội du học Pháp, Bỉ, Canada.' },
  { schoolName: 'THPT Chuyên Lê Hồng Phong', source: 'Cựu học sinh', content: 'Môi trường học thuật rất tốt, bạn bè đều giỏi và có động lực. Lớp song ngữ Pháp được tiếp cận chương trình giáo dục Pháp song song.' },
  { schoolName: 'THPT Nguyễn Thị Minh Khai', source: 'Học sinh lớp Pháp', content: 'Lớp song ngữ Tiếng Pháp giúp mình có lợi thế ngoại ngữ thứ hai, thầy cô người Pháp dạy rất hay.' },
  { schoolName: 'THPT Marie Curie', source: 'Học sinh song ngữ Pháp', content: 'Chương trình song ngữ Pháp tại Marie Curie rất bài bản, được học Toán bằng tiếng Pháp giúp tư duy đa ngôn ngữ.' },
]

async function seedFrench() {
  console.log('🇫🇷 Seeding French program data (incremental, no overwrite)...\n')

  // Step 1: Get school IDs
  const { data: schools, error: schoolsErr } = await supabase
    .from('schools')
    .select('id, name')

  if (schoolsErr || !schools) {
    console.error('❌ Failed to read schools:', schoolsErr?.message)
    process.exit(1)
  }

  const schoolMap = Object.fromEntries(schools.map((s) => [s.name, s.id]))

  // Verify required schools exist
  const requiredSchools = ['THPT Chuyên Lê Hồng Phong', 'THPT Nguyễn Thị Minh Khai', 'THPT Marie Curie']
  for (const name of requiredSchools) {
    if (!schoolMap[name]) {
      console.error(`❌ School "${name}" not found in database!`)
      process.exit(1)
    }
  }
  console.log('✅ All required schools found in database')

  // Step 2: Check existing programs and add missing ones
  const { data: existingProgs } = await supabase
    .from('programs')
    .select('id, name, school_id')

  const existingProgSet = new Set(
    (existingProgs ?? []).map((p) => `${p.school_id}::${p.name}`)
  )

  const newPrograms = FRENCH_PROGRAMS
    .filter((p) => !existingProgSet.has(`${schoolMap[p.schoolName]}::${p.programName}`))
    .map((p) => ({
      school_id: schoolMap[p.schoolName],
      name: p.programName,
      type: p.type,
    }))

  if (newPrograms.length > 0) {
    const { data: insertedProgs, error: progsErr } = await supabase
      .from('programs')
      .insert(newPrograms)
      .select()

    if (progsErr) {
      console.error('❌ Failed to insert programs:', progsErr.message)
      process.exit(1)
    }
    console.log(`✅ Added ${insertedProgs.length} new program(s):`)
    insertedProgs.forEach((p: any) => console.log(`   + ${p.name} (${p.type})`))
  } else {
    console.log('ℹ️  All French programs already exist — skipping')
  }

  // Step 3: Re-fetch programs to get all IDs (including newly inserted)
  const { data: allProgs } = await supabase
    .from('programs')
    .select('id, name, school_id')

  const programMap = Object.fromEntries(
    (allProgs ?? []).map((p) => [`${p.school_id}::${p.name}`, p.id])
  )

  // Step 4: Check existing cutoffs and add missing historical ones
  const { data: existingCutoffs } = await supabase
    .from('cutoffs')
    .select('program_id, year')

  const existingCutoffSet = new Set(
    (existingCutoffs ?? []).map((c) => `${c.program_id}::${c.year}`)
  )

  const cutoffRows: { program_id: string; year: number; cutoff_score: number }[] = []

  // Add historical cutoffs for Chuyên Pháp @ Lê Hồng Phong
  const chuyenPhapId = programMap[`${schoolMap['THPT Chuyên Lê Hồng Phong']}::Chuyên Pháp`]
  if (chuyenPhapId) {
    for (const [year, score] of FRENCH_CUTOFFS['Chuyên Pháp @ THPT Chuyên Lê Hồng Phong']['Chuyên Pháp']) {
      if (!existingCutoffSet.has(`${chuyenPhapId}::${year}`)) {
        cutoffRows.push({ program_id: chuyenPhapId, year, cutoff_score: score })
      }
    }
  }

  // Add cutoffs for Song ngữ programs
  for (const prog of FRENCH_PROGRAMS) {
    const progId = programMap[`${schoolMap[prog.schoolName]}::${prog.programName}`]
    if (!progId) continue
    const key = `${prog.programName} @ ${prog.schoolName}`
    const cutoffData = FRENCH_CUTOFFS[key]
    if (!cutoffData) continue
    for (const [year, score] of cutoffData[prog.programName]) {
      if (!existingCutoffSet.has(`${progId}::${year}`)) {
        cutoffRows.push({ program_id: progId, year, cutoff_score: score })
      }
    }
  }

  if (cutoffRows.length > 0) {
    const { data: insertedCutoffs, error: cutoffsErr } = await supabase
      .from('cutoffs')
      .insert(cutoffRows)
      .select()

    if (cutoffsErr) {
      console.error('❌ Failed to insert cutoffs:', cutoffsErr.message)
      process.exit(1)
    }
    console.log(`✅ Added ${insertedCutoffs.length} new cutoff(s)`)
  } else {
    console.log('ℹ️  All cutoffs already exist — skipping')
  }

  // Step 5: Add reviews (always insert — reviews don't have unique constraints)
  const reviewRows = FRENCH_REVIEWS
    .map((r) => ({
      school_id: schoolMap[r.schoolName],
      source: r.source,
      content: r.content,
    }))
    .filter((r) => r.school_id)

  if (reviewRows.length > 0) {
    const { data: insertedReviews, error: reviewsErr } = await supabase
      .from('reviews')
      .insert(reviewRows)
      .select()

    if (reviewsErr) {
      console.error('❌ Failed to insert reviews:', reviewsErr.message)
      process.exit(1)
    }
    console.log(`✅ Added ${insertedReviews.length} new review(s)`)
  }

  console.log('\n🎉 French program seed complete!')
}

seedFrench().catch(console.error)
