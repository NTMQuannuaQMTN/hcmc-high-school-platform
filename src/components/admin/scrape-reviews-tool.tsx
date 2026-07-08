'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  secret: string
}

export function ScrapeReviewsTool({ secret }: Props) {
  const [schoolId, setSchoolId] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [inserted, setInserted] = useState(0)
  const [message, setMessage] = useState('')

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/scrape-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ school_id: schoolId.trim(), school_name: schoolName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setMessage(json.error ?? 'Lỗi không xác định'); setStatus('error'); return }
      setInserted(json.inserted)
      setMessage(json.message ?? '')
      setStatus('done')
    } catch {
      setMessage('Không thể kết nối máy chủ')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleScrape} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tìm kiếm đánh giá về trường trên web (DuckDuckGo) và lưu vào cơ sở dữ liệu.
        Nhập UUID của trường (lấy từ URL trang chi tiết) và tên đầy đủ.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scrape-id">UUID trường</Label>
          <Input
            id="scrape-id"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scrape-name">Tên trường</Label>
          <Input
            id="scrape-name"
            placeholder="THPT Trưng Vương"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={status === 'loading'} variant="outline">
        {status === 'loading' ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tìm kiếm (~5 giây)...</>
        ) : (
          <><Globe className="mr-2 h-4 w-4" />Scrape đánh giá</>
        )}
      </Button>

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {inserted > 0 ? `Đã thêm ${inserted} đánh giá từ web.` : (message || 'Không tìm thấy đánh giá phù hợp.')}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
    </form>
  )
}
