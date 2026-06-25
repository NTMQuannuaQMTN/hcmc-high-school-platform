'use client'
import Link from 'next/link'
import { useSchools } from '@/hooks/use-schools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function SchoolsPage() {
  const { data: schools, isLoading } = useSchools()
  const [search, setSearch] = useState('')

  const filtered = (schools ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.district.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Danh sách trường THPT công lập</h1>
        <p className="text-muted-foreground mt-1">Tất cả trường THPT công lập tại TP.HCM</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm trường, quận..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} trường
        </span>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((school) => (
          <Link key={school.id} href={`/schools/${school.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                  {school.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{school.address}</span>
                </div>
                <Badge variant="outline" className="text-xs">{school.district}</Badge>
                {school.website && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{school.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
