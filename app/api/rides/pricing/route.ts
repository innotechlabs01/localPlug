import { NextResponse } from 'next/server'
import { ensureRidePricingTable } from '@/lib/ride-pricing'
import { getTaxRate } from '@/lib/settings'
import { validateRideTaxRate } from '@/lib/rides/fare'

export async function GET() {
  try {
    const [pricing, configuredTaxRate] = await Promise.all([
      ensureRidePricingTable(),
      getTaxRate(),
    ])
    const taxRate = validateRideTaxRate(configuredTaxRate)

    return NextResponse.json(
      { success: true, pricing, taxRate },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[Ride Pricing] GET error:', err)
    return NextResponse.json(
      { success: false, error: 'No se pudo cargar la configuración de tarifas' },
      { status: 500 },
    )
  }
}
