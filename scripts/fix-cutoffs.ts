/**
 * Fix incorrect cutoff scores found during verification.
 * Updates existing records with correct data from official sources.
 *
 * Usage: npx tsx scripts/fix-cutoffs.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Corrections found during cross-checking with official sources
// Format: { schoolName, programName, year, wrongScore, correctScore, source }
const CORRECTIONS = [
  {
    schoolName: 'THPT Marie Curie',
    programName: 'Thường',
    year: 2022,
    wrongScore: 18.75,
    correctScore: 19.50,
    source: 'plo.vn, tamkhoi.edu.vn — Sở GD&ĐT TP.HCM 2022'
  },
  {
    schoolName: 'THPT Hùng Vương',
    programName: 'Thường',
    year: 2022,
    wrongScore: 17.50,
    correctScore: 21.90,
    source: 'hocmai.vn, laodong.vn — Sở GD&ĐT TP.HCM 2022'
  },
]

async function fixCutoffs() {
  console.log('🔧 Fixing incorrect cutoff scores...\n')

  const { data: schools } = await supabase.from('schools').select('id, name')
  const { data: programs } = await supabase.from('programs').select('id, name, school_id')

  if (!schools || !programs) {
    console.error('❌ Failed to read data')
    process.exit(1)
  }

  const schoolMap = new Map(schools.map(s => [s.name, s.id]))
  const programMap = new Map(programs.map(p => [`${p.school_id}::${p.name}`, p.id]))

  for (const fix of CORRECTIONS) {
    const schoolId = schoolMap.get(fix.schoolName)
    if (!schoolId) { console.log(`⚠️  School not found: ${fix.schoolName}`); continue }
    
    const progId = programMap.get(`${schoolId}::${fix.programName}`)
    if (!progId) { console.log(`⚠️  Program not found: ${fix.programName} @ ${fix.schoolName}`); continue }

    const { data: existing, error: findErr } = await supabase
      .from('cutoffs')
      .select('id, cutoff_score')
      .eq('program_id', progId)
      .eq('year', fix.year)
      .single()

    if (findErr || !existing) {
      console.log(`⚠️  No cutoff found for ${fix.schoolName} / ${fix.programName} / ${fix.year}`)
      continue
    }

    if (existing.cutoff_score === fix.correctScore) {
      console.log(`✅ Already correct: ${fix.schoolName} / ${fix.year} = ${fix.correctScore}`)
      continue
    }

    console.log(`🔄 ${fix.schoolName} / ${fix.programName} / ${fix.year}: ${existing.cutoff_score} → ${fix.correctScore}`)
    console.log(`   Source: ${fix.source}`)

    const { error: updateErr } = await supabase
      .from('cutoffs')
      .update({ cutoff_score: fix.correctScore })
      .eq('id', existing.id)

    if (updateErr) {
      console.error(`❌ Update failed: ${updateErr.message}`)
    } else {
      console.log(`   ✅ Updated successfully`)
    }
  }

  console.log('\n🎉 Fix complete!')
}

fixCutoffs().catch(console.error)
