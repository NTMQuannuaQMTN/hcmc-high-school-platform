'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface Props {
  children: (secret: string) => React.ReactNode
}

export function AdminGuard({ children }: Props) {
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/geocode?address=test', {
        headers: { 'x-admin-secret': input },
      })
      if (res.status === 401) { setError(true); return }
      setSecret(input)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (secret) return <>{children(secret)}</>

  return (
    <div className="flex justify-center py-20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Xác thực Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="Nhập ADMIN_SECRET"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); setError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {error && <p className="text-xs text-destructive">Sai mật khẩu. Vui lòng thử lại.</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading || !input}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng nhập'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
