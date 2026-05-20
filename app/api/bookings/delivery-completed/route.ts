import { NextResponse } from 'next/server'
import { triggerDeliveryCompleted } from '@/lib/n8n/client'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bookingReference, customerName, customerPhone } = body

    if (!bookingReference) {
      return NextResponse.json(
        { error: 'Missing required field: bookingReference' },
        { status: 400 },
      )
    }

    console.log('[Delivery Completed] Triggering n8n', { bookingReference })

    const result = await triggerDeliveryCompleted({
      bookingReference,
      customerName: customerName || '',
      customerPhone: customerPhone || undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ received: true, workflowId: result.workflowId })
  } catch (error) {
    console.error('[Delivery Completed] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
