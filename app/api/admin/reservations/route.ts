import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

const ALLOWED_ORDER_COLUMNS = [
  'customer_name', 'customer_email', 'customer_phone', 'customer_country', 'customer_notes',
  'package_id', 'package_name', 'package_price', 'currency',
  'flight_number', 'airline', 'arrival_date', 'arrival_time',
  'return_date', 'return_time',
  'destination_address', 'destination_has_place', 'additional_trips',
  'traveler_profile', 'status', 'dispatch_status', 'payment_status',
  'priority', 'internal_notes',
]

// Transform orders row to Reservation format
function transformOrderToReservation(order: any) {
  return {
    id: String(order.id),
    guest: {
      id: `guest_${order.id}`,
      firstName: order.customer_name?.split(' ')[0] || 'Unknown',
      lastName: order.customer_name?.split(' ').slice(1).join(' ') || '',
      email: order.customer_email || '',
      phone: order.customer_phone || '',
      country: order.customer_country || 'N/A',
      language: 'Not specified'
    },
    service: {
      id: order.package_id || '',
      name: order.package_name || 'Standard Package',
      description: `${order.package_name} - ${order.package_price} ${order.currency?.toUpperCase()}`
    },
    arrivalDate: order.arrival_date || '',
    arrivalTime: order.arrival_time || '',
    flightInfo: order.flight_number && order.airline 
      ? `${order.airline}${order.flight_number} — Arriving ${order.arrival_time}`
      : order.flight_number || 'Not provided',
    status: order.status || 'pending',
    paymentStatus: order.payment_status || 'pending',
    totalAmount: order.package_price || 0,
    paymentMethod: order.payment_id ? `Payment #${order.payment_id}` : 'Not specified',
    transactionId: order.payment_id ? `TXN-${order.payment_id}` : '',
    specialRequests: order.customer_notes || '',
    vipStatus: 'none', // Can be enhanced from order.priority if needed
    createdAt: order.created_at || new Date().toISOString(),
    updatedAt: order.updated_at || new Date().toISOString(),
    // Additional fields for admin dashboard
    orderId: order.id,
    orderNumber: order.order_number,
    bookingReference: order.booking_reference,
    driverAssigned: order.assigned_to ? {
      id: order.assigned_to,
      name: order.driver_name || 'Unknown',
      phone: order.driver_phone || ''
    } : null,
    assignedAt: order.assigned_at,
    dispatchStatus: order.dispatch_status || 'pending',
    destinationAddress: order.destination_address,
    additionalTrips: order.additional_trips ? (typeof order.additional_trips === 'string' ? JSON.parse(order.additional_trips) : order.additional_trips) : [],
    priority: order.priority,
    internalNotes: order.internal_notes,
    returnDate: order.return_date || '',
    returnTime: order.return_time || '',
    travelerProfile: order.traveler_profile || '',
  }
}

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('reservations', 'view')
    if (authError) return authError

    const db = getDb()
    
    // Get all reservations (orders) with driver information
    const result = await db.execute(`
      SELECT 
        o.id, o.order_number, o.booking_reference, o.customer_name, o.customer_email,
        o.customer_phone, o.customer_country, o.customer_notes,
        o.package_id, o.package_name, o.package_price, o.currency,
        o.flight_number, o.airline, o.arrival_date, o.arrival_time,
        o.return_date, o.return_time,
        o.destination_address, o.destination_has_place, o.additional_trips,
        o.traveler_profile,
        o.status, o.dispatch_status,
        COALESCE(p.status, o.payment_status) as payment_status,
        o.payment_id,
        o.priority, o.internal_notes,
        o.assigned_to, o.assigned_at,
        o.created_at, o.updated_at,
        d.name as driver_name,
        d.phone as driver_phone,
        d.status as driver_status
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_to = d.id
      LEFT JOIN payments p ON o.booking_reference = p.booking_reference
      WHERE (o.status IS NULL OR o.status != 'cancelled')
      ORDER BY o.arrival_date DESC, o.arrival_time DESC
    `)

    const reservations = (result.rows || []).map(transformOrderToReservation)

    return NextResponse.json({ 
      reservations,
      total: reservations.length 
    })
  } catch (error) {
    console.error('[Reservations API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('reservations', 'create')
    if (authError) return authError

    const body = await req.json()
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_country,
      package_id,
      package_name,
      package_price,
      currency = 'usd',
      flight_number,
      airline,
      arrival_date,
      arrival_time,
      destination_address,
      destination_has_place = 1,
      payment_status = 'pending',
      status = 'new'
    } = body

    if (!customer_name || !package_id || !arrival_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getDb()
    const orderNumber = `ORD-${Date.now()}`
    const bookingRef = `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const result = await db.execute({
      sql: `INSERT INTO orders (
        order_number, booking_reference, customer_name, customer_email, customer_phone,
        customer_country, package_id, package_name, package_price, currency,
        flight_number, airline, arrival_date, arrival_time, destination_address,
        destination_has_place, status, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        orderNumber, bookingRef, customer_name, customer_email, customer_phone || null,
        customer_country || null, package_id, package_name, package_price, currency,
        flight_number || null, airline || null, arrival_date, arrival_time || null,
        destination_address || null, destination_has_place, status, payment_status
      ]
    })

    return NextResponse.json({ 
      success: true, 
      id: Number(result.lastInsertRowid),
      orderNumber,
      bookingReference: bookingRef
    })
  } catch (error) {
    console.error('[Reservations API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('reservations', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_ORDER_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push('updated_at = datetime(\'now\')')
    args.push(id)

    await db.execute({
      sql: `UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reservations API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('reservations', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    await db.execute({
      sql: `UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`,
      args: [parseInt(id)],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reservations API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 })
  }
}
