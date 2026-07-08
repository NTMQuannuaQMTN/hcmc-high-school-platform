import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreText } from '@/lib/review-classifier'

function isAuthorized(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

function decodeHtml(raw: string) {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface SearchResult {
  url: string
  snippet: string
}

// Parse DuckDuckGo HTML search results — extract URLs and snippets separately then pair by index
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'User-Agent': 'HCMCHighSchoolNavigator/1.0 (nguyentruongmanhquan@gmail.com)',
        'Accept-Language': 'vi,en;q=0.9',
      },
    }
  )
  if (!res.ok) return []
  const html = await res.text()

  // Extract all result URLs (result__a href)
  const urls: string[] = []
  for (const m of html.matchAll(/class="result__a"[^>]+href="([^"]+)"/g)) {
    const raw = m[1]
    if (raw.startsWith('//duckduckgo.com') || raw.startsWith('/')) continue
    urls.push(raw.startsWith('http') ? raw : `https:${raw}`)
  }

  // Extract all snippets (result__snippet text)
  const snippets: string[] = []
  for (const m of html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)) {
    snippets.push(decodeHtml(m[1].replace(/<[^>]+>/g, '')))
  }

  const results: SearchResult[] = []
  for (let i = 0; i < Math.min(urls.length, snippets.length); i++) {
    if (snippets[i].length >= 30) {
      results.push({ url: urls[i], snippet: snippets[i] })
    }
  }
  return results
}

// Strip boilerplate HTML tags, return clean text lines
function extractTextLines(html: string): string[] {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    // treat block-level tags as line breaks
    .replace(/<\/?(p|div|li|br|h[1-6]|blockquote|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  return stripped
    .split('\n')
    .map((line) => decodeHtml(line))
    .filter((line) => line.length >= 40)
}

// Fetch a page and return review-quality paragraphs from it.
// School name is only checked at page level (title/body contains it), not per paragraph.
async function fetchPageReviews(url: string, schoolName: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'HCMCHighSchoolNavigator/1.0 (nguyentruongmanhquan@gmail.com)',
        'Accept-Language': 'vi,en;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []

    const html = await res.text()

    // Page-level relevance check: must mention the school somewhere
    const keyword = schoolName.split(' ').at(-1)!.toLowerCase()
    if (!html.toLowerCase().includes(keyword)) return []

    const lines = extractTextLines(html)

    // Classify each line independently — no per-line school name requirement
    return lines.filter((line) => scoreText(line) > 0)
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { school_id, school_name } = await req.json()
  if (!school_id || !school_name) {
    return NextResponse.json({ error: 'school_id and school_name required' }, { status: 400 })
  }

  const queries = [
    `${school_name} đánh giá học sinh phụ huynh`,
    `${school_name} review trải nghiệm`,
    `"${school_name}" ý kiến nhận xét`,
  ]

  const seen = new Set<string>()
  const confirmedReviews: string[] = []

  for (const query of queries) {
    let searchResults: SearchResult[] = []
    try {
      searchResults = await searchDuckDuckGo(query)
    } catch {
      continue
    }

    // Process top 5 results per query
    for (const result of searchResults.slice(0, 5)) {
      // Phase 1: hard-reject check on snippet — skip URL if snippet is definitely not review
      if (scoreText(result.snippet) === -999) continue

      // Phase 2: fetch the full page and classify every paragraph
      const paragraphs = await fetchPageReviews(result.url, school_name)
      await new Promise((r) => setTimeout(r, 400))

      for (const para of paragraphs) {
        const key = para.slice(0, 70)
        if (!seen.has(key)) {
          seen.add(key)
          confirmedReviews.push(para)
        }
      }

      // Fallback: if page fetch failed/empty but the snippet itself is review-quality, keep it
      if (paragraphs.length === 0 && scoreText(result.snippet) > 0) {
        const key = result.snippet.slice(0, 70)
        if (!seen.has(key)) {
          seen.add(key)
          confirmedReviews.push(result.snippet)
        }
      }
    }

    await new Promise((r) => setTimeout(r, 800))
  }

  if (confirmedReviews.length === 0) {
    return NextResponse.json({ inserted: 0, message: 'Không tìm thấy đánh giá từ học sinh/phụ huynh.' })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert(
      confirmedReviews.map((content) => ({
        school_id,
        source: 'web:duckduckgo',
        content,
        rating: null,
        author_name: null,
        reviewer_role: null,
      }))
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data.length })
}
