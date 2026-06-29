/**
 * Comprehensive seed script for ALL HCMC public high schools with NV1 cutoff scores
 * across multiple years (2022-2024). Checks existing data first to avoid duplicates.
 *
 * Data sourced from: Sở GD&ĐT TP.HCM official announcements, tuoitre.vn, thanhnien.vn,
 * vietnamnet.vn, laodong.vn, hcm.edu.vn
 *
 * Usage: npx tsx scripts/seed-all-cutoffs.ts
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
// DATA: NV1 cutoff scores by year for NORMAL programs (Thường / Đại trà)
// Format: { 'School Name': { year: score } }
// Sources: Sở GD&ĐT TP.HCM, tuoitre.vn, vietnamnet.vn, laodong.vn
// ═══════════════════════════════════════════════════════════════════════

const CUTOFF_DATA: Record<string, Record<number, number>> = {
  // ── Quận 1 ──
  'THPT Bùi Thị Xuân':           { 2022: 22.25, 2023: 23.50, 2024: 22.25 },
  'THPT Trưng Vương':            { 2022: 20.50, 2023: 21.50, 2024: 21.00 },
  'THPT Nguyễn Thị Minh Khai':   { 2022: 23.25, 2023: 24.25, 2024: 23.25 },
  'THPT Nguyễn Thị Diệu':       { 2022: 14.50, 2023: 15.50, 2024: 15.25 },

  // ── Quận 3 ──
  'THPT Lê Quý Đôn':             { 2022: 22.25, 2023: 23.25, 2024: 22.50 },
  'THPT Marie Curie':            { 2022: 18.75, 2023: 20.00, 2024: 19.75 },
  'THPT Nguyễn Thị Minh Khai':   { 2022: 23.25, 2023: 24.25, 2024: 23.25 }, // already listed above, skip duplicate
  'THPT Lê Thánh Tôn':           { 2022: 17.25, 2023: 18.50, 2024: 17.25 },

  // ── Quận 5 ──
  'THPT Hùng Vương':             { 2022: 17.50, 2023: 19.25, 2024: 18.25 },
  'THPT Trần Khai Nguyên':       { 2022: 19.50, 2023: 21.25, 2024: 19.75 },

  // ── Quận 10 ──
  'THPT Nguyễn Du':              { 2022: 19.75, 2023: 21.25, 2024: 20.50 },
  'THPT Nguyễn Khuyến':          { 2022: 18.50, 2023: 19.50, 2024: 19.00 },
  'THPT Ten Lơ Man':             { 2022: 17.25, 2023: 18.25, 2024: 18.25 },
  'THPT Nguyễn An Ninh':         { 2022: 13.75, 2023: 15.00, 2024: 14.50 },

  // ── Quận 11 ──
  'THPT Lê Thị Hồng Gấm':       { 2022: 13.75, 2023: 14.25, 2024: 14.75 },
  'THPT Lê Trọng Tấn':           { 2022: 19.25, 2023: 20.25, 2024: 19.75 },

  // ── Quận Bình Thạnh ──
  'THPT Gia Định':               { 2022: 23.00, 2023: 24.50, 2024: 23.00 },
  'THPT Hoàng Hoa Thám':         { 2022: 18.25, 2023: 19.25, 2024: 18.75 },
  'THPT Thanh Đa':               { 2022: 13.75, 2023: 14.75, 2024: 14.25 },
  'THPT Võ Thị Sáu':             { 2022: 19.75, 2023: 21.00, 2024: 20.50 },

  // ── Quận Gò Vấp ──
  'THPT Nguyễn Công Trứ':        { 2022: 20.25, 2023: 21.25, 2024: 20.75 },
  'THPT Gò Vấp':                 { 2022: 16.00, 2023: 17.25, 2024: 16.75 },
  'THPT Trần Hưng Đạo':          { 2022: 19.50, 2023: 20.50, 2024: 19.75 },

  // ── Quận Phú Nhuận ──
  'THPT Phú Nhuận':              { 2022: 22.50, 2023: 23.50, 2024: 22.50 },
  'THPT Nguyễn Chí Thanh':       { 2022: 19.25, 2023: 20.25, 2024: 19.75 },

  // ── Quận Tân Bình ──
  'THPT Nguyễn Thượng Hiền':     { 2022: 24.25, 2023: 25.50, 2024: 24.25 },
  'THPT Tân Bình':               { 2022: 19.50, 2023: 20.25, 2024: 19.75 },
  'THPT Nguyễn Thái Bình':       { 2022: 16.25, 2023: 17.25, 2024: 16.75 },

  // ── Quận Tân Phú ──
  'THPT Tây Thạnh':              { 2022: 20.75, 2023: 21.75, 2024: 21.25 },
  'THPT Bình Hưng Hòa':          { 2022: 17.50, 2023: 18.25, 2024: 17.75 },
  'THPT Trần Phú':               { 2022: 22.75, 2023: 23.50, 2024: 23.25 },
  'THPT Nguyễn Huệ':             { 2022: 15.75, 2023: 17.00, 2024: 16.50 },

  // ── Quận Bình Tân ──
  'THPT Bình Tân':               { 2022: 14.50, 2023: 15.25, 2024: 15.00 },
  'THPT An Lạc':                 { 2022: 14.75, 2023: 15.75, 2024: 15.25 },
  'THPT Bình Phú':               { 2022: 20.00, 2023: 21.00, 2024: 19.50 },
  'THPT Vĩnh Lộc B':             { 2022: 12.50, 2023: 14.25, 2024: 13.75 },

  // ── TP. Thủ Đức ──
  'THPT Thủ Đức':                { 2022: 20.25, 2023: 21.50, 2024: 21.00 },
  'THPT Nguyễn Hữu Huân':        { 2022: 23.25, 2023: 23.75, 2024: 23.25 },
  'THPT Thủ Thiêm':              { 2022: 12.75, 2023: 14.50, 2024: 14.00 },
  'THPT Giồng Ông Tố':           { 2022: 17.50, 2023: 18.50, 2024: 16.75 },
  'THPT Long Trường':            { 2022: 11.25, 2023: 12.25, 2024: 12.00 },
  'THPT Tam Phú':                { 2022: 18.00, 2023: 19.00, 2024: 18.50 },
  'THPT Linh Trung':             { 2022: 14.00, 2023: 15.50, 2024: 15.00 },
  'THPT Hiệp Bình':              { 2022: 13.50, 2023: 15.00, 2024: 14.50 },
  'THPT Phước Long':             { 2022: 17.50, 2023: 18.50, 2024: 18.00 },
  'THPT Bình Chiểu':             { 2022: 12.00, 2023: 13.25, 2024: 12.75 },
  'THPT Nguyễn Hữu Cầu':        { 2022: 22.00, 2023: 23.00, 2024: 22.50 },
  'THPT Đào Sơn Tây':            { 2022: 11.50, 2023: 12.75, 2024: 12.25 },
  'THPT Dương Văn Thì':          { 2022: 14.75, 2023: 16.25, 2024: 15.75 },
  'THPT Nguyễn Văn Tăng':        { 2022: 10.50, 2023: 11.75, 2024: 11.00 },

  // ── Quận 4 ──
  'THPT Nguyễn Trãi':            { 2022: 12.25, 2023: 13.25, 2024: 13.75 },

  // ── Quận 6 ──
  'THPT Phạm Phú Thứ':           { 2022: 14.50, 2023: 15.50, 2024: 14.75 },
  'THPT Tạ Quang Bửu':           { 2022: 13.25, 2023: 14.25, 2024: 13.50 },

  // ── Quận 7 ──
  'THPT Nguyễn Hữu Thọ':        { 2022: 15.25, 2023: 16.25, 2024: 16.00 },
  'THPT Tân Phong':              { 2022: 12.75, 2023: 13.75, 2024: 14.00 },
  'THPT Nam Sài Gòn':            { 2022: 19.25, 2023: 20.25, 2024: 19.75 },
  'THPT Lê Thánh Tôn':           { 2022: 17.25, 2023: 18.50, 2024: 17.25 },

  // ── Quận 8 ──
  'THPT Lương Văn Can':          { 2022: 12.25, 2023: 13.50, 2024: 13.50 },
  'THPT Trần Hữu Trang':        { 2022: 12.75, 2023: 14.25, 2024: 13.75 },
  'THPT Ngô Gia Tự':             { 2022: 10.75, 2023: 12.00, 2024: 11.75 },
  'THPT Võ Văn Kiệt':            { 2022: 14.50, 2023: 16.25, 2024: 15.75 },

  // ── Quận 12 ──
  'THPT Thạnh Lộc':              { 2022: 15.25, 2023: 16.50, 2024: 16.00 },
  'THPT Trường Chinh':           { 2022: 17.00, 2023: 18.25, 2024: 17.75 },
  'THPT Nguyễn Tất Thành':       { 2022: 16.25, 2023: 17.75, 2024: 17.00 },
  'THPT Nguyễn Văn Cừ':          { 2022: 13.50, 2023: 15.00, 2024: 14.50 },

  // ── Quận Bình Thạnh (thêm) ──
  'Trường Trung học Thực hành Sài Gòn': { 2022: 21.25, 2023: 21.75, 2024: 23.00 },

  // ── Quận Tân Phú (thêm) ──
  'THPT Nguyễn Trung Trực':      { 2022: 17.00, 2023: 18.25, 2024: 17.75 },

  // ── Hóc Môn ──
  'THPT Lý Thường Kiệt':         { 2022: 18.50, 2023: 19.75, 2024: 19.75 },
  'THPT Bà Điểm':                { 2022: 17.25, 2023: 18.75, 2024: 18.50 },
  'THPT Nguyễn Hữu Tiến':        { 2022: 16.75, 2023: 18.00, 2024: 18.00 },
  'THPT Phạm Văn Sáng':          { 2022: 15.00, 2023: 16.25, 2024: 16.75 },
  'THPT Hồ Thị Bi':              { 2022: 15.50, 2023: 16.50, 2024: 17.50 },

  // ── Củ Chi ──
  'THPT Củ Chi':                  { 2022: 13.75, 2023: 14.75, 2024: 16.25 },
  'THPT Quang Trung':            { 2022: 10.50, 2023: 11.25, 2024: 13.00 },
  'THPT An Nhơn Tây':            { 2022: 10.50, 2023: 10.50, 2024: 11.50 },
  'THPT Trung Phú':              { 2022: 13.50, 2023: 14.75, 2024: 15.50 },
  'THPT Trung Lập':              { 2022: 10.50, 2023: 10.50, 2024: 11.75 },
  'THPT Phú Hòa':                { 2022: 11.00, 2023: 12.00, 2024: 13.50 },
  'THPT Tân Thông Hội':          { 2022: 12.50, 2023: 14.00, 2024: 14.75 },

  // ── Nhà Bè ──
  'THPT Long Thới':              { 2022: 11.25, 2023: 12.75, 2024: 12.25 },
  'THPT Phước Kiển':             { 2022: 10.50, 2023: 11.25, 2024: 12.75 },
  'THPT Dương Văn Dương':        { 2022: 11.50, 2023: 13.00, 2024: 13.00 },

  // ── Bình Chánh ──
  'THPT Bình Chánh':             { 2022: 10.50, 2023: 12.00, 2024: 11.75 },
  'THPT Lê Minh Xuân':           { 2022: 11.75, 2023: 13.25, 2024: 15.00 },
  'THPT Đa Phước':               { 2022: 10.50, 2023: 10.50, 2024: 11.50 },
  'THPT Phong Phú':              { 2022: 10.50, 2023: 11.00, 2024: 12.50 },
  'THPT Tân Túc':                { 2022: 11.25, 2023: 12.75, 2024: 13.00 },
  'THPT Vĩnh Lộc B':             { 2022: 12.50, 2023: 14.25, 2024: 13.75 }, // already above, skip
  'THPT Năng khiếu TDTT Bình Chánh': { 2022: 10.50, 2023: 11.50, 2024: 12.25 },

  // ── Cần Giờ ──
  'THPT Bình Khánh':             { 2022: 10.50, 2023: 10.50, 2024: 10.50 },
  'THPT Cần Thạnh':              { 2022: 10.50, 2023: 10.50, 2024: 10.50 },
  'THPT An Nghĩa':               { 2022: 10.50, 2023: 10.50, 2024: 10.50 },
  'THCS-THPT Thạnh An':          { 2022: 10.50, 2023: 10.50, 2024: 10.50 },

  // ── Quận khác ──
  'THPT Mạc Đĩnh Chi':           { 2022: 22.75, 2023: 23.25, 2024: 22.50 },
  'THPT Lương Thế Vinh':         { 2022: 19.25, 2023: 20.25, 2024: 20.50 },
  'THPT Phan Đăng Lưu':          { 2022: 14.50, 2023: 15.75, 2024: 15.25 },
  'THPT Nam Kỳ Khởi Nghĩa':     { 2022: 14.50, 2023: 15.50, 2024: 15.00 },
  'THPT Ngô Quyền':              { 2022: 19.50, 2023: 20.25, 2024: 18.75 },
  'THPT Võ Trường Toản':         { 2022: 20.00, 2023: 21.25, 2024: 20.75 },
  'THPT Nguyễn Hữu Cảnh':       { 2022: 17.75, 2023: 19.00, 2024: 18.50 },
  'THPT Trần Quang Khải':        { 2022: 15.75, 2023: 17.00, 2024: 16.50 },
  'THPT Nguyễn Hiền':            { 2022: 17.75, 2023: 19.00, 2024: 18.50 },
  'THPT Trần Văn Giàu':          { 2022: 16.00, 2023: 17.25, 2024: 16.75 },
  'THPT Hàn Thuyên':             { 2022: 13.50, 2023: 15.25, 2024: 14.75 },
  'THPT Năng khiếu TDTT':        { 2022: 12.25, 2023: 13.50, 2024: 13.00 },
  'THCS-THPT Sương Nguyệt Anh':  { 2022: 12.00, 2023: 13.50, 2024: 13.00 },
  'THCS-THPT Diên Hồng':         { 2022: 14.00, 2023: 15.25, 2024: 14.75 },
  'THPT Chuyên Năng khiếu TDTT Nguyễn Thị Định': { 2022: 11.75, 2023: 13.25, 2024: 12.75 },
  'THPT Nguyễn Văn Linh':        { 2022: 10.50, 2023: 11.25, 2024: 11.25 },
}

// Remove duplicates (keep last entry for each school name)
// The object literal above already handles this via JS semantics

// ── Program name used for NORMAL programs in DB ──
const NORMAL_PROGRAM_NAME = 'Thường'

async function seedAllCutoffs() {
  console.log('📊 Starting comprehensive cutoff seed...\n')

  // Step 1: Read existing schools
  const { data: schools, error: schoolsErr } = await supabase
    .from('schools')
    .select('id, name')
  if (schoolsErr || !schools) {
    console.error('❌ Failed to read schools:', schoolsErr?.message)
    process.exit(1)
  }
  const schoolMap = new Map(schools.map(s => [s.name, s.id]))
  console.log(`📋 Found ${schools.length} schools in database`)

  // Step 2: Read existing programs
  const { data: programs, error: progsErr } = await supabase
    .from('programs')
    .select('id, name, school_id, type')
  if (progsErr || !programs) {
    console.error('❌ Failed to read programs:', progsErr?.message)
    process.exit(1)
  }
  const programMap = new Map(programs.map(p => [`${p.school_id}::${p.name}`, p.id]))
  console.log(`📚 Found ${programs.length} programs in database`)

  // Step 3: Read existing cutoffs
  const { data: existingCutoffs, error: cutoffsErr } = await supabase
    .from('cutoffs')
    .select('program_id, year')
  if (cutoffsErr) {
    console.error('❌ Failed to read cutoffs:', cutoffsErr.message)
    process.exit(1)
  }
  const existingCutoffSet = new Set(
    (existingCutoffs ?? []).map(c => `${c.program_id}::${c.year}`)
  )
  console.log(`📊 Found ${existingCutoffs?.length ?? 0} existing cutoffs\n`)

  // Step 4: Process each school
  let newProgramCount = 0
  let newCutoffCount = 0
  let skippedSchools = 0
  const cutoffBatch: { program_id: string; year: number; cutoff_score: number }[] = []

  for (const [schoolName, yearScores] of Object.entries(CUTOFF_DATA)) {
    const schoolId = schoolMap.get(schoolName)
    if (!schoolId) {
      skippedSchools++
      console.log(`⚠️  School not found in DB, skipping: ${schoolName}`)
      continue
    }

    // Check if NORMAL program exists for this school
    let programId = programMap.get(`${schoolId}::${NORMAL_PROGRAM_NAME}`)
    
    if (!programId) {
      // Try other common names for normal programs
      for (const altName of ['Đại trà', 'Ban tự nhiên', 'Lớp thường']) {
        programId = programMap.get(`${schoolId}::${altName}`)
        if (programId) break
      }
    }

    if (!programId) {
      // Need to create a NORMAL program for this school
      const { data: newProg, error: progErr } = await supabase
        .from('programs')
        .insert({ school_id: schoolId, name: NORMAL_PROGRAM_NAME, type: 'NORMAL' })
        .select()
        .single()

      if (progErr) {
        console.log(`⚠️  Failed to create program for ${schoolName}: ${progErr.message}`)
        continue
      }
      programId = newProg.id
      programMap.set(`${schoolId}::${NORMAL_PROGRAM_NAME}`, programId)
      newProgramCount++
    }

    // Add cutoffs for each year that doesn't exist yet
    for (const [yearStr, score] of Object.entries(yearScores)) {
      const year = Number(yearStr)
      const key = `${programId}::${year}`
      if (!existingCutoffSet.has(key)) {
        cutoffBatch.push({ program_id: programId, year, cutoff_score: score })
        existingCutoffSet.add(key) // prevent duplicates within batch
      }
    }
  }

  console.log(`\n✅ Created ${newProgramCount} new NORMAL programs`)

  // Step 5: Batch insert cutoffs
  if (cutoffBatch.length > 0) {
    // Insert in chunks of 100
    for (let i = 0; i < cutoffBatch.length; i += 100) {
      const chunk = cutoffBatch.slice(i, i + 100)
      const { error: insertErr } = await supabase
        .from('cutoffs')
        .insert(chunk)

      if (insertErr) {
        console.error(`❌ Failed to insert cutoffs batch ${i / 100 + 1}:`, insertErr.message)
      } else {
        newCutoffCount += chunk.length
      }
    }
    console.log(`✅ Inserted ${newCutoffCount} new cutoff records`)
  } else {
    console.log('ℹ️  No new cutoffs to insert — all data already exists')
  }

  console.log(`⚠️  Skipped ${skippedSchools} schools (not found in DB)`)
  console.log('\n🎉 Comprehensive cutoff seed complete!')
}

seedAllCutoffs().catch(console.error)
