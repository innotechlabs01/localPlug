'use client'

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { emitEvent } from '@/lib/events-outbox'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  message: z.string().min(1).max(2000),
  language: z.string().max(10).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()

    const parsed = ContactSchema.safeParse(rawBody)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { status: 'error', message: `Datos inválidos: ${firstError.path.join('.')} — ${firstError.message}` },
        { status: 400 },
      )
    }

    const body = parsed.data
    const db = getDb()

    // Crear tabla de contactos si no existe (idempotente)
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        country TEXT,
        language TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        ip_address TEXT,
        user_agent TEXT
      )`,
      args: [],
    })

    // Insertar mensaje de contacto
    await db.execute({
      sql: `INSERT INTO contact_messages (name, email, phone, country, language, message, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.name,
        body.email,
        body.phone || null,
        body.country || null,
        body.language || null,
        body.message,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        request.headers.get('user-agent') || '',
      ],
    })

    console.log('[Contact] Message received:', body.email)

    // Notificar al admin en tiempo real
    await emitEvent('contact.message', {
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      country: body.country || '',
      message: body.message,
      created_at: new Date().toISOString(),
    }, { correlationId: `contact-${Date.now()}` }).catch(() => {})

    return NextResponse.json(
      { status: 'success', message: 'Mensaje enviado correctamente. Te contactaremos pronto.' },
      { status: 200 },
    )
  } catch (err) {
    console.error('[Contact] Error:', err)
    return NextResponse.json(
      { status: 'error', message: 'Ocurrió un error al enviar tu mensaje. Inténtalo de nuevo.' },
      { status: 500 },
    )
  }
}
