import { NextResponse } from 'next/server'
import { triggerDriverAssigned } from '@/lib/n8n/client'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bookingReference, customerName, customerPhone, driverName, vehicle, eta } = body

    if (!bookingReference || !driverName || !vehicle || !eta) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingReference, driverName, vehicle, eta' },
        { status: 400 },
      )
    }

    console.log('[Driver Assigned] Triggering n8n', { bookingReference, driverName })

    const result = await triggerDriverAssigned({
      bookingReference,
      customerName: customerName || '',
      customerPhone: customerPhone || undefined,
      driverName,
      vehicle,
      eta,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ received: true, workflowId: result.workflowId })
  } catch (error) {
    console.error('[Driver Assigned] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
