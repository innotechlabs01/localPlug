import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/driver/register
 *
 * Self-registration for drivers. Creates both a Clerk user and a driver
 * profile in the DB. The driver starts with status='pending' until an
 * admin approves them.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone, vehicle, plate, category } = body

    if (!name || !email || !password || !vehicle || !plate) {
      return NextResponse.json(
        { error: 'name, email, password, vehicle, and plate are required' },
        { status: 400 },
      )
    }

    const db = getDb()

    // Check if email already exists in drivers table
    const existing = await db.execute({
      sql: `SELECT id FROM drivers WHERE email = ? OR clerk_user_id IN (
        SELECT id FROM users WHERE email = ?
      )`,
      args: [email, email],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      )
    }

    // 1. Create driver record in DB (pending until admin approves)
    const driverResult = await db.execute({
      sql: `INSERT INTO drivers (
        name, phone, email, vehicle, plate, category, status, rating,
        languages, experience_level, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'pending', 5.0,
        'Spanish', 'Standard', datetime('now'), datetime('now')
      )`,
      args: [
        name, phone || null, email,
        vehicle, plate, category || 'standard',
      ],
    })
    const driverId = Number(driverResult.lastInsertRowid)

    // 2. Create Clerk user with driver role
    try {
      const client = await clerkClient()
      const nameParts = name.trim().split(/\s+/)
      const firstName = nameParts[0] || name
      const lastName = nameParts.slice(1).join(' ') || ''

      const clerkUser = await client.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        password,
        publicMetadata: { role: 'driver', driver_id: driverId },
      })

      // Link Clerk user to driver record
      await db.execute({
        sql: `UPDATE drivers SET clerk_user_id = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [clerkUser.id, driverId],
      })

      return NextResponse.json({
        success: true,
        message: 'Registration successful. Your account is pending admin approval.',
        driverId,
      })
    } catch (clerkError: any) {
      // Clerk creation failed — clean up the driver record
      await db.execute({
        sql: `DELETE FROM drivers WHERE id = ?`,
        args: [driverId],
      })

      const msg = clerkError?.errors?.[0]?.message || clerkError?.message || 'Account creation failed'
      console.error('[Driver Register] Clerk error:', msg)
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  } catch (err) {
    console.error('[Driver Register] Error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
