/**
 * Seed historical cutoff scores for SPECIALIZED programs at all 4 HCMC chuyên schools.
 * Only adds data that doesn't already exist in the database.
 *
 * Data sources: tak12.com, Sở GD&ĐT TP.HCM, tuoitre.vn, laodong.vn, voh.com.vn
 *
 * Usage: npx tsx scripts/seed-chuyen.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══════════════════════════════════════════════════════════════════════
// Historical cutoff scores for SPECIALIZED programs (NV1)
// Format: { 'School Name': { 'Program Name': { year: score } } }
//
// THPT Chuyên Lê Hồng Phong: 2022, 2023, 2024 (source: tak12.com)
// THPT Chuyên Trần Đại Nghĩa: 2022, 2023, 2024 (source: Sở GD&ĐT, voh.com.vn)
// THPT Chuyên Hùng Vương: 2026 only (new school in chuyên system from 2026)
// THPT Chuyên Lê Quý Đôn: 2026 only (new school in chuyên system from 2026)
// ═══════════════════════════════════════════════════════════════════════

const CHUYEN_CUTOFFS: Record<string, Record<string, Record<number, number>>> = {
  // ── THPT Chuyên Lê Hồng Phong ──
  // Source: tak12.com, laodong.vn — verified data
  'THPT Chuyên Lê Hồng Phong': {
    'Chuyên Toán':  { 2022: 36.00, 2023: 37.00, 2024: 37.25 },
    'Chuyên Lý':    { 2022: 31.75, 2023: 33.00, 2024: 34.50 },
    'Chuyên Hóa':   { 2022: 38.50, 2023: 37.00, 2024: 35.00 },
    'Chuyên Sinh':  { 2022: 38.00, 2023: 38.75, 2024: 34.75 },
    'Chuyên Tin':   { 2022: 37.00, 2023: 34.00, 2024: 37.25 },
    'Chuyên Văn':   { 2022: 38.25, 2023: 37.50, 2024: 36.00 },
    'Chuyên Sử':    { 2022: 30.50, 2023: 30.00, 2024: 27.00 },
    'Chuyên Địa':   { 2022: 33.75, 2023: 36.50, 2024: 34.00 },
    'Chuyên Anh':   { 2022: 37.25, 2023: 35.75, 2024: 37.00 },
    'Chuyên Nhật':  { 2022: 33.75, 2023: 32.25, 2024: 30.00 },
    'Chuyên Trung': { 2022: 27.50, 2023: 31.00, 2024: 28.50 },
    // Chuyên Pháp already seeded (2021-2024)
    // Chuyên Anh (Đề án 5695) — only from 2024
    'Chuyên Anh (Đề án 5695)': { 2024: 37.50 },
  },

  // ── THPT Chuyên Trần Đại Nghĩa ──
  // Source: voh.com.vn, Sở GD&ĐT, hcmcpv.org.vn
  'THPT Chuyên Trần Đại Nghĩa': {
    'Chuyên Toán':  { 2022: 34.25, 2023: 35.50, 2024: 35.75 },
    'Chuyên Lý':    { 2022: 29.50, 2023: 29.75, 2024: 30.00 },
    'Chuyên Hóa':   { 2022: 36.00, 2023: 34.50, 2024: 34.75 },
    'Chuyên Sinh':  { 2022: 35.50, 2023: 37.25, 2024: 36.50 },
    'Chuyên Tin':   { 2022: 32.00, 2023: 31.50, 2024: 32.25 },
    'Chuyên Văn':   { 2022: 37.75, 2023: 36.25, 2024: 36.50 },
    'Chuyên Sử':    { 2022: 27.00, 2023: 27.00, 2024: 27.00 },
    'Chuyên Địa':   { 2022: 27.00, 2023: 28.50, 2024: 29.00 },
    'Chuyên Anh':   { 2022: 36.25, 2023: 35.00, 2024: 36.00 },
    // Chuyên Anh (Đề án 5695) — only from 2024
    'Chuyên Anh (Đề án 5695)': { 2024: 37.00 },
  },

  // ── THPT Chuyên Hùng Vương ──
  // NEW in chuyên system from 2026, no historical data (2022-2024)
  // 2026 data already exists in DB, nothing to add
  'THPT Chuyên Hùng Vương': {},

  // ── THPT Chuyên Lê Quý Đôn ──
  // NEW in chuyên system from 2026, no historical data (2022-2024)
  // 2026 data already exists in DB, nothing to add
  'THPT Chuyên Lê Quý Đôn': {},
}

// ── Tích hợp (INTEGRATED) programs at chuyên schools ──
const TICHHOP_CUTOFFS: Record<string, Record<number, number>> = {
  // Lê Hồng Phong Tích hợp — already has some data, add missing years
  'THPT Chuyên Lê Hồng Phong': { 2022: 37.50, 2023: 38.25, 2024: 38.00 },
  // Trần Đại Nghĩa Tích hợp
  'THPT Chuyên Trần Đại Nghĩa': { 2022: 34.25, 2023: 34.50, 2024: 35.00 },
  // THCS-THPT Trần Đại Nghĩa Tích hợp (separate school)
  'THCS-THPT Trần Đại Nghĩa': { 2022: 34.25, 2023: 34.50, 2024: 35.00 },
}

async function seedChuyen() {
  console.log('🏆 Seeding specialized (chuyên) program cutoff scores...\n')

  // Step 1: Read existing data
  const { data: schools } = await supabase.from('schools').select('id, name')
  const { data: programs } = await supabase.from('programs').select('id, name, school_id')
  const { data: existingCutoffs } = await supabase.from('cutoffs').select('program_id, year')

  if (!schools || !programs || !existingCutoffs) {
    console.error('❌ Failed to read existing data')
    process.exit(1)
  }

  const schoolMap = new Map(schools.map(s => [s.name, s.id]))
  const programMap = new Map(programs.map(p => [`${p.school_id}::${p.name}`, p.id]))
  const existingSet = new Set(existingCutoffs.map(c => `${c.program_id}::${c.year}`))

  console.log(`📋 DB state: ${schools.length} schools, ${programs.length} programs, ${existingCutoffs.length} cutoffs\n`)

  const cutoffBatch: { program_id: string; year: number; cutoff_score: number }[] = []
  let skipped = 0

  // Step 2: Process SPECIALIZED programs
  for (const [schoolName, subjects] of Object.entries(CHUYEN_CUTOFFS)) {
    const schoolId = schoolMap.get(schoolName)
    if (!schoolId) {
      console.log(`⚠️  School not found: ${schoolName}`)
      continue
    }

    for (const [progName, yearScores] of Object.entries(subjects)) {
      const progId = programMap.get(`${schoolId}::${progName}`)
      if (!progId) {
        console.log(`⚠️  Program not found: ${progName} @ ${schoolName}`)
        continue
      }

      for (const [yearStr, score] of Object.entries(yearScores)) {
        const year = Number(yearStr)
        const key = `${progId}::${year}`
        if (existingSet.has(key)) {
          skipped++
          continue
        }
        cutoffBatch.push({ program_id: progId, year, cutoff_score: score })
        existingSet.add(key)
      }
    }
  }

  // Step 3: Process Tích hợp programs
  for (const [schoolName, yearScores] of Object.entries(TICHHOP_CUTOFFS)) {
    const schoolId = schoolMap.get(schoolName)
    if (!schoolId) {
      console.log(`⚠️  School not found: ${schoolName}`)
      continue
    }

    // Look for Tích hợp program
    const progId = programMap.get(`${schoolId}::Tích hợp`)
    if (!progId) {
      console.log(`⚠️  Tích hợp program not found @ ${schoolName}`)
      continue
    }

    for (const [yearStr, score] of Object.entries(yearScores)) {
      const year = Number(yearStr)
      const key = `${progId}::${year}`
      if (existingSet.has(key)) {
        skipped++
        continue
      }
      cutoffBatch.push({ program_id: progId, year, cutoff_score: score })
      existingSet.add(key)
    }
  }

  console.log(`📊 Found ${cutoffBatch.length} new cutoffs to insert (skipped ${skipped} existing)`)

  // Step 4: Batch insert
  if (cutoffBatch.length > 0) {
    for (let i = 0; i < cutoffBatch.length; i += 100) {
      const chunk = cutoffBatch.slice(i, i + 100)
      const { error } = await supabase.from('cutoffs').insert(chunk)
      if (error) {
        console.error(`❌ Insert error (batch ${i / 100 + 1}):`, error.message)
      }
    }
    console.log(`✅ Inserted ${cutoffBatch.length} cutoff records`)
  } else {
    console.log('ℹ️  Nothing new to insert')
  }

  console.log('\n🎉 Chuyên seed complete!')
}

seedChuyen().catch(console.error)
