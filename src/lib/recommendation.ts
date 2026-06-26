import type { AdmissionChance, ProgramType, RecommendationResult, ProgramLatestCutoff, StudentInput } from '@/types'

export function getChance(scoreDifference: number): AdmissionChance {
  if (scoreDifference >= 1.5) return 'HIGH'
  if (scoreDifference >= 0) return 'MEDIUM'
  return 'LOW'
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Returns true when a SPECIALIZED program name matches the student's chosen gifted subject.
// "Chuyên Anh" must not match programs that contain "đề án" / "5695", and vice-versa.
function programMatchesSubject(programName: string, subject: string): boolean {
  const name = programName.toLowerCase()
  const sub = subject.toLowerCase()
  if (!name.includes(sub)) return false
  // If the selected subject doesn't mention "đề án", reject programs that do
  if (!sub.includes('đề án') && !sub.includes('5695')) {
    if (name.includes('đề án') || name.includes('5695')) return false
  }
  return true
}

// Total = toan + van + ngoai_ngu  (+ 2× bonus for non-NORMAL programs)
export function computeTotal(type: ProgramType, input: StudentInput): number {
  const base = input.score_math + input.score_literature + input.score_english
  if (type === 'SPECIALIZED' && input.gifted_score !== undefined) {
    return base + 2 * input.gifted_score
  }
  if (type === 'INTEGRATED' && input.integrated_score !== undefined) {
    return base + 2 * input.integrated_score
  }
  return base
}

export function computeRecommendations(
  programs: ProgramLatestCutoff[],
  input: StudentInput,
): RecommendationResult[] {
  const { lat: homeLat, lng: homeLng } = input
  return programs
    .filter((p) => {
      // Exclude SPECIALIZED programs when no subject is chosen, or when the subject doesn't match
      if (p.program_type === 'SPECIALIZED') {
        if (!input.gifted_subject) return false
        return programMatchesSubject(p.program_name, input.gifted_subject)
      }
      // Exclude INTEGRATED programs when no integrated score is provided
      if (p.program_type === 'INTEGRATED' && input.integrated_score === undefined) return false
      return true
    })
    .map((p) => {
      const score = computeTotal(p.program_type, input)
      const diff = score - p.latest_cutoff
      const distance =
        homeLat && homeLng && p.latitude && p.longitude
          ? Math.round(haversineKm(homeLat, homeLng, p.latitude, p.longitude) * 10) / 10
          : null
      return {
        program_id: p.program_id,
        program_name: p.program_name,
        program_type: p.program_type,
        school_id: p.school_id,
        school_name: p.school_name,
        school_type: p.school_type,
        address: p.address,
        district: p.district,
        latitude: p.latitude,
        longitude: p.longitude,
        latest_year: p.latest_year,
        latest_cutoff: p.latest_cutoff,
        score_difference: Math.round(diff * 100) / 100,
        chance: getChance(diff),
        distance_km: distance,
      } satisfies RecommendationResult
    })
    .sort((a, b) => b.score_difference - a.score_difference)
}
