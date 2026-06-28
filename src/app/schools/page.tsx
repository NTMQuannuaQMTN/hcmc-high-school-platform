'use client'
import Link from 'next/link'
import { useSchools } from '@/hooks/use-schools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProgramBadge } from '@/components/shared/program-badge'
import { MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProgramType } from '@/types'

export default function SchoolsPage() {
  const { data: schools, isLoading } = useSchools()
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('ALL')

  const districts = useMemo(() => {
    if (!schools) return []
    return Array.from(new Set(schools.map((s) => s.district))).sort()
  }, [schools])

  const filtered = (schools ?? []).filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.district.toLowerCase().includes(search.toLowerCase())
    const matchDistrict = district === 'ALL' || s.district === district
    return matchSearch && matchDistrict
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Danh sách trường THPT công lập</h1>
        <p className="text-muted-foreground mt-1">Tất cả trường THPT công lập tại TP.HCM</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Tìm kiếm</span>
          <Input
            placeholder="Tên trường..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Quận / Huyện</span>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground pb-0.5">
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
        {filtered.map((school) => {
          const programTypes = Array.from(
            new Set((school.programs ?? []).map((p) => p.type))
          ) as ProgramType[]

          return (
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
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">{school.district}</Badge>
                    {programTypes.map((t) => (
                      <ProgramBadge key={t} type={t} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="border rounded-xl py-16 text-center text-muted-foreground">
          Không tìm thấy trường nào.
        </div>
      )}
    </div>
  )
}
