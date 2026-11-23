import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPermissions } from '@/lib/admin/permissions'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    console.log('[permissions/mine] clerkId:', clerkId)
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const perms = await getUserPermissions(clerkId)
    console.log('[permissions/mine] perms count:', perms ? Object.keys(perms).length : 'null')
    if (!perms) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    return NextResponse.json({ permissions: perms })
  } catch (err) {
    console.error('[permissions/mine] ERROR:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
