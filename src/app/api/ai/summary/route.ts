import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get('school_id')
  if (!schoolId) return NextResponse.json({ error: 'Missing school_id' }, { status: 400 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('content, source')
    .eq('school_id', schoolId)
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ pros: [], cons: [], student_opinions: [] })
  }

  const reviewText = reviews.map((r, i) => `${i + 1}. [${r.source ?? 'Ẩn danh'}] ${r.content}`).join('\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Bạn là trợ lý phân tích đánh giá trường học. Phân tích các đánh giá sau và trả về JSON với 3 mảng: "pros" (điểm mạnh), "cons" (điểm yếu), "student_opinions" (ý kiến nổi bật của học sinh). Mỗi mảng tối đa 5 mục, mỗi mục là 1 câu ngắn gọn bằng tiếng Việt.',
      },
      { role: 'user', content: reviewText },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600,
  })

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  return NextResponse.json({
    pros: parsed.pros ?? [],
    cons: parsed.cons ?? [],
    student_opinions: parsed.student_opinions ?? [],
  })
}
