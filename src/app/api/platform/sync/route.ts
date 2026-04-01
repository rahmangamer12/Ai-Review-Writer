import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platformId, newReviews } = await req.json()

    if (!platformId || !newReviews || !Array.isArray(newReviews)) {
      return NextResponse.json({ error: 'Missing platform data or reviews array' }, { status: 400 })
    }

    // Convert frontend review schema to backend Prisma schema and Upsert 
    // to prevent duplicate inserts of the same review on subsequent syncs
    let successCount = 0;
    for (const rw of newReviews) {
      // Map properties. Default rating=5 if none, etc.
      try {
        await prisma.review.upsert({
          where: {
            id: rw.id // If rw.id is a string 'author-time', it replaces the uuid or we can just use the provided ID.
          },
          update: {
            content: rw.content || rw.text || '',
            rating: rw.rating || 5,
            authorName: rw.author || rw.author_name || 'Anonymous',
            sourceDate: rw.date ? new Date(rw.date) : new Date(),
          },
          create: {
            id: rw.id, // we'll use their generated unique ID
            userId: userId,
            platformId: platformId,
            authorName: rw.author || rw.author_name || 'Anonymous',
            content: rw.content || rw.text || '',
            rating: rw.rating || 5,
            sourceDate: rw.date ? new Date(rw.date) : new Date(),
            sentimentLabel: rw.sentimentLabel || 'neutral',
            status: 'pending'
          }
        })
        successCount++;
      } catch (upsertError) {
        console.error(`Failed to upsert review ${rw.id}:`, upsertError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${successCount} reviews from ${platformId}` 
    })
  } catch (error: any) {
    console.error('Platform sync error:', error)
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
  }
}
