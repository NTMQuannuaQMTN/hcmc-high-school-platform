import type { AdmissionChance, ProgramType, RecommendationResult, ProgramLatestCutoff } from '@/types'

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

function scoreForProgramType(type: ProgramType, entrance: number, specialized?: number, integrated?: number): number {
  if (type === 'SPECIALIZED' && specialized !== undefined) return specialized
  if (type === 'INTEGRATED' && integrated !== undefined) return integrated
  return entrance
}

export function computeRecommendations(
  programs: ProgramLatestCutoff[],
  entrance: number,
  specialized: number | undefined,
  integrated: number | undefined,
  homeLat: number | undefined,
  homeLng: number | undefined
): RecommendationResult[] {
  return programs
    .map((p) => {
      const score = scoreForProgramType(p.program_type, entrance, specialized, integrated)
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
