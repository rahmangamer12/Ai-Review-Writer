/**
 * Lightweight web search for the AI chat.
 *
 * Provider priority (first one that returns results wins):
 *   1. Tavily   — set TAVILY_API_KEY        (best, AI-optimised, free tier)
 *   2. Brave    — set BRAVE_SEARCH_API_KEY  (good, free tier)
 *   3. Jina     — set JINA_API_KEY          (AI-optimised, needs a key now)
 *   4. DuckDuckGo HTML                       — KEYLESS, returns real web results
 *   5. DuckDuckGo Instant Answer            — keyless last-resort supplement
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
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function withTimeout(ms: number) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  return { signal: c.signal, done: () => clearTimeout(t) }
}

export async function searchWeb(query: string, maxResults = 5): Promise<WebResult[]> {
  const q = (query || '').trim()
  if (!q) return []

  try {
    if (process.env.TAVILY_API_KEY) {
      const r = await tavily(q, maxResults)
      if (r.length) return r
    }
    if (process.env.BRAVE_SEARCH_API_KEY) {
      const r = await brave(q, maxResults)
      if (r.length) return r
    }
    if (process.env.JINA_API_KEY) {
      const r = await jina(q, maxResults).catch(() => [])
      if (r.length) return r
    }
    // Keyless real-web-results provider. This is the default that works with no
    // configuration at all.
    const html = await ddgHtml(q, maxResults).catch(() => [])
    if (html.length) return html
    // Final supplement (entity/definition style answers only).
    return await ddgInstant(q, maxResults)
  } catch {
    try {
      return await ddgHtml(q, maxResults)
    } catch {
      return []
    }
  }
}

// ─── HTML helpers ───────────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/<[^>]+>/g, '') // strip tags (e.g. <b> highlights)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

/** DuckDuckGo sometimes wraps result URLs in a /l/?uddg=<encoded> redirect. */
function cleanUrl(href: string): string {
  let u = href.trim()
  if (u.startsWith('//')) u = 'https:' + u
  const m = u.match(/[?&]uddg=([^&]+)/)
  if (m) {
    try {
      return decodeURIComponent(m[1])
    } catch {
      return ''
    }
  }
  return u.startsWith('http') ? u : ''
}

// ─── Providers ───────────────────────────────────────────────────────────────

/** Keyless: scrape DuckDuckGo's HTML results page for real web results. */
async function ddgHtml(q: string, maxResults: number): Promise<WebResult[]> {
  const t = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
      },
      body: `q=${encodeURIComponent(q)}`,
      signal: t.signal,
    })
    if (!res.ok) return []
    const html = await res.text()

    // Pull every result anchor (title + href) in document order.
    const anchorRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
    // Snippets appear once per result, in the same order.
    const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

    const snippets: string[] = []
    let s: RegExpExecArray | null
    while ((s = snippetRe.exec(html)) && snippets.length < maxResults * 2) {
      snippets.push(decodeEntities(s[1]))
    }

    const out: WebResult[] = []
    let m: RegExpExecArray | null
    let i = 0
    while ((m = anchorRe.exec(html)) && out.length < maxResults) {
      const url = cleanUrl(m[1])
      const title = decodeEntities(m[2])
      if (!url || !title) {
        i++
        continue
      }
      out.push({ title: title.slice(0, 200), snippet: (snippets[i] || '').slice(0, 500), url })
      i++
    }
    return out
  } finally {
    t.done()
  }
}

/** Keyless instant-answer API — only useful for definitions/entities. */
async function ddgInstant(q: string, maxResults: number): Promise<WebResult[]> {
  const t = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
      { signal: t.signal, headers: { 'User-Agent': UA } },
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
    for (const item of data?.RelatedTopics || []) {
      if (out.length >= maxResults) break
      if (item?.Text && item?.FirstURL) {
        out.push({
          title: String(item.Text).split(' - ')[0].slice(0, 200),
          snippet: String(item.Text).slice(0, 500),
          url: String(item.FirstURL),
        })
      }
    }
    return out.filter((r) => r.url).slice(0, maxResults)
  } finally {
    t.done()
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

async function jina(q: string, maxResults: number): Promise<WebResult[]> {
  const t = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch(`https://s.jina.ai/?q=${encodeURIComponent(q)}`, {
      headers: {
        Accept: 'application/json',
        'X-Respond-With': 'no-content',
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
      signal: t.signal,
    })
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = Array.isArray(data?.data) ? data.data : []
    const results: WebResult[] = items.slice(0, maxResults).map((r: any) => ({
      title: String(r?.title || '').slice(0, 200),
      snippet: String(r?.description || r?.content || '').slice(0, 500),
      url: String(r?.url || ''),
    }))
    return results.filter((r) => r.url)
  } finally {
    t.done()
  }
}

/** Format results as a compact context block for the model. */
export function formatSearchContext(query: string, results: WebResult[]): string {
  if (!results.length) {
    return `You ran a live web search for "${query}" but it returned no results. Tell the user the live search came back empty, then answer from general knowledge while noting it may be out of date.`
  }
  const lines = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
    .join('\n\n')
  return [
    `LIVE WEB SEARCH RESULTS for "${query}" — fetched from the internet just now.`,
    `These results are CURRENT and can contain information that is NEWER than your training data.`,
    ``,
    `MANDATORY RULES — follow exactly:`,
    `1. Treat the results below as the source of truth for anything recent: new AI models, product launches, releases, prices, news, sports, events, dates.`,
    `2. If a result shows that something EXISTS (a new model, product, person, event) that you believe does not exist, then YOU ARE OUTDATED and the results are correct. NEVER tell the user something "does not exist", is "fake", or is "misinformation" when the results below clearly describe it as real.`,
    `3. Answer the user's actual question directly using these results. Do not lecture about what you "cannot verify".`,
    `4. Cite sources inline as [1], [2] etc., and list their URLs at the end.`,
    ``,
    lines,
  ].join('\n')
}
