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

  // Extra bottom margin when legend wraps across many programs
  const legendRows = Math.ceil(programs.length / 3)
  const bottomMargin = 8 + legendRows * 22

  return (
    <ResponsiveContainer width="100%" height={300 + (legendRows > 2 ? (legendRows - 2) * 22 : 0)}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} width={42} />
        <Tooltip
          wrapperStyle={{ zIndex: 50 }}
          contentStyle={{
            fontSize: 13,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
            padding: '8px 12px',
          }}
          formatter={(val) => (typeof val === 'number' ? val.toFixed(2) : val)}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
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
