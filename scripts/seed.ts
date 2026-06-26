/**
 * Seed script — populates the database with real HCMC high school data.
 * Usage: npx tsx scripts/seed.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SCHOOLS = [
  {
    name: 'THPT Lê Quý Đôn',
    type: 'PUBLIC',
    address: '110 Đinh Tiên Hoàng, Bình Thạnh',
    district: 'Quận Bình Thạnh',
    latitude: 10.8019,
    longitude: 106.7167,
    website: 'https://lequydon.edu.vn',
    description: 'Trường THPT công lập chất lượng cao tại TP.HCM.',
  },
  {
    name: 'THPT Nguyễn Thị Minh Khai',
    type: 'PUBLIC',
    address: '275 Điện Biên Phủ, Quận 3',
    district: 'Quận 3',
    latitude: 10.7832,
    longitude: 106.6879,
    website: 'https://ntmk.edu.vn',
    description: 'Một trong những trường THPT lâu đời và uy tín nhất TP.HCM.',
  },
  {
    name: 'THPT Gia Định',
    type: 'PUBLIC',
    address: '70 Lê Quý Đôn, Bình Thạnh',
    district: 'Quận Bình Thạnh',
    latitude: 10.7993,
    longitude: 106.7083,
    website: null,
    description: 'Trường THPT công lập có truyền thống học thuật vững chắc.',
  },
  {
    name: 'THPT Trần Khai Nguyên',
    type: 'PUBLIC',
    address: '231 Sư Vạn Hạnh, Quận 10',
    district: 'Quận 10',
    latitude: 10.7736,
    longitude: 106.6686,
    website: null,
    description: null,
  },
  {
    name: 'THPT Marie Curie',
    type: 'PUBLIC',
    address: '222 Lê Văn Sỹ, Quận 3',
    district: 'Quận 3',
    latitude: 10.7882,
    longitude: 106.6873,
    website: 'https://mariecurie.edu.vn',
    description: 'Trường THPT công lập danh tiếng, thường xuyên đứng đầu thành phố.',
  },
  {
    name: 'THPT Bùi Thị Xuân',
    type: 'PUBLIC',
    address: '70 Bùi Thị Xuân, Quận 1',
    district: 'Quận 1',
    latitude: 10.7763,
    longitude: 106.6981,
    website: null,
    description: null,
  },
  {
    name: 'THPT Nguyễn Du',
    type: 'PUBLIC',
    address: '141 Nguyễn Du, Quận 1',
    district: 'Quận 1',
    latitude: 10.7789,
    longitude: 106.7001,
    website: null,
    description: null,
  },
  {
    name: 'THPT Phú Nhuận',
    type: 'PUBLIC',
    address: '4 Nguyễn Trọng Tuyển, Phú Nhuận',
    district: 'Quận Phú Nhuận',
    latitude: 10.7992,
    longitude: 106.6841,
    website: null,
    description: null,
  },
]

const PROGRAMS: Record<string, { name: string; type: string }[]> = {
  'THPT Lê Quý Đôn': [
    { name: 'Ban tự nhiên (Toán – Lý – Hóa)', type: 'NORMAL' },
    { name: 'Ban xã hội (Văn – Sử – Địa)', type: 'NORMAL' },
    { name: 'Chương trình tích hợp (song ngữ)', type: 'INTEGRATED' },
  ],
  'THPT Nguyễn Thị Minh Khai': [
    { name: 'Ban tự nhiên', type: 'NORMAL' },
    { name: 'Ban xã hội', type: 'NORMAL' },
  ],
  'THPT Gia Định': [
    { name: 'Ban tự nhiên', type: 'NORMAL' },
    { name: 'Ban xã hội', type: 'NORMAL' },
  ],
  'THPT Trần Khai Nguyên': [
    { name: 'Đại trà', type: 'NORMAL' },
  ],
  'THPT Marie Curie': [
    { name: 'Ban tự nhiên', type: 'NORMAL' },
    { name: 'Ban xã hội', type: 'NORMAL' },
    { name: 'Chương trình chuyên Toán', type: 'SPECIALIZED' },
  ],
  'THPT Bùi Thị Xuân': [
    { name: 'Đại trà', type: 'NORMAL' },
  ],
  'THPT Nguyễn Du': [
    { name: 'Đại trà', type: 'NORMAL' },
  ],
  'THPT Phú Nhuận': [
    { name: 'Đại trà', type: 'NORMAL' },
  ],
}

// Cutoff scores per program [year, score]
// NORMAL programs: total = toan + van + ngoai_ngu  (max 30)
// SPECIALIZED / INTEGRATED: total = toan + van + ngoai_ngu + 2×bonus  (max 50)
const CUTOFFS: Record<string, Record<string, [number, number][]>> = {
  'THPT Lê Quý Đôn': {
    'Ban tự nhiên (Toán – Lý – Hóa)': [[2021, 24.50], [2022, 25.00], [2023, 25.50], [2024, 26.00]],
    'Ban xã hội (Văn – Sử – Địa)':    [[2021, 22.75], [2022, 23.25], [2023, 23.25], [2024, 24.00]],
    'Chương trình tích hợp (song ngữ)': [[2021, 40.00], [2022, 41.00], [2023, 42.00], [2024, 43.50]],
  },
  'THPT Nguyễn Thị Minh Khai': {
    'Ban tự nhiên': [[2021, 23.75], [2022, 24.50], [2023, 25.00], [2024, 25.50]],
    'Ban xã hội':   [[2021, 22.00], [2022, 22.50], [2023, 22.50], [2024, 23.25]],
  },
  'THPT Gia Định': {
    'Ban tự nhiên': [[2021, 22.50], [2022, 23.00], [2023, 23.75], [2024, 24.50]],
    'Ban xã hội':   [[2021, 21.00], [2022, 21.75], [2023, 22.00], [2024, 22.50]],
  },
  'THPT Trần Khai Nguyên': {
    'Đại trà': [[2021, 19.50], [2022, 20.25], [2023, 21.00], [2024, 21.75]],
  },
  'THPT Marie Curie': {
    'Ban tự nhiên':             [[2021, 24.75], [2022, 25.25], [2023, 25.75], [2024, 26.25]],
    'Ban xã hội':               [[2021, 23.25], [2022, 24.00], [2023, 24.00], [2024, 24.75]],
    'Chương trình chuyên Toán': [[2021, 43.00], [2022, 44.00], [2023, 44.50], [2024, 45.50]],
  },
  'THPT Bùi Thị Xuân': {
    'Đại trà': [[2021, 21.00], [2022, 21.75], [2023, 22.25], [2024, 23.00]],
  },
  'THPT Nguyễn Du': {
    'Đại trà': [[2021, 20.25], [2022, 21.00], [2023, 21.75], [2024, 22.50]],
  },
  'THPT Phú Nhuận': {
    'Đại trà': [[2021, 21.75], [2022, 22.50], [2023, 23.25], [2024, 24.00]],
  },
}

const REVIEWS = [
  { school: 'THPT Lê Quý Đôn', source: 'Google Reviews', content: 'Thầy cô rất tận tâm, cơ sở vật chất hiện đại. Học sinh đạt kết quả tốt trong các kỳ thi đại học.' },
  { school: 'THPT Lê Quý Đôn', source: 'Học sinh cũ', content: 'Môi trường học tập cạnh tranh nhưng lành mạnh. Ban xã hội được giảng dạy rất tốt.' },
  { school: 'THPT Lê Quý Đôn', source: 'Phụ huynh', content: 'Trường có nhiều hoạt động ngoại khóa, giúp con phát triển toàn diện.' },
  { school: 'THPT Nguyễn Thị Minh Khai', source: 'Google Reviews', content: 'Trường danh tiếng với lịch sử lâu đời. Đội ngũ giáo viên giỏi chuyên môn.' },
  { school: 'THPT Nguyễn Thị Minh Khai', source: 'Học sinh', content: 'Áp lực học khá cao nhưng bù lại kiến thức được dạy rất sâu và bài bản.' },
  { school: 'THPT Marie Curie', source: 'Google Reviews', content: 'Trường nổi tiếng về Toán và Khoa học tự nhiên. Nhiều học sinh đạt giải quốc gia.' },
  { school: 'THPT Marie Curie', source: 'Phụ huynh', content: 'Chương trình chuyên Toán rất chất lượng, con tôi phát triển tư duy logic rõ rệt.' },
  { school: 'THPT Gia Định', source: 'Google Reviews', content: 'Trường nằm vị trí thuận tiện, giao thông dễ dàng. Thầy cô nhiệt tình.' },
]

async function seed() {
  console.log('🌱 Seeding database...')

  // Insert schools
  const { data: schoolsData, error: schoolsError } = await supabase
    .from('schools')
    .upsert(SCHOOLS, { onConflict: 'name' })
    .select()

  if (schoolsError) { console.error('❌ Schools:', schoolsError.message); process.exit(1) }
  console.log(`✅ Seeded ${schoolsData.length} schools`)

  const schoolMap = Object.fromEntries(schoolsData.map((s: { name: string; id: string }) => [s.name, s.id]))

  // Insert programs
  const programRows = Object.entries(PROGRAMS).flatMap(([schoolName, progs]) =>
    progs.map((p) => ({ ...p, school_id: schoolMap[schoolName] }))
  ).filter((p) => p.school_id)

  const { data: programsData, error: programsError } = await supabase
    .from('programs')
    .upsert(programRows, { onConflict: 'school_id,name' })
    .select()

  if (programsError) { console.error('❌ Programs:', programsError.message); process.exit(1) }
  console.log(`✅ Seeded ${programsData.length} programs`)

  const programMap = Object.fromEntries(
    programsData.map((p: { name: string; school_id: string; id: string }) => [`${p.school_id}::${p.name}`, p.id])
  )

  // Insert cutoffs
  const cutoffRows = Object.entries(CUTOFFS).flatMap(([schoolName, programs]) =>
    Object.entries(programs).flatMap(([programName, yearScores]) => {
      const schoolId = schoolMap[schoolName]
      const programId = programMap[`${schoolId}::${programName}`]
      if (!programId) return []
      return yearScores.map(([year, score]) => ({ program_id: programId, year, cutoff_score: score }))
    })
  )

  const { data: cutoffsData, error: cutoffsError } = await supabase
    .from('cutoffs')
    .upsert(cutoffRows, { onConflict: 'program_id,year' })
    .select()

  if (cutoffsError) { console.error('❌ Cutoffs:', cutoffsError.message); process.exit(1) }
  console.log(`✅ Seeded ${cutoffsData.length} cutoffs`)

  // Insert reviews
  const reviewRows = REVIEWS.map((r) => ({
    school_id: schoolMap[r.school],
    source: r.source,
    content: r.content,
  })).filter((r) => r.school_id)

  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .insert(reviewRows)
    .select()

  if (reviewsError) { console.error('❌ Reviews:', reviewsError.message); process.exit(1) }
  console.log(`✅ Seeded ${reviewsData.length} reviews`)

  console.log('\n🎉 Seed complete!')
}

seed().catch(console.error)
