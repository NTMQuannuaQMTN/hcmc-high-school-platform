'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div
      className={cn('flex gap-0.5', readonly ? 'cursor-default' : 'cursor-pointer')}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          aria-label={`${star} sao`}
          className={cn(
            'transition-all duration-100 disabled:pointer-events-none',
            sizes[size],
          )}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                'transition-colors duration-100',
                star <= active
                  ? 'fill-amber-400 stroke-amber-400'
                  : 'fill-muted stroke-muted-foreground/30',
              )}
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

export function StarDisplay({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={Math.round(rating)} readonly size="sm" />
      <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count} đánh giá)</span>
      )}
    </div>
  )
}
