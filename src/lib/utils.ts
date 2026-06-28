import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AdmissionChance, ProgramType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CHANCE_LABELS: Record<AdmissionChance, string> = {
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
}

export const CHANCE_COLORS: Record<AdmissionChance, string> = {
  HIGH: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-red-100 text-red-800 border-red-200',
}

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  SPECIALIZED: 'Chuyên',
  INTEGRATED: 'Tích hợp',
  NORMAL: 'Thường',
}


export const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
