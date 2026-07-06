'use client'
import Link from 'next/link'
import { useState, useMemo } from 'react'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChanceBadge } from '@/components/shared/chance-badge'
import { ProgramBadge } from '@/components/shared/program-badge'
import { ExternalLink, MapPin, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { RecommendationResult, AdmissionChance } from '@/types'
import { cn } from '@/lib/utils'

type SortKey = 'score_difference' | 'latest_cutoff' | 'distance_km'
type SortDir = 'asc' | 'desc'
type TypeFilter = 'ALL' | 'SPECIALIZED' | 'INTEGRATED' | 'NORMAL'

const DEFAULT_SORT: Record<SortKey, SortDir> = {
  score_difference: 'desc',
  latest_cutoff: 'desc',
  distance_km: 'asc',
}

function sortRows(rows: RecommendationResult[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    return dir === 'asc' ? av - bv : bv - av
  })
}

interface SortHeaderProps {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  align?: 'left' | 'right'
  onClick: (key: SortKey) => void
}

function SortHeader({ label, sortKey, active, dir, align = 'right', onClick }: SortHeaderProps) {
  const isActive = active === sortKey
  const Icon = isActive ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        onClick={() => onClick(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground transition-colors',
          align === 'right' ? 'ml-auto flex-row-reverse' : '',
          isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
        )}
      >
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'opacity-100' : 'opacity-40')} />
        {label}
      </button>
    </TableHead>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  onValueChange,
  options,
  width = 'w-36',
}: {
  label: string
  value: T
  onValueChange: (v: T) => void
  options: { value: T; label: string }[]
  width?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={width}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface Props {
  results: RecommendationResult[]
  regularWishes?: {
    nv1: RecommendationResult | null
    nv2: RecommendationResult | null
    nv3: RecommendationResult | null
  } | null
  specializedWishes?: {
    nv1: RecommendationResult | null
    nv2: RecommendationResult | null
  } | null
}

import { getActualDistrict } from '@/lib/utils'

export function RecommendationTable({ results, regularWishes, specializedWishes }: Props) {
  const [search, setSearch] = useState('')
  const [chanceFilter, setChanceFilter] = useState<AdmissionChance | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [districtFilter, setDistrictFilter] = useState('ALL')
  const [wardFilter, setWardFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('score_difference')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const actualDistricts = useMemo(() => {
    return Array.from(new Set(results.map((r) => getActualDistrict(r.district)))).sort()
  }, [results])

  const availableWards = useMemo(() => {
    const filteredWards = results
      .filter((r) => districtFilter === 'ALL' || getActualDistrict(r.district) === districtFilter)
      .map((r) => r.district)
    return Array.from(new Set(filteredWards)).sort()
  }, [results, districtFilter])

  const handleDistrictChange = (value: string) => {
    setDistrictFilter(value)
    setWardFilter('ALL')
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(DEFAULT_SORT[key])
    }
  }

  const filtered = results.filter((r) => {
    const actDist = getActualDistrict(r.district)
    
    const matchSearch =
      r.school_name.toLowerCase().includes(search.toLowerCase()) ||
      r.program_name.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
      
    const matchChance = chanceFilter === 'ALL' || r.chance === chanceFilter
    const matchType =
      typeFilter === 'ALL' ||
      (typeFilter === 'SPECIALIZED' && r.program_type === 'SPECIALIZED') ||
      (typeFilter === 'INTEGRATED' && r.program_type === 'INTEGRATED') ||
      (typeFilter === 'NORMAL' && r.program_type === 'NORMAL')
      
    const matchDistrict = districtFilter === 'ALL' || actDist === districtFilter
    const matchWard = wardFilter === 'ALL' || r.district === wardFilter
    
    return matchSearch && matchChance && matchType && matchDistrict && matchWard
  })

  const sorted = sortRows(filtered, sortKey, sortDir)

  return (
    <div className="space-y-6">
      {/* 1. REGULAR WISHES BOARD */}
      {regularWishes && (regularWishes.nv1 || regularWishes.nv2 || regularWishes.nv3) && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            🎯 3 Nguyện vọng thường khuyên dùng
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* NV1 */}
            {regularWishes.nv1 && (
              <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-violet-500 text-white font-mono text-[9px] font-bold rounded-bl-lg tracking-wider">
                  NV1 • ĐỘT PHÁ
                </div>
                <div className="space-y-1.5">
                  <Link href={`/schools/${regularWishes.nv1.school_id}`} className="font-bold hover:text-primary transition-colors text-sm line-clamp-1 block pr-12">
                    {regularWishes.nv1.school_name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {getActualDistrict(regularWishes.nv1.district)} ({regularWishes.nv1.district})
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                      {regularWishes.nv1.program_name}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Điểm chuẩn {regularWishes.nv1.latest_year}</span>
                    <span className="font-mono font-extrabold text-base text-foreground leading-none">{regularWishes.nv1.latest_cutoff.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Chênh lệch</span>
                    <span className={cn(
                      "font-mono font-extrabold text-sm",
                      regularWishes.nv1.score_difference >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {regularWishes.nv1.score_difference > 0 ? "+" : ""}{regularWishes.nv1.score_difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <ChanceBadge chance={regularWishes.nv1.chance} />
                  {regularWishes.nv1.distance_km != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      📍 {regularWishes.nv1.distance_km} km
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* NV2 */}
            {regularWishes.nv2 && (
              <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-white font-mono text-[9px] font-bold rounded-bl-lg tracking-wider">
                  NV2 • VỪA TẦM
                </div>
                <div className="space-y-1.5">
                  <Link href={`/schools/${regularWishes.nv2.school_id}`} className="font-bold hover:text-primary transition-colors text-sm line-clamp-1 block pr-12">
                    {regularWishes.nv2.school_name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {getActualDistrict(regularWishes.nv2.district)} ({regularWishes.nv2.district})
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      {regularWishes.nv2.program_name}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Điểm chuẩn {regularWishes.nv2.latest_year}</span>
                    <span className="font-mono font-extrabold text-base text-foreground leading-none">{regularWishes.nv2.latest_cutoff.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Chênh lệch</span>
                    <span className={cn(
                      "font-mono font-extrabold text-sm",
                      regularWishes.nv2.score_difference >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {regularWishes.nv2.score_difference > 0 ? "+" : ""}{regularWishes.nv2.score_difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <ChanceBadge chance={regularWishes.nv2.chance} />
                  {regularWishes.nv2.distance_km != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      📍 {regularWishes.nv2.distance_km} km
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* NV3 */}
            {regularWishes.nv3 && (
              <div className="relative overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-sky-500 text-white font-mono text-[9px] font-bold rounded-bl-lg tracking-wider">
                  NV3 • AN TOÀN
                </div>
                <div className="space-y-1.5">
                  <Link href={`/schools/${regularWishes.nv3.school_id}`} className="font-bold hover:text-primary transition-colors text-sm line-clamp-1 block pr-12">
                    {regularWishes.nv3.school_name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {getActualDistrict(regularWishes.nv3.district)} ({regularWishes.nv3.district})
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                      {regularWishes.nv3.program_name}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Điểm chuẩn {regularWishes.nv3.latest_year}</span>
                    <span className="font-mono font-extrabold text-base text-foreground leading-none">{regularWishes.nv3.latest_cutoff.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Chênh lệch</span>
                    <span className={cn(
                      "font-mono font-extrabold text-sm",
                      regularWishes.nv3.score_difference >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {regularWishes.nv3.score_difference > 0 ? "+" : ""}{regularWishes.nv3.score_difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <ChanceBadge chance={regularWishes.nv3.chance} />
                  {regularWishes.nv3.distance_km != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      📍 {regularWishes.nv3.distance_km} km
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SPECIALIZED WISHES BOARD */}
      {specializedWishes && (specializedWishes.nv1 || specializedWishes.nv2) && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            ✨ 2 Nguyện vọng chuyên / tích hợp khuyên dùng
          </h3>
          <div className="grid md:grid-cols-2 max-w-4xl gap-4">
            {/* NV1 Chuyên */}
            {specializedWishes.nv1 && (
              <div className="relative overflow-hidden rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-bl-lg tracking-wider">
                  NV1 CHUYÊN • ĐỘT PHÁ
                </div>
                <div className="space-y-1.5">
                  <Link href={`/schools/${specializedWishes.nv1.school_id}`} className="font-bold hover:text-primary transition-colors text-sm line-clamp-1 block pr-12">
                    {specializedWishes.nv1.school_name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {getActualDistrict(specializedWishes.nv1.district)} ({specializedWishes.nv1.district})
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                      {specializedWishes.nv1.program_name}
                    </span>
                    <ProgramBadge type={specializedWishes.nv1.program_type} />
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Điểm chuẩn {specializedWishes.nv1.latest_year}</span>
                    <span className="font-mono font-extrabold text-base text-foreground leading-none">{specializedWishes.nv1.latest_cutoff.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Chênh lệch</span>
                    <span className={cn(
                      "font-mono font-extrabold text-sm",
                      specializedWishes.nv1.score_difference >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {specializedWishes.nv1.score_difference > 0 ? "+" : ""}{specializedWishes.nv1.score_difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <ChanceBadge chance={specializedWishes.nv1.chance} />
                  {specializedWishes.nv1.distance_km != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      📍 {specializedWishes.nv1.distance_km} km
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* NV2 Chuyên */}
            {specializedWishes.nv2 && (
              <div className="relative overflow-hidden rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-pink-500 text-white font-mono text-[9px] font-bold rounded-bl-lg tracking-wider">
                  NV2 CHUYÊN • AN TOÀN
                </div>
                <div className="space-y-1.5">
                  <Link href={`/schools/${specializedWishes.nv2.school_id}`} className="font-bold hover:text-primary transition-colors text-sm line-clamp-1 block pr-12">
                    {specializedWishes.nv2.school_name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {getActualDistrict(specializedWishes.nv2.district)} ({specializedWishes.nv2.district})
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                      {specializedWishes.nv2.program_name}
                    </span>
                    <ProgramBadge type={specializedWishes.nv2.program_type} />
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Điểm chuẩn {specializedWishes.nv2.latest_year}</span>
                    <span className="font-mono font-extrabold text-base text-foreground leading-none">{specializedWishes.nv2.latest_cutoff.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block leading-none mb-0.5">Chênh lệch</span>
                    <span className={cn(
                      "font-mono font-extrabold text-sm",
                      specializedWishes.nv2.score_difference >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {specializedWishes.nv2.score_difference > 0 ? "+" : ""}{specializedWishes.nv2.score_difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <ChanceBadge chance={specializedWishes.nv2.chance} />
                  {specializedWishes.nv2.distance_km != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      📍 {specializedWishes.nv2.distance_km} km
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <span className="text-xs text-muted-foreground font-medium">Tìm kiếm</span>
          <Input
            placeholder="Tên trường hoặc ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background"
          />
        </div>
        <FilterSelect
          label="Loại ban"
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: 'ALL', label: 'Tất cả' },
            { value: 'SPECIALIZED', label: 'Chuyên' },
            { value: 'INTEGRATED', label: 'Tích hợp' },
            { value: 'NORMAL', label: 'Thường' },
          ]}
        />
        <FilterSelect
          label="Xác suất"
          value={chanceFilter}
          onValueChange={setChanceFilter}
          width="w-40"
          options={[
            { value: 'ALL', label: 'Tất cả' },
            { value: 'HIGH', label: 'Cao' },
            { value: 'MEDIUM', label: 'Trung bình' },
            { value: 'LOW', label: 'Thấp' },
          ]}
        />
        <FilterSelect
          label="Quận / Huyện"
          value={districtFilter}
          onValueChange={handleDistrictChange}
          width="w-44"
          options={[
            { value: 'ALL', label: 'Tất cả quận' },
            ...actualDistricts.map((d) => ({ value: d, label: d })),
          ]}
        />
        <FilterSelect
          label="Khu vực"
          value={wardFilter}
          onValueChange={setWardFilter}
          width="w-44"
          options={[
            { value: 'ALL', label: 'Tất cả khu vực' },
            ...availableWards.map((w) => ({ value: w, label: w })),
          ]}
        />
        <span className="text-sm font-semibold text-primary pb-2.5 px-2 ml-auto">
          {sorted.length} kết quả
        </span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="py-3">Trường</TableHead>
                <TableHead className="py-3">Ban</TableHead>
                <SortHeader
                  label="Điểm chuẩn"
                  sortKey="latest_cutoff"
                  active={sortKey}
                  dir={sortDir}
                  onClick={handleSort}
                />
                <SortHeader
                  label="Chênh lệch"
                  sortKey="score_difference"
                  active={sortKey}
                  dir={sortDir}
                  onClick={handleSort}
                />
                <TableHead className="py-3">Xác suất</TableHead>
                <SortHeader
                  label="Khoảng cách"
                  sortKey="distance_km"
                  active={sortKey}
                  dir={sortDir}
                  onClick={handleSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.program_id} className="hover:bg-muted/30">
                  <TableCell className="py-3.5">
                    <Link
                      href={`/schools/${r.school_id}`}
                      className="group inline-flex flex-col gap-0.5"
                    >
                      <span className="font-semibold group-hover:text-primary transition-colors flex items-center gap-1">
                        {r.school_name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {getActualDistrict(r.district)} ({r.district})
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-sm font-medium">{r.program_name}</span>
                      <ProgramBadge type={r.program_type} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="text-[10px] text-muted-foreground">{r.latest_year}</div>
                    <div className="font-mono font-bold text-sm">{r.latest_cutoff.toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono py-3.5">
                    <span className={cn(
                      "font-bold text-sm",
                      r.score_difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    )}>
                      {r.score_difference > 0 ? '+' : ''}{r.score_difference.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <ChanceBadge chance={r.chance} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium py-3.5">
                    {r.distance_km != null ? `${r.distance_km} km` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 bg-card/30">
                    Không tìm thấy kết quả phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

