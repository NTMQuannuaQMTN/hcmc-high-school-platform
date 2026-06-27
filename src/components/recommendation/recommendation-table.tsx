'use client'
import Link from 'next/link'
import { useState } from 'react'
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
}

export function RecommendationTable({ results }: Props) {
  const [search, setSearch] = useState('')
  const [chanceFilter, setChanceFilter] = useState<AdmissionChance | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('score_difference')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(DEFAULT_SORT[key])
    }
  }

  const filtered = results.filter((r) => {
    const matchSearch =
      r.school_name.toLowerCase().includes(search.toLowerCase()) ||
      r.program_name.toLowerCase().includes(search.toLowerCase())
    const matchChance = chanceFilter === 'ALL' || r.chance === chanceFilter
    const matchType =
      typeFilter === 'ALL' ||
      (typeFilter === 'SPECIALIZED' && r.program_type === 'SPECIALIZED') ||
      (typeFilter === 'INTEGRATED' && r.program_type === 'INTEGRATED') ||
      (typeFilter === 'NORMAL' && r.program_type === 'NORMAL')
    return matchSearch && matchChance && matchType
  })

  const sorted = sortRows(filtered, sortKey, sortDir)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Tìm kiếm</span>
          <Input
            placeholder="Tên trường hoặc ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
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
        <span className="text-sm text-muted-foreground pb-0.5">
          {sorted.length} kết quả
        </span>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trường</TableHead>
              <TableHead>Ban</TableHead>
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
              <TableHead>Xác suất</TableHead>
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
              <TableRow key={r.program_id}>
                <TableCell>
                  <Link
                    href={`/schools/${r.school_id}`}
                    className="group inline-flex flex-col gap-0.5"
                  >
                    <span className="font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                      {r.school_name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {r.district}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{r.program_name}</span>
                    <ProgramBadge type={r.program_type} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-xs text-muted-foreground">{r.latest_year}</div>
                  <div className="font-mono font-semibold">{r.latest_cutoff.toFixed(2)}</div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={r.score_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {r.score_difference > 0 ? '+' : ''}{r.score_difference.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <ChanceBadge chance={r.chance} />
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.distance_km != null ? `${r.distance_km} km` : '—'}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Không tìm thấy kết quả phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
