import { NextRequest, NextResponse } from 'next/server'
import { PlatformIntegrationManager } from '@/lib/platformIntegrations'

// GET /api/platforms/reviews - Fetch reviews from all connected platforms
export async function GET() {
  try {
    const platforms = PlatformIntegrationManager.getPlatforms()
    const connectedPlatforms = platforms.filter(p => p.connected)
    
    if (connectedPlatforms.length === 0) {
      return NextResponse.json({ 
        reviews: [],
        message: 'No platforms connected'
      })
    }

    // Fetch reviews from all connected platforms
    const allReviews = []
    const errors = []

    for (const platform of connectedPlatforms) {
      try {
        const reviews = await PlatformIntegrationManager.fetchReviews(platform.id)
        allReviews.push(...reviews)
      } catch (error) {
        console.error(`Error fetching reviews from ${platform.name}:`, error)
        errors.push({ platform: platform.name, error: 'Failed to fetch' })
      }
    }

    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ 
      reviews: allReviews,
      platforms: connectedPlatforms.map(p => ({ id: p.id, name: p.name })),
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/platforms/reviews/sync - Sync reviews from a specific platform
export async function POST(request: NextRequest) {
  try {
    const { platformId } = await request.json()
    
    if (!platformId) {
      return NextResponse.json(
        { error: 'Missing platformId' },
        { status: 400 }
      )
    }

    const reviews = await PlatformIntegrationManager.fetchReviews(platformId)
    
    return NextResponse.json({ 
      success: true,
      reviews,
      count: reviews.length
    })
  } catch (error) {
    console.error('Error syncing reviews:', error)
    return NextResponse.json(
      { error: 'Failed to sync reviews' },
      { status: 500 }
    )
  }
}
