import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRecommendations } from '@/lib/recommendation'
import type { StudentInput } from '@/types'

function validScore(v: unknown): v is number {
  return typeof v === 'number' && v >= 0 && v <= 10
}

export async function POST(req: Request) {
  const body: StudentInput = await req.json()
  const { score_math, score_literature, score_english, gifted_score, integrated_score } = body

  if (!validScore(score_math) || !validScore(score_literature) || !validScore(score_english)) {
    return NextResponse.json({ error: 'Scores must be numbers between 0 and 10' }, { status: 400 })
  }
  if (gifted_score !== undefined && !validScore(gifted_score)) {
    return NextResponse.json({ error: 'Invalid gifted score' }, { status: 400 })
  }
  if (integrated_score !== undefined && !validScore(integrated_score)) {
    return NextResponse.json({ error: 'Invalid integrated score' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('program_latest_cutoff').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = computeRecommendations(data, body)
  return NextResponse.json(results)
}
