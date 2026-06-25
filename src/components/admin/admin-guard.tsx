'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

interface Props {
  children: (secret: string) => React.ReactNode
}

export function AdminGuard({ children }: Props) {
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState<string | null>(null)

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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSecret(input)}
          />
          <Button className="w-full" onClick={() => setSecret(input)}>
            Đăng nhập
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
