'use client'
import { useState, useRef } from 'react'
import { RecommendationForm } from '@/components/recommendation/recommendation-form'
import { RecommendationTable } from '@/components/recommendation/recommendation-table'
import { useRecommendation } from '@/hooks/use-recommendation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowUp } from 'lucide-react'
import type { RecommendationResponse } from '@/types'

export default function RecommendPage() {
  const [response, setResponse] = useState<RecommendationResponse | null>(null)
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null)
  const mutation = useRecommendation()
  const formRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tư vấn tuyển sinh</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Nhập điểm thi để xem các trường và ban học phù hợp với bạn.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-20" ref={formRef}>
          <RecommendationForm
            onSubmit={(input) => {
              setHomeCoords(input.lat && input.lng ? { lat: input.lat, lng: input.lng } : null)
              mutation.mutate(input, { onSuccess: setResponse })
            }}
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

          {!mutation.isPending && response === null && (
            <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground space-y-2">
              <p className="text-base font-medium text-foreground">Nhập điểm thi để bắt đầu</p>
              <p className="text-sm">Điền 3 môn bắt buộc (Toán · Văn · Ngoại ngữ), sau đó nhấn <strong>Tìm trường phù hợp</strong>.</p>
              <p className="text-xs mt-1">Tùy chọn: thêm điểm môn chuyên để xem trường chuyên, hoặc bật vị trí để sắp xếp theo khoảng cách.</p>
            </div>
          )}

          {!mutation.isPending && response !== null && (
            <RecommendationTable
              results={response.results}
              regularWishes={response.regularWishes}
              specializedWishes={response.specializedWishes}
              integratedWishes={response.integratedWishes}
              home={homeCoords}
              onHomeChange={setHomeCoords}
            />
          )}
        </div>
      </div>

      {(mutation.isPending || response !== null) && (
        <button
          onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="lg:hidden fixed bottom-6 right-5 z-50 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 shadow-lg"
          aria-label="Cuộn lên form"
        >
          <ArrowUp className="h-4 w-4" />
          Nhập lại
        </button>
      )}
    </div>
  )
}
