'use client'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ThumbsUp, ThumbsDown, MessageSquare, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { AISummary } from '@/types'

interface Props {
  schoolId: string
  reviewCount: number
}

export function AISummaryCard({ schoolId, reviewCount }: Props) {
  const [enabled, setEnabled] = useState(false)

  const { data, isLoading, isError } = useQuery<AISummary>({
    queryKey: ['ai-summary', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/summary?school_id=${schoolId}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  })

  if (reviewCount === 0) return null

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Tóm tắt đánh giá bằng AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {reviewCount} đánh giá từ học sinh và phụ huynh. AI sẽ tóm tắt ưu nhược điểm.
          </p>
          <Button variant="outline" size="sm" onClick={() => setEnabled(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Xem tóm tắt AI
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang phân tích đánh giá...
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-destructive">
          Không thể tải tóm tắt AI. Vui lòng thử lại sau.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Tóm tắt đánh giá bằng AI
          <Badge variant="outline" className="text-xs font-normal">Gemini 2.5 Flash</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.pros.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-green-700 mb-2">
              <ThumbsUp className="h-4 w-4" />
              Điểm mạnh
            </div>
            <ul className="space-y-1">
              {data.pros.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-green-500 mt-0.5">•</span> {p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.cons.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-red-700 mb-2">
              <ThumbsDown className="h-4 w-4" />
              Điểm yếu
            </div>
            <ul className="space-y-1">
              {data.cons.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-red-400 mt-0.5">•</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.student_opinions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-blue-700 mb-2">
              <MessageSquare className="h-4 w-4" />
              Ý kiến học sinh
            </div>
            <ul className="space-y-1">
              {data.student_opinions.map((o, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-blue-400 mt-0.5">•</span> {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
