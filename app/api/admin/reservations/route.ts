import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'
import { recordHotelAudit } from '@/lib/hotel/audit'
import { auth } from '@clerk/nextjs/server'

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
function transformOrderToReservation(order: any, isAdmin: boolean, hotelId: number | null) {
  return {
    id: String(order.id),
    guest: {
      id: `guest_${order.id}`,
      firstName: order.customer_name?.split(' ')[0] || 'Unknown',
      lastName: order.customer_name?.split(' ').slice(1).join(' ') || '',
      email: order.customer_email || '',
      phone: order.customer_phone || '',
      country: order.customer_country || 'N/A',
      language: order.customer_language || order.customer_language_code || 'Not specified',
      notes: order.customer_notes || ''
    },
    service: {
      id: order.package_id || '',
      name: order.package_name || 'Standard Package',
      description: `${order.package_name} - ${order.package_price} ${order.currency?.toUpperCase()}`,
      price: order.package_price || 0,
      currency: order.currency || 'USD',
    },
    arrivalDate: order.arrival_date || '',
    arrivalTime: order.arrival_time || '',
    flightInfo: order.flight_number && order.airline
      ? `${order.airline} ${order.flight_number} — Arriving ${order.arrival_time}`
      : order.flight_number || 'Not provided',
    status: order.status || 'pending',
    paymentStatus: order.payment_status || 'pending',
    totalAmount: order.package_price || 0,
    paymentMethod: order.payment_id ? `Payment #${order.payment_id}` : 'Not specified',
    transactionId: order.payment_id ? `TXN-${order.payment_id}` : '',
    specialRequests: order.customer_notes || '',
    vipStatus: order.priority && order.priority >= 3 ? 'gold' : order.priority === 2 ? 'silver' : 'none',
    createdAt: order.created_at || new Date().toISOString(),
    updatedAt: order.updated_at || new Date().toISOString(),
    // Additional fields for admin dashboard
    orderId: order.id,
    orderNumber: order.order_number,
    bookingReference: order.booking_reference,
    clerkUserId: order.clerk_user_id,
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
    numPeople: order.num_people || 1,
    hotel: {
      id: order.hotel_id,
      name: order.hotel_name,
      roomId: order.room_id,
      roomName: order.room_name,
      roomType: order.room_type,
      pricePerNight: order.price_per_night || 0,
      numNights: order.num_nights || 0,
      commissionRate: order.hotel_commission_rate || 0,
      isHotelBooking: order.is_hotel_booking || 0,
      roomStatus: order.room_status,
    },
    payment: {
      status: order.payment_status_live || order.payment_status || 'pending',
      method: order.payment_method || 'Not specified',
      transactionId: order.payment_txn || '',
      amount: order.payment_amount || 0,
      currency: order.payment_currency || 'USD',
    },
    // Hotel managers only see their own hotels; admin sees all
    visibleToHotel: isAdmin || !hotelId || order.hotel_id === hotelId,
  }
}

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('reservations', 'view')
    if (authError) return authError

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()
    const isAdmin = ctx.isAdmin
    const hotelId = ctx.hotelId

    // Build WHERE clause
    let whereSql = 'WHERE (o.status IS NULL OR o.status != \'cancelled\')'
    const args: (string | number)[] = []

    // Hotel managers see only their hotel's reservations
    if (!isAdmin && hotelId) {
      whereSql += ' AND o.hotel_id = ?'
      args.push(hotelId)
    }

    // Optional query filters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search') || ''

    if (status && status !== 'all') {
      whereSql += ' AND o.status = ?'
      args.push(status)
    }

    if (paymentStatus && paymentStatus !== 'all') {
      whereSql += ' AND COALESCE(p.status, o.payment_status) = ?'
      args.push(paymentStatus)
    }

    if (search) {
      whereSql += ' AND (o.customer_name LIKE ? OR o.order_number LIKE ? OR o.booking_reference LIKE ? OR o.destination_address LIKE ?)'
      const term = `%${search}%`
      args.push(term, term, term, term)
    }

    // Get all reservations (orders) with driver/hotel/room/payment info
    const result = await db.execute({
      sql: `
      SELECT 
        o.id, o.order_number, o.booking_reference, o.clerk_user_id,
        o.customer_name, o.customer_email, o.customer_phone, o.customer_country,
        o.customer_language, o.customer_language_code, o.customer_notes,
        o.package_id, o.package_name, o.package_price, o.currency,
        o.flight_number, o.airline, o.arrival_date, o.arrival_time,
        o.return_date, o.return_time,
        o.destination_address, o.destination_has_place, o.additional_trips,
        o.traveler_profile, o.num_people,
        o.hotel_id, o.room_id, o.num_nights, o.is_hotel_booking, o.hotel_commission_rate,
        o.status, o.dispatch_status,
        COALESCE(p.status, o.payment_status) as payment_status_live,
        o.payment_id,
        o.priority, o.internal_notes,
        o.assigned_to, o.assigned_at,
        o.created_at, o.updated_at,
        d.name as driver_name,
        d.phone as driver_phone,
        d.status as driver_status,
        h.name as hotel_name,
        h.address as hotel_address,
        r.name as room_name, r.type as room_type, r.price_per_night, r.status as room_status,
        p.amount as payment_amount, p.currency as payment_currency, p.method as payment_method, p.transaction_id as payment_txn
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_to = d.id
      LEFT JOIN payments p ON o.booking_reference = p.booking_reference
      LEFT JOIN hotels h ON o.hotel_id = h.id
      LEFT JOIN rooms r ON o.room_id = r.id
      ${whereSql}
      ORDER BY o.arrival_date DESC, o.arrival_time DESC
    `,
      args,
    })

    const reservations = (result.rows || [])
      .map((row: any) => transformOrderToReservation(row, isAdmin, hotelId))
      .filter((r: any) => r.visibleToHotel)

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

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

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
      status = 'new',
      hotel_id,
      room_id,
      num_nights,
      is_hotel_booking = 0,
      hotel_commission_rate = 0,
      num_people = 1,
    } = body

    if (!customer_name || !package_id || !arrival_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getDb()
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
    const bookingRef = `BK-${Math.random().toString(36).slice(2, 9).toUpperCase()}`

    // Hotel managers can only create reservations for their own hotel
    const effectiveHotelId = (ctx.isAdmin && hotel_id != null) ? hotel_id : (ctx.hotelId || null)

    const result = await db.execute({
      sql: `INSERT INTO orders (
        order_number, booking_reference, clerk_user_id, customer_name, customer_email, customer_phone,
        customer_country, customer_language, customer_language_code, customer_notes,
        return_date, return_time,
        package_id, package_name, package_price, currency,
        flight_number, airline, arrival_date, arrival_time,
        destination_address, destination_has_place, additional_trips,
        traveler_profile, status, dispatch_status, payment_status,
        hotel_id, room_id, num_nights, is_hotel_booking, hotel_commission_rate,
        num_people
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orderNumber,
        bookingRef,
        ctx.isAdmin ? body.clerk_user_id || '' : '', // admin can specify clerk user; hotel manager uses own context
        customer_name || null,
        customer_email || null,
        customer_phone || null,
        customer_country || null,
        body.customer_language || null,
        body.customer_language_code || null,
        body.customer_notes || null,
        body.return_date || null,
        body.return_time || null,
        package_id,
        package_name,
        package_price,
        currency,
        flight_number || null,
        airline || null,
        arrival_date,
        arrival_time || null,
        destination_address || null,
        destination_has_place ? 1 : 0,
        body.additional_trips ? JSON.stringify(body.additional_trips) : null,
        body.traveler_profile || null,
        status,
        'pending',
        payment_status,
        effectiveHotelId,
        room_id || null,
        num_nights || null,
        is_hotel_booking ? 1 : 0,
        hotel_commission_rate,
        num_people,
      ],
    })

    const orderId = Number(result.rows[0]?.id)

    return NextResponse.json({ 
      success: true, 
      id: orderId,
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
    const { userId: clerkId } = await auth()
    const authError = await requirePermission('reservations', 'update')
    if (authError) return authError

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()

    // Verify ownership if hotel manager
    if (!ctx.isAdmin && ctx.hotelId) {
      const ownership = await db.execute({
        sql: `SELECT id FROM orders WHERE id = ? AND hotel_id = ?`,
        args: [id, ctx.hotelId],
      })
      if (ownership.rows.length === 0) {
        return NextResponse.json({ error: 'Forbidden: not your hotel reservation' }, { status: 403 })
      }
    }

    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_ORDER_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    // Get order info for notifications and history
    const orderRes = await db.execute({ sql: `SELECT * FROM orders WHERE id = ?`, args: [id] })
    const order = orderRes.rows[0] as any

    await db.execute({
      sql: `UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    // Record status change in history if status changed
    if (updates.status && order && updates.status !== order.status) {
      await db.execute({
        sql: `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes, created_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [id, order.status, updates.status, ctx.isAdmin ? body.changed_by || null : null, body.notes || null],
      })
    }

    // Hotel audit log - record hotel-related dispatch changes
    if (order.hotel_id && updates.dispatch_status && updates.dispatch_status !== order.dispatch_status) {
      const hotelActionMap: Record<string, string> = {
        confirmed: 'confirm_room',
        cancelled: 'cancelled',
        checked_in: 'check_in',
        checked_out: 'check_out',
      }
      await recordHotelAudit({
        orderId: order.id,
        hotelId: order.hotel_id,
        roomId: order.room_id ?? null,
        actorType: 'admin',
        actorId: ctx.isAdmin ? (body.changed_by ?? Number(clerkId)) : undefined,
        actorName: 'Admin',
        action: (hotelActionMap[updates.dispatch_status as keyof typeof hotelActionMap] || 'confirm_room') as any,
        fromStatus: order.dispatch_status,
        toStatus: updates.dispatch_status,
        reason: body.notes || undefined,
        metadata: { updated_by: 'admin_dispatch' },
      }).catch(() => {})
    }

    // Notify customer on status/payment/dispatch change
    try {
      const { sendBookingNotification } = await import('@/lib/notifications/booking')
      if (order?.customer_phone || order?.customer_email) {
        const ref = order.order_number || order.booking_reference || id
        const lang = (order.customer_language_code || order.customer_language || 'es').toLowerCase()
        let event: 'status_changed' | 'payment_updated' | 'driver_assigned' = 'status_changed'
        let statusText = ''
        let paymentText = ''

        if (updates.status && updates.status !== order.status) {
          event = 'status_changed'
          const map: Record<string, string> = { confirmed: 'confirmada', assigned: 'asignada a conductor', in_progress: 'en camino/proceso', completed: 'completada', cancelled: 'cancelada' }
          statusText = map[updates.status] || updates.status
        } else if (updates.payment_status && updates.payment_status !== order.payment_status) {
          event = 'payment_updated'
          const map: Record<string, string> = { paid: 'pagada', partial: 'pago parcial registrado', refunded: 'reembolsada' }
          paymentText = map[updates.payment_status] || updates.payment_status
        } else if (updates.dispatch_status && updates.dispatch_status !== order.dispatch_status) {
          event = 'status_changed'
          statusText = `Despacho: ${updates.dispatch_status}`
        }

        const msg = statusText 
          ? `Tu reserva ${ref} cambio a: ${statusText}.`
          : paymentText 
            ? `Tu reserva ${ref}: estado de pago ${paymentText}.`
            : `Tu reserva ${ref} fue actualizada.`

        await sendBookingNotification({
          bookingReference: order.booking_reference,
          orderNumber: order.order_number,
          customerName: order.customer_name || 'Huésped',
          customerEmail: order.customer_email || undefined,
          customerPhone: order.customer_phone || undefined,
          customerLanguage: order.customer_language || 'es',
          packageName: order.package_name || '',
          packagePrice: Number(order.package_price || 0),
          event,
          status: updates.status || undefined,
          paymentStatus: updates.payment_status || undefined,
          dispatchStatus: updates.dispatch_status || undefined,
        }).catch(() => {})
      }
    } catch (e) { console.error('[Admin PUT notify]', e) }

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

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()

    // Verify ownership if hotel manager
    if (!ctx.isAdmin && ctx.hotelId) {
      const ownership = await db.execute({
        sql: `SELECT id FROM orders WHERE id = ? AND hotel_id = ?`,
        args: [id, ctx.hotelId],
      })
      if (ownership.rows.length === 0) {
        return NextResponse.json({ error: 'Forbidden: not your hotel reservation' }, { status: 403 })
      }
    }

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
