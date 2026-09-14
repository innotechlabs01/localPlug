import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import { settlePayoutRequest, cancelPayoutRequest } from '@/lib/payout'

export const dynamic = 'force-dynamic'

/**
 * POST body: { action: 'settle' | 'cancel', method?, reference? }
 * Settle = admin consigned the transfer → marks payout + ledger lines paid.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requirePermission('payments', 'update')
  if (authError) return authError
  const { id } = await params
  const requestId = Number(id)
  if (Number.isNaN(requestId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const action = body?.action

  // Resolve actor from Clerk session (best-effort).
  let actor = 'admin'
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    if (userId) actor = userId
  } catch {}

  if (action === 'settle') {
    const method = String(body?.method || 'bank_transfer')
    const reference = String(body?.reference || '')
    if (!reference) return NextResponse.json({ error: 'reference is required to settle' }, { status: 400 })
    const res = await settlePayoutRequest(requestId, method, reference, actor)
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 })
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    const res = await cancelPayoutRequest(requestId)
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'action must be settle or cancel' }, { status: 400 })
}