import { getDb } from '@/lib/db'

export interface PromoEvent {
  id: number
  slug: string
  title: string
  tag: string | null
  description: string | null
  highlights: string[] | null
  cta_text: string | null
  cta_href: string | null
  image: string | null
  placement: 'hero_banner' | 'section'
  active: boolean
  start_date: string | null
  end_date: string | null
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

function mapRow(row: Record<string, unknown>): PromoEvent {
  let highlights: string[] | null = null
  if (row.highlights) {
    try {
      const parsed = JSON.parse(row.highlights as string)
      highlights = Array.isArray(parsed) ? parsed : null
    } catch {
      highlights = null
    }
  }
  return {
    id: Number(row.id),
    slug: row.slug as string,
    title: row.title as string,
    tag: (row.tag as string | null) || null,
    description: (row.description as string | null) || null,
    highlights,
    cta_text: (row.cta_text as string | null) || null,
    cta_href: (row.cta_href as string | null) || '/booking',
    image: (row.image as string | null) || null,
    placement: (row.placement as 'hero_banner' | 'section') || 'section',
    active: Boolean(Number(row.active)),
    start_date: (row.start_date as string | null) || null,
    end_date: (row.end_date as string | null) || null,
    sort_order: Number(row.sort_order) || 0,
    created_at: (row.created_at as string | null) || null,
    updated_at: (row.updated_at as string | null) || null,
  }
}

/** Whether the event falls inside its date window (inclusive). No dates => always active. */
export function isEventInWindow(event: PromoEvent, now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10)
  if (event.start_date && today < event.start_date.slice(0, 10)) return false
  if (event.end_date && today > event.end_date.slice(0, 10)) return false
  return true
}

/** Public list of currently-visible promo events (active + within date window), sorted. */
export async function getActivePromoEvents(placement?: 'hero_banner' | 'section'): Promise<PromoEvent[]> {
  const db = getDb()
  const args: (string | number)[] = []
  let sql = `SELECT * FROM promo_events WHERE active = 1`
  if (placement) {
    sql += ` AND placement = ?`
    args.push(placement)
  }
  sql += ` ORDER BY sort_order ASC, id ASC`

  const result = await db.execute({ sql, args })
  const events = (result.rows || []).map((r: any) => mapRow(r))
  return events.filter(e => isEventInWindow(e))
}

/** Admin list of ALL promo events (regardless of active/window). */
export async function getAllPromoEvents(): Promise<PromoEvent[]> {
  const db = getDb()
  const result = await db.execute('SELECT * FROM promo_events ORDER BY sort_order ASC, id ASC')
  return (result.rows || []).map((r: any) => mapRow(r))
}

export interface PromoEventInput {
  slug: string
  title: string
  tag?: string | null
  description?: string | null
  highlights?: string[] | null
  cta_text?: string | null
  cta_href?: string | null
  image?: string | null
  placement?: 'hero_banner' | 'section'
  active?: boolean
  start_date?: string | null
  end_date?: string | null
  sort_order?: number
}

export async function createPromoEvent(input: PromoEventInput): Promise<number> {
  const db = getDb()
  const highlights = input.highlights ? JSON.stringify(input.highlights) : null
  const result = await db.execute({
    sql: `INSERT INTO promo_events
          (slug, title, tag, description, highlights, cta_text, cta_href, image, placement, active, start_date, end_date, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [
      input.slug,
      input.title,
      input.tag ?? null,
      input.description ?? null,
      highlights,
      input.cta_text ?? null,
      input.cta_href ?? '/booking',
      input.image ?? null,
      input.placement ?? 'section',
      input.active === false ? 0 : 1,
      input.start_date ?? null,
      input.end_date ?? null,
      input.sort_order ?? 0,
    ],
  })
  return Number(result.lastInsertRowid)
}

export async function updatePromoEvent(id: number, input: PromoEventInput): Promise<void> {
  const db = getDb()
  const highlights = input.highlights ? JSON.stringify(input.highlights) : null
  await db.execute({
    sql: `UPDATE promo_events SET
            slug = ?, title = ?, tag = ?, description = ?, highlights = ?, cta_text = ?,
            cta_href = ?, image = ?, placement = ?, active = ?, start_date = ?, end_date = ?,
            sort_order = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      input.slug,
      input.title,
      input.tag ?? null,
      input.description ?? null,
      highlights,
      input.cta_text ?? null,
      input.cta_href ?? '/booking',
      input.image ?? null,
      input.placement ?? 'section',
      input.active === false ? 0 : 1,
      input.start_date ?? null,
      input.end_date ?? null,
      input.sort_order ?? 0,
      id,
    ],
  })
}

export async function setPromoEventActive(id: number, active: boolean): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE promo_events SET active = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [active ? 1 : 0, id],
  })
}

export async function deletePromoEvent(id: number): Promise<void> {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM promo_events WHERE id = ?`, args: [id] })
}