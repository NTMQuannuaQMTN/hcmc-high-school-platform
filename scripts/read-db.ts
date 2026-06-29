/**
 * Read existing data from Supabase to inspect before seeding.
 * Usage: npx tsx scripts/read-db.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function readAll() {
  console.log('📖 Reading existing database data...\n')

  // Schools
  const { data: schools, error: schoolsErr } = await supabase
    .from('schools')
    .select('*')
    .order('name')
  
  if (schoolsErr) {
    console.error('❌ Error reading schools:', schoolsErr.message)
    console.log('   (Table may not exist yet — migrations might need to be run first)')
    return
  }

  console.log(`🏫 Schools (${schools.length}):`)
  schools.forEach((s: any) => console.log(`   - ${s.name} | ${s.district} | ${s.address}`))

  // Programs
  const { data: programs, error: progsErr } = await supabase
    .from('programs')
    .select('*, schools(name)')
    .order('name')

  if (progsErr) {
    console.error('❌ Error reading programs:', progsErr.message)
    return
  }

  console.log(`\n📚 Programs (${programs.length}):`)
  programs.forEach((p: any) => {
    const schoolName = p.schools?.name ?? 'Unknown'
    console.log(`   - [${p.type}] ${p.name} @ ${schoolName}`)
  })

  // Cutoffs
  const { data: cutoffs, error: cutoffsErr } = await supabase
    .from('cutoffs')
    .select('*, programs(name, schools(name))')
    .order('year', { ascending: false })

  if (cutoffsErr) {
    console.error('❌ Error reading cutoffs:', cutoffsErr.message)
    return
  }

  console.log(`\n📊 Cutoffs (${cutoffs.length}):`)
  cutoffs.forEach((c: any) => {
    const progName = c.programs?.name ?? 'Unknown'
    const schoolName = c.programs?.schools?.name ?? 'Unknown'
    console.log(`   - ${schoolName} / ${progName} | ${c.year}: ${c.cutoff_score}`)
  })

  // Reviews
  const { data: reviews, error: reviewsErr } = await supabase
    .from('reviews')
    .select('*, schools(name)')

  if (reviewsErr) {
    console.error('❌ Error reading reviews:', reviewsErr.message)
    return
  }

  console.log(`\n💬 Reviews (${reviews.length}):`)
  reviews.forEach((r: any) => {
    const schoolName = r.schools?.name ?? 'Unknown'
    console.log(`   - [${r.source}] ${schoolName}: ${r.content.substring(0, 60)}...`)
  })

  console.log('\n✅ Read complete!')
}

readAll().catch(console.error)
