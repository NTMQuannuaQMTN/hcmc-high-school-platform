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

  // 1. Correct "THPT Chuyên Lê Hồng Phong" Tích hợp scores
  const { data: schoolLHP } = await supabase
    .from('schools')
    .select('id, name')
    .eq('name', 'THPT Chuyên Lê Hồng Phong')

  if (schoolLHP && schoolLHP.length > 0) {
    const schoolId = schoolLHP[0].id
    const { data: progs } = await supabase
      .from('programs')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('name', 'Tích hợp')

    if (progs && progs.length > 0) {
      const progId = progs[0].id
      
      // Update 2022
      const { error: err2022 } = await supabase
        .from('cutoffs')
        .update({ cutoff_score: 34.50 })
        .eq('program_id', progId)
        .eq('year', 2022)
      if (err2022) console.error('❌ Failed to update LHP Tích hợp 2022:', err2022.message)
      else console.log('✅ Updated LHP Tích hợp 2022 score to 34.50')

      // Update 2023
      const { error: err2023 } = await supabase
        .from('cutoffs')
        .update({ cutoff_score: 34.75 })
        .eq('program_id', progId)
        .eq('year', 2023)
      if (err2023) console.error('❌ Failed to update LHP Tích hợp 2023:', err2023.message)
      else console.log('✅ Updated LHP Tích hợp 2023 score to 34.75')

      // Delete 2024 (as LHP did not enroll integrated classes in 2024)
      const { error: err2024 } = await supabase
        .from('cutoffs')
        .delete()
        .eq('program_id', progId)
        .eq('year', 2024)
      if (err2024) console.error('❌ Failed to delete LHP Tích hợp 2024:', err2024.message)
      else console.log('✅ Deleted LHP Tích hợp 2024 cutoff')
    }
  }

  // 2. Delete "Song ngữ Tiếng Pháp" programs and their cutoffs (fake/Hanoi data)
  const { data: frenchProgs } = await supabase
    .from('programs')
    .select('id, name, school_id, schools(name)')
    .eq('name', 'Song ngữ Tiếng Pháp')

  if (frenchProgs && frenchProgs.length > 0) {
    console.log(`⚠️  Found ${frenchProgs.length} "Song ngữ Tiếng Pháp" programs to delete.`)
    const progIds = frenchProgs.map(p => p.id)

    // Delete cutoffs first due to foreign key constraints
    const { error: cutoffDelErr } = await supabase
      .from('cutoffs')
      .delete()
      .in('program_id', progIds)
    if (cutoffDelErr) {
      console.error('❌ Failed to delete Song ngữ Tiếng Pháp cutoffs:', cutoffDelErr.message)
    } else {
      console.log('   ✅ Deleted all Song ngữ Tiếng Pháp cutoffs')
    }

    // Delete reviews linked to these schools/sources if any (optional but safe)
    // Actually reviews are linked to school_id, not program_id. So they don't have FK to programs table.
    // Let's delete the programs themselves
    const { error: progDelErr } = await supabase
      .from('programs')
      .delete()
      .in('id', progIds)
    if (progDelErr) {
      console.error('❌ Failed to delete Song ngữ Tiếng Pháp programs:', progDelErr.message)
    } else {
      console.log('   ✅ Deleted all Song ngữ Tiếng Pháp programs')
    }
  }

  // 3. Clean up "THCS-THPT Trần Đại Nghĩa" (year < 2024)
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
        .select('id, year, cutoff_score, programs(name)')
        .in('program_id', progIds)
        .lt('year', 2024)

      if (cutoffs && cutoffs.length > 0) {
        console.log(`⚠️  Found ${cutoffs.length} incorrect cutoffs for THCS-THPT Trần Đại Nghĩa (established 2024):`)
        const toDeleteIds = cutoffs.map(c => c.id)
        const { error: deleteErr } = await supabase
          .from('cutoffs')
          .delete()
          .in('id', toDeleteIds)
        if (deleteErr) console.error('❌ Deletion of THCS-THPT TDN cutoffs failed:', deleteErr.message)
        else console.log('   ✅ Deleted all targeted incorrect THCS-THPT TDN cutoff records!')
      }
    }
  }

  console.log('\n🎉 Cleanup complete!')
}

cleanupData().catch(console.error)
