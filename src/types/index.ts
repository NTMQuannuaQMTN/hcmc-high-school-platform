export type SchoolType = 'PUBLIC'
export type ProgramType = 'SPECIALIZED' | 'INTEGRATED' | 'NORMAL'
export type AdmissionChance = 'HIGH' | 'MEDIUM' | 'LOW'

export interface School {
  id: string
  name: string
  type: SchoolType
  address: string
  district: string
  latitude: number | null
  longitude: number | null
  website: string | null
  description: string | null
  created_at: string
}

export interface Program {
  id: string
  school_id: string
  name: string
  type: ProgramType
  created_at: string
}

export interface Cutoff {
  id: string
  program_id: string
  year: number
  cutoff_score: number
  created_at: string
}

export interface Review {
  id: string
  school_id: string
  source: string | null
  content: string
  created_at: string
}

export interface ProgramLatestCutoff {
  program_id: string
  school_id: string
  program_name: string
  program_type: ProgramType
  school_name: string
  school_type: SchoolType
  address: string
  district: string
  latitude: number | null
  longitude: number | null
  website: string | null
  latest_year: number
  latest_cutoff: number
}

export interface SchoolWithPrograms extends School {
  programs: (Program & { cutoffs: Cutoff[] })[]
  reviews: Review[]
}

export interface RecommendationResult {
  program_id: string
  program_name: string
  program_type: ProgramType
  school_id: string
  school_name: string
  school_type: SchoolType
  address: string
  district: string
  latitude: number | null
  longitude: number | null
  latest_year: number
  latest_cutoff: number
  score_difference: number
  chance: AdmissionChance
  distance_km: number | null
}

export interface StudentInput {
  entrance_score: number
  specialized_score?: number
  integrated_score?: number
  lat?: number
  lng?: number
}

export interface AISummary {
  pros: string[]
  cons: string[]
  student_opinions: string[]
}
