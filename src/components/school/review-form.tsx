'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from './star-rating'
import { PenLine, CheckCircle2, GraduationCap, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReviewerRole } from '@/types'

interface Props {
  schoolId: string
}

const ROLES: { value: ReviewerRole; label: string; icon: React.ReactNode }[] = [
  { value: 'student', label: 'Học sinh', icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'parent',  label: 'Phụ huynh', icon: <Users className="h-4 w-4" /> },
  { value: 'other',   label: 'Khác', icon: <User className="h-4 w-4" /> },
]

export function ReviewForm({ schoolId }: Props) {
  const [rating, setRating] = useState(0)
  const [role, setRole] = useState<ReviewerRole | null>(null)
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [ratingError, setRatingError] = useState(false)
  const [roleError, setRoleError] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/schools/${schoolId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          content,
          reviewer_role: role,
          author_name: authorName.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let valid = true
    if (rating === 0) { setRatingError(true); valid = false }
    if (!role) { setRoleError(true); valid = false }
    if (!valid) return
    setRatingError(false)
    setRoleError(false)
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="font-semibold text-foreground">Cảm ơn bạn đã đánh giá!</p>
          <p className="text-sm text-muted-foreground">Đánh giá của bạn đã được ghi nhận.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { mutation.reset(); setRating(0); setRole(null); setContent(''); setAuthorName('') }}
          >
            Viết thêm đánh giá
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4" />
          Viết đánh giá
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role picker */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Bạn là <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); setRoleError(false) }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                    role === r.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
                  )}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>
            {roleError && <p className="text-xs text-destructive">Vui lòng chọn bạn là ai.</p>}
          </div>

          {/* Star rating */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Xếp hạng <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <StarRating
                value={rating}
                onChange={(v) => { setRating(v); setRatingError(false) }}
                size="lg"
              />
              <span className="text-sm text-muted-foreground">
                {rating === 0 && 'Chọn số sao'}
                {rating === 1 && 'Rất tệ'}
                {rating === 2 && 'Tệ'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Tốt'}
                {rating === 5 && 'Xuất sắc'}
              </span>
            </div>
            {ratingError && <p className="text-xs text-destructive">Vui lòng chọn số sao.</p>}
          </div>

          {/* Review text */}
          <div className="space-y-1.5">
            <Label htmlFor="review-content" className="text-sm font-medium">
              Nội dung đánh giá <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review-content"
              placeholder="Chia sẻ trải nghiệm của bạn về trường: cơ sở vật chất, giáo viên, môi trường học tập..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              minLength={10}
              maxLength={2000}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{content.length}/2000</p>
          </div>

          {/* Author name (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="review-author" className="text-sm font-medium">
              Tên (tuỳ chọn)
            </Label>
            <Input
              id="review-author"
              placeholder="Ẩn danh"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={100}
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive">Có lỗi xảy ra. Vui lòng thử lại.</p>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending || content.trim().length < 10}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
