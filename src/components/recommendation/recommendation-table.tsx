'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChanceBadge } from '@/components/shared/chance-badge'
import { ProgramBadge } from '@/components/shared/program-badge'
import { ExternalLink, MapPin, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { RecommendationResult, AdmissionChance } from '@/types'
import { cn } from '@/lib/utils'

type SortKey = 'score_difference' | 'latest_cutoff' | 'distance_km'
type SortDir = 'asc' | 'desc'

const DEFAULT_SORT: Record<SortKey, SortDir> = {
  score_difference: 'desc',
  latest_cutoff: 'desc',
  distance_km: 'asc',
}

function sortRows(rows: RecommendationResult[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    // nulls always last
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

interface Props {
  results: RecommendationResult[]
}

export function RecommendationTable({ results }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AdmissionChance | 'ALL'>('ALL')
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
    const matchFilter = filter === 'ALL' || r.chance === filter
    return matchSearch && matchFilter
  })

  const sorted = sortRows(filtered, sortKey, sortDir)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Tìm trường hoặc ban..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filter} onValueChange={(v) => setFilter(v as AdmissionChance | 'ALL')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Lọc xác suất" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="HIGH">Cao</SelectItem>
            <SelectItem value="MEDIUM">Trung bình</SelectItem>
            <SelectItem value="LOW">Thấp</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">
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
                label={`Điểm chuẩn ${results[0]?.latest_year ?? ''}`}
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
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.program_id}>
                <TableCell>
                  <div className="font-medium">{r.school_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.district}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{r.program_name}</span>
                    <ProgramBadge type={r.program_type} />
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {r.latest_cutoff.toFixed(2)}
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
                <TableCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/schools/${r.school_id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
