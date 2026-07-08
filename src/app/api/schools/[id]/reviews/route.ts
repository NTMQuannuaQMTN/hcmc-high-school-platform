import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(2000),
  reviewer_role: z.enum(['student', 'parent', 'other']),
  author_name: z.string().max(100).optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      school_id: id,
      source: 'user',
      rating: parsed.data.rating,
      content: parsed.data.content,
      reviewer_role: parsed.data.reviewer_role,
      author_name: parsed.data.author_name ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
