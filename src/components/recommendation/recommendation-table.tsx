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
import { ExternalLink, MapPin } from 'lucide-react'
import type { RecommendationResult, AdmissionChance } from '@/types'

interface Props {
  results: RecommendationResult[]
}

export function RecommendationTable({ results }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AdmissionChance | 'ALL'>('ALL')

  const filtered = results.filter((r) => {
    const matchSearch =
      r.school_name.toLowerCase().includes(search.toLowerCase()) ||
      r.program_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || r.chance === filter
    return matchSearch && matchFilter
  })

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
          {filtered.length} kết quả
        </span>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trường</TableHead>
              <TableHead>Ban</TableHead>
              <TableHead className="text-right">Điểm chuẩn {results[0]?.latest_year}</TableHead>
              <TableHead className="text-right">Chênh lệch</TableHead>
              <TableHead>Xác suất</TableHead>
              <TableHead className="text-right">Khoảng cách</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
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
            {filtered.length === 0 && (
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
