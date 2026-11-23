import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPermissions, isSuperAdminClerkUser } from '@/lib/admin/permissions'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [perms, isSuperAdmin] = await Promise.all([
      getUserPermissions(clerkId),
      isSuperAdminClerkUser(clerkId),
    ])
    if (!perms) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    return NextResponse.json({ permissions: perms, isSuperAdmin })
  } catch (err) {
    console.error('[permissions/mine] ERROR:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
