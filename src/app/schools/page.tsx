'use client'
import Link from 'next/link'
import { useSchools } from '@/hooks/use-schools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProgramBadge } from '@/components/shared/program-badge'
import { MapPin, Search, Map } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProgramType } from '@/types'
import { getActualDistrict } from '@/lib/utils'

export default function SchoolsPage() {
  const { data: schools, isLoading } = useSchools()
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('ALL')
  const [ward, setWard] = useState('ALL')

  const actualDistricts = useMemo(() => {
    if (!schools) return []
    return Array.from(new Set(schools.map((s) => getActualDistrict(s.district)))).sort()
  }, [schools])

  const availableWards = useMemo(() => {
    if (!schools) return []
    const filteredWards = schools
      .filter((s) => district === 'ALL' || getActualDistrict(s.district) === district)
      .map((s) => s.district)
    return Array.from(new Set(filteredWards)).sort()
  }, [schools, district])

  const handleDistrictChange = (value: string) => {
    setDistrict(value)
    setWard('ALL')
  }

  const filtered = (schools ?? []).filter((s) => {
    const actDist = getActualDistrict(s.district)
    
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase()) ||
      s.district.toLowerCase().includes(search.toLowerCase()) ||
      actDist.toLowerCase().includes(search.toLowerCase())
      
    const matchDistrict = district === 'ALL' || actDist === district
    const matchWard = ward === 'ALL' || s.district === ward
    
    return matchSearch && matchDistrict && matchWard
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Danh sách trường THPT công lập</h1>
        <p className="text-muted-foreground mt-1">Tất cả trường THPT công lập tại TP.HCM</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Search className="h-3 w-3" /> Tìm kiếm
          </span>
          <Input
            placeholder="Tên trường, địa chỉ..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full bg-background"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Quận / Huyện
          </span>
          <Select value={district} onValueChange={handleDistrictChange}>
            <SelectTrigger className="w-48 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả quận huyện</SelectItem>
              {actualDistricts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Map className="h-3 w-3" /> Khu vực / Phường
          </span>
          <Select value={ward} onValueChange={setWard}>
            <SelectTrigger className="w-48 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả khu vực</SelectItem>
              {availableWards.map((w) => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm font-semibold text-primary pb-2.5 px-2">
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
              <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {school.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/75" />
                    <span className="line-clamp-2">{school.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline" className="text-[11px] font-medium border-violet-100 bg-violet-50/50 text-violet-700 dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-violet-300">
                      {getActualDistrict(school.district)}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      Khu vực: {school.district}
                    </Badge>
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
        <div className="border rounded-xl py-16 text-center text-muted-foreground bg-card/30">
          Không tìm thấy trường nào phù hợp với bộ lọc.
        </div>
      )}
    </div>
  )
}

