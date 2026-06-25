'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { Program, Cutoff } from '@/types'
import { CHART_COLORS } from '@/lib/utils'

interface Props {
  programs: (Program & { cutoffs: Cutoff[] })[]
}

export function CutoffChart({ programs }: Props) {
  const years = Array.from(
    new Set(programs.flatMap((p) => p.cutoffs.map((c) => c.year)))
  ).sort()

  const data = years.map((year) => {
    const row: Record<string, number | string> = { year: String(year) }
    programs.forEach((p) => {
      const c = p.cutoffs.find((cu) => cu.year === year)
      if (c) row[p.name] = Number(c.cutoff_score)
    })
    return row
  })

  if (data.length === 0) return (
    <p className="text-muted-foreground text-sm">Chưa có dữ liệu điểm chuẩn.</p>
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ fontSize: 13 }}
          formatter={(val) => (typeof val === 'number' ? val.toFixed(2) : val)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {programs.map((p, i) => (
          <Line
            key={p.id}
            type="monotone"
            dataKey={p.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
