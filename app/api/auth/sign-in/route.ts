import { NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@localplug.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'

    if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    const token = await createSessionToken(adminEmail)
    const response = NextResponse.json({ success: true })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('[Auth Sign In] Error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
