'use client'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Loader2, Calculator } from 'lucide-react'
import { useState } from 'react'
import type { StudentInput } from '@/types'

const GIFTED_SUBJECTS = [
  'Chuyên Anh',
  'Chuyên Địa',
  'Chuyên Hóa',
  'Chuyên Lý',
  'Chuyên Nhật',
  'Chuyên Pháp',
  'Chuyên Sinh',
  'Chuyên Sử',
  'Chuyên Tin',
  'Chuyên Toán',
  'Chuyên Trung',
  'Chuyên Văn',
]

const scoreField = z.string().min(1, 'Bắt buộc')
const optionalScore = z.string().optional()

const schema = z.object({
  score_math:       scoreField,
  score_literature: scoreField,
  score_english:    scoreField,
  gifted_subject:   z.string().optional(),
  gifted_score:     optionalScore,
  integrated_score: optionalScore,
})

type FormValues = z.infer<typeof schema>

function parseScore(s: string | undefined): number | undefined {
  if (!s || s.trim() === '') return undefined
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

function formatTotal(n: number | undefined): string {
  return n !== undefined ? n.toFixed(2) : '—'
}

interface Props {
  onSubmit: (input: StudentInput) => void
  isLoading: boolean
}

export function RecommendationForm({ onSubmit, isLoading }: Props) {
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const watched = useWatch({ control })
  const math   = parseScore(watched.score_math)
  const lit    = parseScore(watched.score_literature)
  const eng    = parseScore(watched.score_english)
  const gifted = parseScore(watched.gifted_score)
  const integ  = parseScore(watched.integrated_score)
  const hasGiftedSubject = !!watched.gifted_subject

  const baseTotal = (math !== undefined && lit !== undefined && eng !== undefined)
    ? math + lit + eng : undefined

  const specializedTotal = baseTotal !== undefined && hasGiftedSubject && gifted !== undefined
    ? baseTotal + 2 * gifted : undefined

  const integratedTotal = baseTotal !== undefined && integ !== undefined
    ? baseTotal + 2 * integ : undefined

  function detectLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => setLocating(false)
    )
  }

  function submit(values: FormValues) {
    const m = parseScore(values.score_math)
    const l = parseScore(values.score_literature)
    const e = parseScore(values.score_english)
    if (m === undefined || l === undefined || e === undefined) return
    onSubmit({
      score_math: m,
      score_literature: l,
      score_english: e,
      gifted_subject: values.gifted_subject || undefined,
      gifted_score: parseScore(values.gifted_score),
      integrated_score: parseScore(values.integrated_score),
      lat: location?.lat,
      lng: location?.lng,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Nhập điểm thi</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-5">

          {/* 3 mandatory subjects */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3 môn bắt buộc</p>
            {([
              { field: 'score_math'       as const, label: 'Toán' },
              { field: 'score_literature' as const, label: 'Ngữ văn' },
              { field: 'score_english'    as const, label: 'Ngoại ngữ' },
            ] as const).map(({ field, label }) => (
              <div key={field} className="flex items-center gap-3">
                <Label className="w-20 shrink-0 text-sm">{label}</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  placeholder="0 – 10"
                  className="h-9"
                  {...register(field)}
                />
                {errors[field] && (
                  <span className="text-xs text-destructive whitespace-nowrap">
                    {errors[field]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Môn chuyên */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Môn chuyên (×2) — tuỳ chọn</p>

            {/* Subject selector */}
            <div className="flex items-center gap-3">
              <Label className="w-20 shrink-0 text-sm">Môn chuyên</Label>
              <Select onValueChange={(v: string) => setValue('gifted_subject', v === '__none__' ? '' : v)}>
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue placeholder="Chọn môn…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Không thi chuyên —</SelectItem>
                  {GIFTED_SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Score — only shown when a subject is chosen */}
            {hasGiftedSubject && (
              <div className="flex items-center gap-3">
                <Label className="w-20 shrink-0 text-sm text-muted-foreground">Điểm</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  placeholder="0 – 10"
                  className="h-9 flex-1"
                  {...register('gifted_score')}
                />
              </div>
            )}
          </div>

          {/* Tích hợp */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tích hợp (×2) — tuỳ chọn</p>
            <div className="flex items-center gap-3">
              <Label className="w-20 shrink-0 text-sm">Tích hợp</Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                max="10"
                placeholder="0 – 10"
                className="h-9 flex-1"
                {...register('integrated_score')}
              />
            </div>
          </div>

          {/* Live total preview */}
          {baseTotal !== undefined && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted/60 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                  <Calculator className="h-3.5 w-3.5" />
                  Tổng điểm dự kiến
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đại trà (max 30)</span>
                  <span className="font-mono font-semibold">{formatTotal(baseTotal)}</span>
                </div>
                {specializedTotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Chuyên {watched.gifted_subject} (max 50)
                    </span>
                    <span className="font-mono font-semibold text-primary">{formatTotal(specializedTotal)}</span>
                  </div>
                )}
                {integratedTotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tích hợp (max 50)</span>
                    <span className="font-mono font-semibold text-primary">{formatTotal(integratedTotal)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Vị trí (để tính khoảng cách)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={detectLocation}
              disabled={locating}
            >
              {locating
                ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                : <MapPin className="mr-2 h-3.5 w-3.5" />}
              {location
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : 'Dùng vị trí hiện tại'}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tìm trường phù hợp
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
