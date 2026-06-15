import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPermissions } from '@/lib/admin/permissions'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const perms = await getUserPermissions(clerkId)
  if (!perms) {
    return NextResponse.json({ error: 'User not found' }, { status: 403 })
  }

  return NextResponse.json({ permissions: perms })
}
