import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getDriverFromSession } from '@/lib/driver/auth'

export const dynamic = 'force-dynamic'
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

export async function POST(request: Request) {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const driverId = result.driver.id

    if (!BLOB_TOKEN) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 503 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const name = `parking/${driverId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
    const { url } = await put(name, file, { access: 'public', token: BLOB_TOKEN })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[parking-proof upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
