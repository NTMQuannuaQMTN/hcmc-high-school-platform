'use client'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2, LocateFixed } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  district: z.string().min(1),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function AddSchoolForm({ secret }: { secret: string }) {
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const watchedAddress = useWatch({ control, name: 'address' })
  const watchedDistrict = useWatch({ control, name: 'district' })

  async function geocode() {
    if (!watchedAddress) { toast.error('Nhập địa chỉ trước'); return }
    setGeocoding(true)
    const params = new URLSearchParams({ address: watchedAddress })
    if (watchedDistrict) params.set('district', watchedDistrict)
    const res = await fetch(`/api/admin/geocode?${params}`, {
      headers: { 'x-admin-secret': secret },
    })
    setGeocoding(false)
    if (!res.ok) {
      const e = await res.json()
      toast.error(e.error ?? 'Không lấy được tọa độ')
      return
    }
    const { lat, lng, display_name } = await res.json()
    setValue('latitude', String(lat))
    setValue('longitude', String(lng))
    toast.success(`Đã lấy tọa độ: ${display_name.slice(0, 60)}…`)
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const body = {
      ...values,
      type: 'PUBLIC',
      latitude: values.latitude ? parseFloat(values.latitude) : null,
      longitude: values.longitude ? parseFloat(values.longitude) : null,
      website: values.website || null,
      description: values.description || null,
    }
    const res = await fetch('/api/admin/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (res.ok) { toast.success('Đã thêm trường!'); reset() }
    else { const e = await res.json(); toast.error(e.error ?? 'Lỗi') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Tên trường *</Label>
          <Input {...register('name')} placeholder="VD: THPT Lê Quý Đôn" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Địa chỉ *</Label>
          <Input {...register('address')} placeholder="VD: 110 Đinh Tiên Hoàng" />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Quận/Huyện *</Label>
          <Input {...register('district')} placeholder="VD: Quận Bình Thạnh" />
          {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Tọa độ (vĩ độ / kinh độ)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={geocode}
              disabled={geocoding || !watchedAddress}
              className="h-7 text-xs gap-1.5"
            >
              {geocoding
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <LocateFixed className="h-3.5 w-3.5" />}
              Lấy tọa độ tự động
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" step="any" placeholder="Vĩ độ (10.xxx)" {...register('latitude')} />
            <Input type="number" step="any" placeholder="Kinh độ (106.xxx)" {...register('longitude')} />
          </div>
          <p className="text-xs text-muted-foreground">Điền địa chỉ + quận rồi nhấn "Lấy tọa độ tự động" — dùng OpenStreetMap, miễn phí.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Website</Label>
          <Input type="url" placeholder="https://..." {...register('website')} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Mô tả</Label>
          <Textarea rows={3} {...register('description')} />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Thêm trường
      </Button>
    </form>
  )
}
