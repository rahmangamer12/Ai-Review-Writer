/**
 * Lightweight web search for the AI chat.
 *
 * Provider priority (first one configured wins):
 *   1. Tavily   — set TAVILY_API_KEY        (best, AI-optimised, free tier)
 *   2. Brave    — set BRAVE_SEARCH_API_KEY  (good, free tier)
 *   3. DuckDuckGo Instant Answer            — keyless fallback, always available
 *
 * Results are fed to the model so it can answer with fresh context and cite
 * sources. Never throws — returns [] on any failure so chat keeps working.
 */

export interface WebResult {
  title: string
  snippet: string
  url: string
}

const TIMEOUT_MS = 7000

function withTimeout(ms: number) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  return { signal: c.signal, done: () => clearTimeout(t) }
}

export async function searchWeb(query: string, maxResults = 5): Promise<WebResult[]> {
  const q = (query || '').trim()
  if (!q) return []

  try {
    if (process.env.TAVILY_API_KEY) return await tavily(q, maxResults)
    if (process.env.BRAVE_SEARCH_API_KEY) return await brave(q, maxResults)
    return await duckduckgo(q, maxResults)
  } catch {
    // As a last resort try DDG even if a keyed provider failed.
    try {
      return await duckduckgo(q, maxResults)
    } catch {
      return []
    }
  }
}

async function tavily(q: string, maxResults: number): Promise<WebResult[]> {
  const t = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: q,
        max_results: maxResults,
        search_depth: 'basic',
      }),
      signal: t.signal,
    })
    if (!res.ok) return []
    const data = await res.json()
    const results: WebResult[] = (data?.results || []).slice(0, maxResults).map((r: any) => ({
      title: String(r?.title || '').slice(0, 200),
      snippet: String(r?.content || '').slice(0, 500),
      url: String(r?.url || ''),
    }))
    return results.filter((r) => r.url)
  } finally {
    t.done()
  }
}

async function brave(q: string, maxResults: number): Promise<WebResult[]> {
  const t = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${maxResults}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || '',
        },
        signal: t.signal,
      },
    )
    if (!res.ok) return []
    const data = await res.json()
    const results: WebResult[] = (data?.web?.results || []).slice(0, maxResults).map((r: any) => ({
      title: String(r?.title || '').slice(0, 200),
      snippet: String(r?.description || '').slice(0, 500),
      url: String(r?.url || ''),
    }))
    return results.filter((r) => r.url)
  } finally {
    t.done()
  }
}

async function duckduckgo(q: string, maxResults: number): Promise<WebResult[]> {
  const t = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
      { signal: t.signal, headers: { 'User-Agent': 'AutoReviewAI/1.0' } },
    )
    if (!res.ok) return []
    const data = await res.json()
    const out: WebResult[] = []

    if (data?.AbstractText) {
      out.push({
        title: String(data.Heading || q).slice(0, 200),
        snippet: String(data.AbstractText).slice(0, 500),
        url: String(data.AbstractURL || ''),
      })
    }

    const flatten = (topics: any[]): void => {
      for (const item of topics || []) {
        if (out.length >= maxResults) break
        if (item?.Topics) { flatten(item.Topics); continue }
        if (item?.Text && item?.FirstURL) {
          out.push({
            title: String(item.Text).split(' - ')[0].slice(0, 200),
            snippet: String(item.Text).slice(0, 500),
            url: String(item.FirstURL),
          })
        }
      }
    }
    flatten(data?.RelatedTopics || [])

    return out.filter((r) => r.url).slice(0, maxResults)
  } finally {
    t.done()
  }
}

/** Format results as a compact context block for the model. */
export function formatSearchContext(query: string, results: WebResult[]): string {
  if (!results.length) {
    return `Web search for "${query}" returned no usable results. Answer from your own knowledge and say results were unavailable if the question needs live data.`
  }
  const lines = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
    .join('\n\n')
  return `Live web search results for "${query}" (use these to answer, and cite sources as [1], [2] with their URLs):\n\n${lines}`
}
