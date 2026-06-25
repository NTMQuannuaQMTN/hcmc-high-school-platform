'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSchools } from '@/hooks/use-schools'

const schema = z.object({
  school_id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['SPECIALIZED', 'INTEGRATED', 'NORMAL']),
})

type FormValues = z.infer<typeof schema>

export function AddProgramForm({ secret }: { secret: string }) {
  const [loading, setLoading] = useState(false)
  const { data: schools } = useSchools()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const res = await fetch('/api/admin/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(values),
    })
    setLoading(false)
    if (res.ok) { toast.success('Đã thêm ban học!'); reset() }
    else { const e = await res.json(); toast.error(e.error ?? 'Lỗi') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Trường *</Label>
          <Select onValueChange={(v: string) => setValue('school_id', v)}>
            <SelectTrigger><SelectValue placeholder="Chọn trường" /></SelectTrigger>
            <SelectContent>
              {schools?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.school_id && <p className="text-xs text-destructive">Bắt buộc</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Tên ban *</Label>
          <Input {...register('name')} placeholder="VD: Ban tự nhiên" />
        </div>
        <div className="space-y-1.5">
          <Label>Loại *</Label>
          <Select onValueChange={(v: string) => setValue('type', v as 'SPECIALIZED' | 'INTEGRATED' | 'NORMAL')}>
            <SelectTrigger><SelectValue placeholder="Loại ban" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SPECIALIZED">Chuyên</SelectItem>
              <SelectItem value="INTEGRATED">Tích hợp</SelectItem>
              <SelectItem value="NORMAL">Đại trà</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Thêm ban học
      </Button>
    </form>
  )
}
