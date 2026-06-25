'use client'
import { useQuery } from '@tanstack/react-query'
import type { School, SchoolWithPrograms } from '@/types'

export function useSchools() {
  return useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await fetch('/api/schools')
      if (!res.ok) throw new Error('Failed to fetch schools')
      return res.json()
    },
  })
}

export function useSchool(id: string) {
  return useQuery<SchoolWithPrograms>({
    queryKey: ['school', id],
    queryFn: async () => {
      const res = await fetch(`/api/schools/${id}`)
      if (!res.ok) throw new Error('Failed to fetch school')
      return res.json()
    },
    enabled: !!id,
  })
}
