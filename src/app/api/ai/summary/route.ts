import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get('school_id')
  if (!schoolId) return NextResponse.json({ error: 'Missing school_id' }, { status: 400 })

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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `Bạn là trợ lý phân tích đánh giá trường học. Phân tích các đánh giá sau và trả về JSON với 3 mảng:
- "pros": điểm mạnh (tối đa 5 mục)
- "cons": điểm yếu (tối đa 5 mục)
- "student_opinions": ý kiến nổi bật của học sinh/phụ huynh (tối đa 5 mục)

Mỗi mục là 1 câu ngắn gọn bằng tiếng Việt. Chỉ trả về JSON thuần, không có markdown.

Các đánh giá:
${reviewText}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  })

  const raw = response.text ?? '{}'
  const parsed = JSON.parse(raw)

  return NextResponse.json({
    pros: parsed.pros ?? [],
    cons: parsed.cons ?? [],
    student_opinions: parsed.student_opinions ?? [],
  })
}
