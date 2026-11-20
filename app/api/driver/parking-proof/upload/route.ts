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

    const ALLOWED_MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    }
    const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

    const ext = ALLOWED_MIME_TO_EXT[file.type.toLowerCase()]
    if (!ext) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: JPEG, PNG, WebP, PDF' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
    }

    const name = `parking/${driverId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
    const { url } = await put(name, file, { access: 'public', token: BLOB_TOKEN })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[parking-proof upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
