import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRecommendations, generateOptimalWishes } from '@/lib/recommendation'
import type { StudentInput, RecommendationResponse } from '@/types'

function validScore(v: unknown): v is number {
  return typeof v === 'number' && v >= 0 && v <= 10
}

export async function POST(req: Request) {
  const body: StudentInput = await req.json()
  const { 
    score_math, 
    score_literature, 
    score_english, 
    gifted_score, 
    integrated_score,
    target_year,
    strategy,
    generate_wishes 
  } = body

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

  // Fetch the latest cutoffs per program
  const { data: latestCutoffs, error: latestErr } = await supabase.from('program_latest_cutoff').select('*')
  if (latestErr) return NextResponse.json({ error: latestErr.message }, { status: 500 })

  // Fetch all historical cutoffs (needed for prediction or optimal wish generation)
  let allCutoffs: any[] | undefined = undefined
  const needsHistory = (target_year && target_year > 2026) || generate_wishes
  
  if (needsHistory) {
    const { data, error } = await supabase
      .from('cutoffs')
      .select('program_id, year, cutoff_score')
      .order('year', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    allCutoffs = data
  }

  const results = computeRecommendations(latestCutoffs, body, allCutoffs)
  
  const response: RecommendationResponse = {
    results,
    wishes: generate_wishes ? generateOptimalWishes(results) : null
  }

  return NextResponse.json(response)
}
