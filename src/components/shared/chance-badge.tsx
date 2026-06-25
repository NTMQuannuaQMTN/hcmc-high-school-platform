import { Badge } from '@/components/ui/badge'
import { cn, CHANCE_LABELS, CHANCE_COLORS } from '@/lib/utils'
import type { AdmissionChance } from '@/types'

export function ChanceBadge({ chance }: { chance: AdmissionChance }) {
  return (
    <Badge variant="outline" className={cn('font-medium', CHANCE_COLORS[chance])}>
      {CHANCE_LABELS[chance]}
    </Badge>
  )
}
