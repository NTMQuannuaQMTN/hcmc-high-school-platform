'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { StudentInput } from '@/types'

const schema = z.object({
  entrance_score: z.string().min(1),
  specialized_score: z.string().optional(),
  integrated_score: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSubmit: (input: StudentInput) => void
  isLoading: boolean
}

export function RecommendationForm({ onSubmit, isLoading }: Props) {
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function detectLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  function submit(values: FormValues) {
    const entranceScore = parseFloat(values.entrance_score)
    if (isNaN(entranceScore)) return
    onSubmit({
      entrance_score: entranceScore,
      specialized_score: values.specialized_score ? parseFloat(values.specialized_score) : undefined,
      integrated_score: values.integrated_score ? parseFloat(values.integrated_score) : undefined,
      lat: location?.lat,
      lng: location?.lng,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhập điểm thi của bạn</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="entrance_score">
              Điểm thi vào lớp 10 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="entrance_score"
              type="number"
              step="0.01"
              placeholder="VD: 8.25"
              {...register('entrance_score')}
            />
            {errors.entrance_score && (
              <p className="text-sm text-destructive">{errors.entrance_score.message}</p>
            )}
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="specialized_score">Điểm thi Chuyên (tuỳ chọn)</Label>
              <Input
                id="specialized_score"
                type="number"
                step="0.01"
                placeholder="VD: 7.50"
                {...register('specialized_score')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="integrated_score">Điểm Tích hợp (tuỳ chọn)</Label>
              <Input
                id="integrated_score"
                type="number"
                step="0.01"
                placeholder="VD: 8.00"
                {...register('integrated_score')}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Vị trí của bạn (tuỳ chọn — để tính khoảng cách)</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={detectLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {location ? `Đã xác định vị trí (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Dùng vị trí hiện tại'}
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
