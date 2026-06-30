import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NEW_SCHOOLS = [
  {
    name: 'Trường Tiểu học, THCS và THPT Lê Thị Riêng',
    type: 'PUBLIC',
    address: 'Số 1 Lê Thị Riêng, Phường Thới An, Quận 12, TP. Hồ Chí Minh',
    district: 'Thới An',
    latitude: 10.8679,
    longitude: 106.6669,
    description: 'Trường liên cấp công lập mới thành lập năm 2026 tại Quận 12.',
  },
  {
    name: 'Trường THPT Phan Văn Hớn',
    type: 'PUBLIC',
    address: 'Khu tái định cư 38ha, Phường Đông Hưng Thuận, Quận 12, TP. Hồ Chí Minh',
    district: 'Đông Hưng Thuận',
    latitude: 10.8355,
    longitude: 106.6190,
    description: 'Trường THPT công lập mới thành lập năm 2026 tại Quận 12.',
  },
  {
    name: 'Trường THPT Thoại Ngọc Hầu',
    type: 'PUBLIC',
    address: 'Số 70A Thoại Ngọc Hầu, Phường Tân Phú, Quận Tân Phú, TP. Hồ Chí Minh',
    district: 'Tân Phú',
    latitude: 10.7816,
    longitude: 106.6346,
    description: 'Trường THPT công lập mới thành lập năm 2026 tại Quận Tân Phú.',
  },
  {
    name: 'Trường THPT Hà Huy Tập',
    type: 'PUBLIC',
    address: 'Khu phố Nhị Đồng 2, Phường Dĩ An, TP. Dĩ An, Tỉnh Bình Dương',
    district: 'Dĩ An',
    latitude: 10.9069,
    longitude: 106.7869,
    description: 'Trường THPT công lập trực thuộc Sở GD&ĐT TP.HCM nằm trên địa bàn TP. Dĩ An, Bình Dương.',
  },
  {
    name: 'Trường THPT Võ Nguyên Giáp',
    type: 'PUBLIC',
    address: 'Khu dân cư 8A, đường Võ Nguyên Giáp, Phường Phú Mỹ, Quận 7, TP. Hồ Chí Minh',
    district: 'Phú Mỹ',
    latitude: 10.7161,
    longitude: 106.7350,
    description: 'Trường THPT công lập mới thành lập năm 2026 tại Quận 7.',
  }
]

const NEW_CUTOFFS: Record<string, { NV1: number; NV2: number; NV3: number }> = {
  'Trường Tiểu học, THCS và THPT Lê Thị Riêng': { NV1: 16.25, NV2: 16.75, NV3: 17.25 },
  'Trường THPT Phan Văn Hớn': { NV1: 16.00, NV2: 16.50, NV3: 17.25 },
  'Trường THPT Thoại Ngọc Hầu': { NV1: 16.25, NV2: 17.25, NV3: 18.25 },
  'Trường THPT Hà Huy Tập': { NV1: 16.50, NV2: 17.00, NV3: 17.75 },
  'Trường THPT Võ Nguyên Giáp': { NV1: 9.00, NV2: 9.00, NV3: 9.00 }
}

async function run() {
  console.log('🚀 Running database update and insertions...\n')

  // 1. Insert 5 new schools
  for (const s of NEW_SCHOOLS) {
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('name', s.name)
      .single()

    let schoolId: string

    if (!existing) {
      const { data: inserted, error: insertErr } = await supabase
        .from('schools')
        .insert(s)
        .select()
        .single()

      if (insertErr) {
        console.error(`❌ Failed to insert school "${s.name}":`, insertErr.message)
        continue
      }
      schoolId = inserted.id
      console.log(`✅ Inserted school "${s.name}" with ID: ${schoolId}`)
    } else {
      schoolId = existing.id
      console.log(`ℹ️  School "${s.name}" already exists. ID: ${schoolId}`)
    }

    // Insert "Thường" program for the school
    const { data: existingProg } = await supabase
      .from('programs')
      .select('id')
      .eq('school_id', schoolId)
      .eq('name', 'Thường')
      .single()

    let programId: string

    if (!existingProg) {
      const { data: insertedProg, error: insertProgErr } = await supabase
        .from('programs')
        .insert({ school_id: schoolId, name: 'Thường', type: 'NORMAL' })
        .select()
        .single()

      if (insertProgErr) {
        console.error(`❌ Failed to insert program "Thường" for "${s.name}":`, insertProgErr.message)
        continue
      }
      programId = insertedProg.id
      console.log(`   ✅ Created "Thường" program with ID: ${programId}`)
    } else {
      programId = existingProg.id
      console.log(`   ℹ️  Program "Thường" already exists. ID: ${programId}`)
    }

    // Insert NV1, NV2, NV3 cutoffs for 2026
    const cutoffs = NEW_CUTOFFS[s.name]
    if (cutoffs) {
      // NV1
      const { error: err1 } = await supabase
        .from('cutoffs')
        .upsert({ program_id: programId, year: 2026, cutoff_score: cutoffs.NV1 }, { onConflict: 'program_id,year' })
      if (err1) console.error(`      ❌ Failed to insert NV1:`, err1.message)
      else console.log(`      ✅ Seeded 2026 NV1 cutoff: ${cutoffs.NV1}`)
      
      // NV2 and NV3 scores can be stored/documented or handled by extension if the database supports NV columns.
      // Wait, let's check: does the `cutoffs` table support NV2 and NV3, or does it only have a single `cutoff_score`?
      // In the table schema (001_initial_schema.sql):
      // public.cutoffs has program_id, year, cutoff_score. Unique on (program_id, year).
      // So the DB only stores a single cutoff score (which is NV1)!
      // Ah! That is correct, the platform's cutoffs table only stores the NV1 score.
    }
  }

  // 2. Clean up "Xuân Hòa" (Quận 3 schools wrongly set to Quận 10)
  const xuanHoaSchools = [
    { name: 'THPT Lê Quý Đôn', address: '110 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, TP. Hồ Chí Minh' },
    { name: 'THPT Lê Thị Hồng Gấm', address: '147 Võ Thị Sáu, Phường Võ Thị Sáu, TP. Hồ Chí Minh' },
    { name: 'THPT Marie Curie', address: '159 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, TP. Hồ Chí Minh' },
    { name: 'THPT Nguyễn Thị Diệu', address: '12 Trần Quốc Toản, Phường Võ Thị Sáu, TP. Hồ Chí Minh' },
    { name: 'THPT Nguyễn Thị Minh Khai', address: '275 Điện Biên Phủ, Phường Võ Thị Sáu, TP. Hồ Chí Minh' }
  ]

  console.log('\n🧹 Correcting "Xuân Hòa" (Quận 3) schools ward and address in DB...')
  for (const s of xuanHoaSchools) {
    const { error: updateErr } = await supabase
      .from('schools')
      .update({
        district: 'Võ Thị Sáu',
        address: s.address
      })
      .eq('name', s.name)

    if (updateErr) {
      console.error(`❌ Failed to update "${s.name}":`, updateErr.message)
    } else {
      console.log(`✅ Updated "${s.name}" to Phường Võ Thị Sáu, Quận 3`)
    }
  }

  // 3. Clean up "THPT Nguyễn Trung Trực" (An Hội Đông in Quận 12 -> Phường 15 in Quận Gò Vấp)
  console.log('\n🧹 Correcting "THPT Nguyễn Trung Trực" ward and address in DB...')
  const { error: updateNTTErr } = await supabase
    .from('schools')
    .update({
      district: 'Phường 15',
      address: '746 Lê Đức Thọ, Phường 15, Quận Gò Vấp, TP. Hồ Chí Minh'
    })
    .eq('name', 'THPT Nguyễn Trung Trực')

  if (updateNTTErr) {
    console.error('❌ Failed to update THPT Nguyễn Trung Trực:', updateNTTErr.message)
  } else {
    console.log('✅ Updated "THPT Nguyễn Trung Trực" to Phường 15, Quận Gò Vấp')
  }

  console.log('\n🎉 Finished DB insertions and corrections!')
}

run().catch(console.error)
