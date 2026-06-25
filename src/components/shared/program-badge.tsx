import { Badge } from '@/components/ui/badge'
import { PROGRAM_TYPE_LABELS } from '@/lib/utils'
import type { ProgramType } from '@/types'

const colors: Record<ProgramType, string> = {
  SPECIALIZED: 'bg-purple-100 text-purple-800 border-purple-200',
  INTEGRATED: 'bg-blue-100 text-blue-800 border-blue-200',
  NORMAL: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function ProgramBadge({ type }: { type: ProgramType }) {
  return (
    <Badge variant="outline" className={colors[type]}>
      {PROGRAM_TYPE_LABELS[type]}
    </Badge>
  )
}
