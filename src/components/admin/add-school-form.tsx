'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

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
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

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
        <div className="space-y-1.5">
          <Label>Vĩ độ</Label>
          <Input type="number" step="any" placeholder="VD: 10.8019" {...register('latitude')} />
        </div>
        <div className="space-y-1.5">
          <Label>Kinh độ</Label>
          <Input type="number" step="any" placeholder="VD: 106.7167" {...register('longitude')} />
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
