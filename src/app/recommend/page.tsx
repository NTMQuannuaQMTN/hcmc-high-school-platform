'use client'
import { useState } from 'react'
import { RecommendationForm } from '@/components/recommendation/recommendation-form'
import { RecommendationTable } from '@/components/recommendation/recommendation-table'
import { useRecommendation } from '@/hooks/use-recommendation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { RecommendationResult } from '@/types'

export default function RecommendPage() {
  const [results, setResults] = useState<RecommendationResult[] | null>(null)
  const mutation = useRecommendation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tư vấn tuyển sinh</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Nhập điểm thi để xem các trường và ban học phù hợp với bạn.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-20">
          <RecommendationForm
            onSubmit={(input) => mutation.mutate(input, { onSuccess: setResults })}
            isLoading={mutation.isPending}
          />
        </div>

        <div className="min-w-0">
          {mutation.isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>Có lỗi xảy ra. Vui lòng thử lại.</AlertDescription>
            </Alert>
          )}

          {mutation.isPending && (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tìm kiếm...
            </div>
          )}

          {!mutation.isPending && results === null && (
            <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">
              <p className="text-base">Nhập điểm bên trái</p>
              <p className="text-sm mt-1">để xem danh sách trường gợi ý</p>
            </div>
          )}

          {!mutation.isPending && results !== null && (
            <RecommendationTable results={results} />
          )}
        </div>
      </div>
    </div>
  )
}
