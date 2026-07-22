const PLAN_PRICE_MAP: Record<string, string> = {
  'smooth-landing': process.env.PADDLE_STARTER_PRICE_ID || '',
  'first-24': process.env.PADDLE_PRO_PRICE_ID || '',
  'full-insider': process.env.PADDLE_ENTERPRISE_PRICE_ID || '',
}

export function getPriceIdForPlan(slug: string): string | null {
  const priceId = PLAN_PRICE_MAP[slug]
  if (!priceId) return null
  return priceId
}

export function getAvailablePlanSlugs(): string[] {
  return Object.keys(PLAN_PRICE_MAP).filter((slug) => PLAN_PRICE_MAP[slug])
}

export function isPaddleConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
    process.env.NEXT_PUBLIC_PADDLE_ENV
  )
}
