import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type IncidentType = 'flight_delay' | 'flight_advance' | 'flight_cancel' | 'schedule_change'

interface CreateIncidentBody {
  type: IncidentType
  originalArrivalDate: string
  newArrivalDate: string
  originalArrivalTime: string
  newArrivalTime: string
  description: string
  reportedBy: string
}

const INCIDENT_TYPES: IncidentType[] = [
  'flight_delay',
  'flight_advance',
  'flight_cancel',
  'schedule_change',
]

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const body = (await req.json()) as CreateIncidentBody
    const {
      type,
      originalArrivalDate,
      newArrivalDate,
      originalArrivalTime,
      newArrivalTime,
      description,
      reportedBy,
    } = body

    if (
      !type ||
      !originalArrivalDate ||
      !newArrivalDate ||
      !originalArrivalTime ||
      !newArrivalTime ||
      !description ||
      !reportedBy
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!INCIDENT_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid incident type' }, { status: 400 })
    }

    const db = getDb()

    // 1. Verificar que la orden existe
    const orderCheck = await db.execute({
      sql: `SELECT id FROM orders WHERE id = ?`,
      args: [orderId],
    })

    if (!orderCheck.rows || orderCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Insertar el incidente vinculado a la orden
    const insertResult = await db.execute({
      sql: `INSERT INTO service_incidents (
              order_id, type, original_arrival_date, new_arrival_date,
              original_arrival_time, new_arrival_time, description, reported_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        orderId,
        type,
        originalArrivalDate,
        newArrivalDate,
        originalArrivalTime,
        newArrivalTime,
        description,
        reportedBy,
      ],
    })

    const incidentId = Number(insertResult.lastInsertRowid)

    // 3. Devolver el incidente creado (201)
    return NextResponse.json(
      {
        success: true,
        incident: {
          id: incidentId,
          orderId,
          type,
          originalArrivalDate,
          newArrivalDate,
          originalArrivalTime,
          newArrivalTime,
          description,
          reportedBy,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Orders Incidents API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create service incident' },
      { status: 500 }
    )
  }
}
