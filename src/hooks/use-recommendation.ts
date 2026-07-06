'use client'
import { useMutation } from '@tanstack/react-query'
import type { RecommendationResponse, StudentInput } from '@/types'

export function useRecommendation() {
  return useMutation<RecommendationResponse, Error, StudentInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Failed to get recommendations')
      return res.json()
    },
  })
}
