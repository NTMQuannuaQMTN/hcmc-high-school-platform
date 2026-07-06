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

// Predicts next year's cutoff score using a weighted YoY trend, rounded to nearest 0.25
export function predictNextCutoff(
  history: { year: number; score: number }[],
  targetYear: number,
  maxScore: number
): number {
  if (history.length === 0) return 0
  if (history.length === 1) return history[0].score

  // Sort history ascending by year
  const sorted = [...history].sort((a, b) => a.year - b.year)
  const latest = sorted[sorted.length - 1]

  if (targetYear <= latest.year) {
    const found = sorted.find((h) => h.year === targetYear)
    return found ? found.score : latest.score
  }

  // Calculate weighted YoY changes
  let totalDiff = 0
  let weightSum = 0
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].score - sorted[i - 1].score
    const weight = i // Weight recent years higher
    totalDiff += diff * weight
    weightSum += weight
  }

  const avgYoYChange = weightSum > 0 ? totalDiff / weightSum : 0
  const yearsDiff = targetYear - latest.year
  let predicted = latest.score + avgYoYChange * yearsDiff

  // Clamp to realistic bounds
  const minBound = maxScore === 30 ? 5 : 10
  predicted = Math.max(minBound, Math.min(maxScore, predicted))

  // Round to nearest 0.25 (admission scores are multiples of 0.25)
  return Math.round(predicted * 4) / 4
}

// Generate optimal, viable desires/wishes (3 Regular, 2 Specialized/Integrated if qualified)
export function generateOptimalWishes(
  results: RecommendationResult[],
  input: StudentInput
): {
  regularWishes: { nv1: RecommendationResult | null; nv2: RecommendationResult | null; nv3: RecommendationResult | null } | null
  specializedWishes: { nv1: RecommendationResult | null; nv2: RecommendationResult | null } | null
} | null {
  if (results.length === 0) return null

  const prioritizeDistance = input.prioritize_distance === true

  // Helper to compute suitability score for sorting
  const getSuitability = (r: RecommendationResult) => {
    if (prioritizeDistance && r.distance_km !== null) {
      // Penalize suitability score by 0.25 points for every kilometer of distance
      return r.latest_cutoff - r.distance_km * 0.25
    }
    return r.latest_cutoff
  };

  // --- 1. REGULAR WISHES (3 NV) ---
  const hasLocation = input.lat !== undefined && input.lng !== undefined
  let regularCandidates = results.filter((r) => r.program_type === 'NORMAL')
  if (hasLocation) {
    const withinLimit = regularCandidates.filter((r) => r.distance_km !== null && r.distance_km <= 12)
    if (withinLimit.length > 0) {
      regularCandidates = withinLimit
    }
  }
  let regularWishes = null

  if (regularCandidates.length > 0) {
    // NV1: Target / Challenger (score_difference >= -1.5)
    let nv1Pool = regularCandidates.filter((r) => r.score_difference >= -1.5)
    if (nv1Pool.length === 0) nv1Pool = regularCandidates

    const nv1 = [...nv1Pool].sort((a, b) => getSuitability(b) - getSuitability(a))[0] || null

    // NV2: Safer backup (cutoff must be lower than NV1 cutoff by >= 0.75 points, and score_difference >= 0.5)
    let nv2 = null
    if (nv1) {
      let nv2Pool = regularCandidates.filter(
        (r) =>
          r.program_id !== nv1.program_id &&
          r.latest_cutoff <= nv1.latest_cutoff - 0.75 &&
          r.score_difference >= 0.5
      )
      if (nv2Pool.length === 0) {
        nv2Pool = regularCandidates.filter(
          (r) => r.program_id !== nv1.program_id && r.latest_cutoff <= nv1.latest_cutoff - 0.5
        )
      }
      if (nv2Pool.length === 0) {
        nv2Pool = regularCandidates.filter((r) => r.program_id !== nv1.program_id)
      }
      nv2 = [...nv2Pool].sort((a, b) => getSuitability(b) - getSuitability(a))[0] || null
    }

    // NV3: Completely safe backup (cutoff must be lower than NV2 by >= 0.75 points, and score_difference >= 1.5)
    let nv3 = null
    if (nv1) {
      const baseCutoff = nv2 ? nv2.latest_cutoff : nv1.latest_cutoff
      let nv3Pool = regularCandidates.filter(
        (r) =>
          r.program_id !== nv1.program_id &&
          (!nv2 || r.program_id !== nv2.program_id) &&
          r.latest_cutoff <= baseCutoff - 0.75 &&
          r.score_difference >= 1.5
      )
      if (nv3Pool.length === 0) {
        nv3Pool = regularCandidates.filter(
          (r) =>
            r.program_id !== nv1.program_id &&
            (!nv2 || r.program_id !== nv2.program_id) &&
            r.latest_cutoff <= baseCutoff - 0.5
        )
      }
      if (nv3Pool.length === 0) {
        nv3Pool = regularCandidates.filter(
          (r) => r.program_id !== nv1.program_id && (!nv2 || r.program_id !== nv2.program_id)
        )
      }
      nv3 = [...nv3Pool].sort((a, b) => getSuitability(b) - getSuitability(a))[0] || null
    }

    regularWishes = { nv1, nv2, nv3 }
  }

  // --- 2. SPECIALIZED WISHES (2 NV) ---
  // Only recommend specialized/integrated wishes if the student entered gifted details or integrated details
  const hasGifted = input.gifted_subject !== undefined
  const hasIntegrated = input.integrated_score !== undefined
  let specializedWishes = null

  if (hasGifted || hasIntegrated) {
    let specCandidates = results.filter(
      (r) => r.program_type === 'SPECIALIZED' || r.program_type === 'INTEGRATED'
    )
    if (hasLocation) {
      const withinLimit = specCandidates.filter((r) => r.distance_km !== null && r.distance_km <= 12)
      if (withinLimit.length > 0) {
        specCandidates = withinLimit
      }
    }

    if (specCandidates.length > 0) {
      // NV1 Chuyên: Target / Challenger (score_difference >= -1.5)
      let nv1Pool = specCandidates.filter((r) => r.score_difference >= -1.5)
      if (nv1Pool.length === 0) nv1Pool = specCandidates

      const nv1 = [...nv1Pool].sort((a, b) => getSuitability(b) - getSuitability(a))[0] || null

      // NV2 Chuyên: Safer backup (cutoff <= NV1 - 0.75, score_difference >= 0.5)
      let nv2 = null
      if (nv1) {
        let nv2Pool = specCandidates.filter(
          (r) =>
            r.program_id !== nv1.program_id &&
            r.latest_cutoff <= nv1.latest_cutoff - 0.75 &&
            r.score_difference >= 0.5
        )
        if (nv2Pool.length === 0) {
          nv2Pool = specCandidates.filter(
            (r) => r.program_id !== nv1.program_id && r.latest_cutoff <= nv1.latest_cutoff - 0.5
          )
        }
        if (nv2Pool.length === 0) {
          nv2Pool = specCandidates.filter((r) => r.program_id !== nv1.program_id)
        }
        nv2 = [...nv2Pool].sort((a, b) => getSuitability(b) - getSuitability(a))[0] || null
      }

      specializedWishes = { nv1, nv2 }
    }
  }

  return {
    regularWishes,
    specializedWishes,
  }
}

export function computeRecommendations(
  programs: ProgramLatestCutoff[],
  input: StudentInput,
  allCutoffs?: Array<{ program_id: string; year: number; cutoff_score: number }>
): RecommendationResult[] {
  const { lat: homeLat, lng: homeLng } = input
  const targetYear = input.target_year || 2026

  // Group historical cutoffs by program_id
  const cutoffsByProgram = new Map<string, { year: number; score: number }[]>()
  if (allCutoffs) {
    allCutoffs.forEach((c) => {
      if (!cutoffsByProgram.has(c.program_id)) {
        cutoffsByProgram.set(c.program_id, [])
      }
      cutoffsByProgram.get(c.program_id)!.push({ year: c.year, score: c.cutoff_score })
    })
  }

  const results = programs
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
      const maxScore = p.program_type === 'NORMAL' ? 30 : 50
      let cutoff = p.latest_cutoff
      let year = p.latest_year

      // Predict next year's cutoff score if requested and history is available
      if (allCutoffs && targetYear > p.latest_year) {
        const history = cutoffsByProgram.get(p.program_id) || []
        if (history.length > 0) {
          cutoff = predictNextCutoff(history, targetYear, maxScore)
          year = targetYear
        }
      }

      const score = computeTotal(p.program_type, input)
      const diff = score - cutoff
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
        latest_year: year,
        latest_cutoff: cutoff,
        score_difference: Math.round(diff * 100) / 100,
        chance: getChance(diff),
        distance_km: distance,
      } satisfies RecommendationResult
    })

  // Apply strategy filters if requested
  let filtered = results
  if (input.strategy === 'safe') {
    filtered = results.filter((r) => r.score_difference >= -0.5)
  } else if (input.strategy === 'top') {
    filtered = results.filter((r) => r.score_difference >= -2.5 && r.score_difference <= 0.5)
  }

  return filtered.sort((a, b) => b.score_difference - a.score_difference)
}
