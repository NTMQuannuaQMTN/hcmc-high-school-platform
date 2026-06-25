import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRecommendations } from '@/lib/recommendation'
import type { StudentInput } from '@/types'

export async function POST(req: Request) {
  const body: StudentInput = await req.json()
  const { entrance_score, specialized_score, integrated_score, lat, lng } = body

  if (!entrance_score || entrance_score < 0 || entrance_score > 10) {
    return NextResponse.json({ error: 'Invalid entrance score' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('program_latest_cutoff').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = computeRecommendations(
    data,
    entrance_score,
    specialized_score,
    integrated_score,
    lat,
    lng
  )

  return NextResponse.json(results)
}
