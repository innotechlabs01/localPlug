import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import {
  getAllPromoEvents,
  createPromoEvent,
  updatePromoEvent,
  setPromoEventActive,
  deletePromoEvent,
  type PromoEventInput,
} from '@/lib/promo-events'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authError = await requirePermission('settings', 'view')
  if (authError) return authError
  try {
    const events = await getAllPromoEvents()
    return NextResponse.json({ events })
  } catch (err) {
    console.error('[admin promo events GET]', err)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const authError = await requirePermission('settings', 'create')
  if (authError) return authError
  try {
    const body = await req.json()
    const input: PromoEventInput = {
      slug: String(body.slug || '').trim(),
      title: String(body.title || '').trim(),
      tag: body.tag ? String(body.tag) : undefined,
      description: body.description ? String(body.description) : undefined,
      highlights: Array.isArray(body.highlights) ? body.highlights.map(String) : undefined,
      cta_text: body.cta_text ? String(body.cta_text) : undefined,
      cta_href: body.cta_href ? String(body.cta_href) : '/booking',
      image: body.image ? String(body.image) : undefined,
      placement: body.placement === 'hero_banner' ? 'hero_banner' : 'section',
      active: body.active !== false,
      start_date: body.start_date ? String(body.start_date) : undefined,
      end_date: body.end_date ? String(body.end_date) : undefined,
      sort_order: Number(body.sort_order) || 0,
    }
    if (!input.slug || !input.title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
    }
    const id = await createPromoEvent(input)
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    console.error('[admin promo events POST]', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const authError = await requirePermission('settings', 'update')
  if (authError) return authError
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    const body = await req.json()
    if (isNaN(id)) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Simple toggle
    if (body.action === 'toggle') {
      await setPromoEventActive(id, Boolean(body.active))
      return NextResponse.json({ success: true })
    }

    const input: PromoEventInput = {
      slug: String(body.slug || '').trim(),
      title: String(body.title || '').trim(),
      tag: body.tag ?? null,
      description: body.description ?? null,
      highlights: Array.isArray(body.highlights) ? body.highlights.map(String) : (body.highlights ?? null),
      cta_text: body.cta_text ?? null,
      cta_href: body.cta_href || '/booking',
      image: body.image ?? null,
      placement: body.placement === 'hero_banner' ? 'hero_banner' : 'section',
      active: body.active !== false,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      sort_order: Number(body.sort_order) || 0,
    }
    if (!input.slug || !input.title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
    }
    await updatePromoEvent(id, input)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin promo events PUT]', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('settings', 'delete')
  if (authError) return authError
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (isNaN(id)) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    await deletePromoEvent(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin promo events DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}