import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app').replace(/\/$/, '')

// Public, indexable marketing/content pages.
const ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, freq: 'weekly' },
  { path: '/subscription', priority: 0.9, freq: 'weekly' },
  { path: '/restaurants', priority: 0.8, freq: 'monthly' },
  { path: '/clinics', priority: 0.8, freq: 'monthly' },
  { path: '/salons', priority: 0.8, freq: 'monthly' },
  { path: '/repair-shops', priority: 0.8, freq: 'monthly' },
  { path: '/extension', priority: 0.7, freq: 'monthly' },
  { path: '/docs', priority: 0.6, freq: 'monthly' },
  { path: '/faq', priority: 0.6, freq: 'monthly' },
  { path: '/contact', priority: 0.5, freq: 'monthly' },
  { path: '/privacy', priority: 0.3, freq: 'yearly' },
  { path: '/terms', priority: 0.3, freq: 'yearly' },
  { path: '/status', priority: 0.3, freq: 'monthly' },
  { path: '/compliance', priority: 0.3, freq: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))
}
