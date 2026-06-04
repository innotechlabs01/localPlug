// app/api/ratings/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { createRating, getLatestRatings, ratingExistsForConversation, getFirstResponseTimeMs } from '@/lib/services/rating-service'
import { filterComment } from '@/lib/moderation/comment-filter'

export async function GET() {
  try {
    const ratings = await getLatestRatings(10)
    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('[Ratings API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversation_id, customer_name, customer_country, rating, comment } = body

    if (!conversation_id || !customer_name || !customer_country || !rating) {
      return NextResponse.json(
        { error: 'conversation_id, customer_name, customer_country, and rating are required' },
        { status: 400 }
      )
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    if (customer_name.length > 150) {
      return NextResponse.json(
        { error: 'customer_name must be 150 characters or less' },
        { status: 400 }
      )
    }

    if (customer_country.length > 100) {
      return NextResponse.json(
        { error: 'customer_country must be 100 characters or less' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify conversation exists and is closed
    const convResult = await db.execute({
      sql: 'SELECT id, status FROM conversations WHERE id = ?',
      args: [conversation_id],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check for duplicate rating
    const existing = await ratingExistsForConversation(conversation_id)
    if (existing) {
      return NextResponse.json(
        { error: 'A rating already exists for this conversation' },
        { status: 409 }
      )
    }

    // Filter comment
    const moderation = filterComment(comment || '')

    // Get first response time
    const responseTimeMs = await getFirstResponseTimeMs(conversation_id)

    const ratingRecord = await createRating({
      conversation_id,
      customer_name: customer_name.trim(),
      customer_country: customer_country.trim(),
      rating,
      comment: moderation.filteredComment,
      resolved: 1,
      first_response_time_ms: responseTimeMs,
    })

    return NextResponse.json({ success: true, rating: ratingRecord }, { status: 201 })
  } catch (error) {
    console.error('[Ratings API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 })
  }
}
