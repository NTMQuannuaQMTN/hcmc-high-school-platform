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
import { useQuery } from '@tanstack/react-query'
import type { Program } from '@/types'

const schema = z.object({
  program_id: z.string().uuid(),
  year: z.string().min(4),
  cutoff_score: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function AddCutoffForm({ secret }: { secret: string }) {
  const [loading, setLoading] = useState(false)
  const { data: programs } = useQuery<Program[]>({
    queryKey: ['programs-all'],
    queryFn: async () => {
      const res = await fetch('/api/programs')
      return res.json()
    },
  })
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { year: String(new Date().getFullYear()) },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const payload = {
      program_id: values.program_id,
      year: parseInt(values.year),
      cutoff_score: parseFloat(values.cutoff_score),
    }
    const res = await fetch('/api/admin/cutoffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) { toast.success('Đã lưu điểm chuẩn!'); reset() }
    else { const e = await res.json(); toast.error(e.error ?? 'Lỗi') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Ban học *</Label>
          <Select onValueChange={(v: string) => setValue('program_id', v)}>
            <SelectTrigger><SelectValue placeholder="Chọn ban" /></SelectTrigger>
            <SelectContent>
              {programs?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Năm *</Label>
          <Input type="number" {...register('year')} />
          {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Điểm chuẩn *</Label>
          <Input type="number" step="0.01" {...register('cutoff_score')} />
          {errors.cutoff_score && <p className="text-xs text-destructive">{errors.cutoff_score.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Lưu điểm chuẩn
      </Button>
    </form>
  )
}
