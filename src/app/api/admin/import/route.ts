import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isAuthorized(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

/*
  Expected CSV format (type=cutoffs):
  school_name,program_name,program_type,year,cutoff_score

  Expected CSV format (type=reviews):
  school_name,source,content
*/
export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, rows } = body as { type: 'cutoffs' | 'reviews'; rows: Record<string, string>[] }
  const supabase = createServiceClient()

  if (type === 'cutoffs') {
    const errors: string[] = []
    let imported = 0
    for (const row of rows) {
      const { school_name, program_name, program_type, year, cutoff_score } = row
      const { data: school } = await supabase
        .from('schools').select('id').eq('name', school_name).single()
      if (!school) { errors.push(`School not found: ${school_name}`); continue }

      let { data: program } = await supabase
        .from('programs').select('id').eq('school_id', school.id).eq('name', program_name).single()

      if (!program) {
        const { data: np } = await supabase
          .from('programs')
          .insert({ school_id: school.id, name: program_name, type: program_type ?? 'NORMAL' })
          .select().single()
        program = np
      }

      if (!program) { errors.push(`Could not create program: ${program_name}`); continue }

      await supabase.from('cutoffs').upsert(
        { program_id: program.id, year: Number(year), cutoff_score: Number(cutoff_score) },
        { onConflict: 'program_id,year' }
      )
      imported++
    }
    return NextResponse.json({ imported, errors })
  }

  if (type === 'reviews') {
    const errors: string[] = []
    let imported = 0
    for (const row of rows) {
      const { school_name, source, content } = row
      const { data: school } = await supabase
        .from('schools').select('id').eq('name', school_name).single()
      if (!school) { errors.push(`School not found: ${school_name}`); continue }
      await supabase.from('reviews').insert({ school_id: school.id, source, content })
      imported++
    }
    return NextResponse.json({ imported, errors })
  }

  return NextResponse.json({ error: 'Unknown import type' }, { status: 400 })
}
