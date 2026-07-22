/**
 * Seed Paddle sandbox catalog with 3 subscription products.
 *
 * Requirements:
 *   - PADDLE_API_KEY env var (sandbox key with product.write + price.write scopes)
 *   - @paddle/paddle-node-sdk installed (already in package.json)
 *
 * Run:  npx tsx scripts/seed-paddle-catalog.ts
 *
 * Copy the output IDs into your .env.local and Vercel env vars.
 */

import { Environment, Paddle } from '@paddle/paddle-node-sdk'

const apiKey = process.env.PADDLE_API_KEY
if (!apiKey) {
  console.error('Error: PADDLE_API_KEY is not set.')
  console.error('Get one from https://sandbox-vendors.paddle.com/authentication-v2')
  console.error('Required scopes: product.write, price.write')
  process.exit(1)
}

const paddle = new Paddle(apiKey, {
  environment: Environment.sandbox,
})

interface ProductConfig {
  name: string
  slug: string
  description: string
  amountCents: string
}

const PRODUCTS: ProductConfig[] = [
  {
    name: 'Smooth Landing',
    slug: 'smooth-landing',
    description: 'VIP airport pickup with flight monitoring, premium SUV transfer, toll covered, Metro card & SIM included.',
    amountCents: '8900',
  },
  {
    name: 'First 24h Insider',
    slug: 'first-24',
    description: 'Everything in Smooth Landing plus 2-hour bilingual fixer, neighborhood orientation & local app setup.',
    amountCents: '15900',
  },
  {
    name: 'Medellin Freedom Pass',
    slug: 'full-insider',
    description: 'Everything in First 24h plus round-trip guarantee, 24/7 AI concierge, human safety net & accommodation validation.',
    amountCents: '26900',
  },
]

async function seed() {
  console.log('Creating Paddle sandbox products...\n')

  const results: Record<string, { productId: string; priceId: string }> = {}

  for (const product of PRODUCTS) {
    console.log(`→ Creating product: ${product.name}`)

    const created = await paddle.products.create({
      name: product.name,
      taxCategory: 'saas',
      description: product.description,
    })

    console.log(`  Product ID: ${created.id}`)

    const price = await paddle.prices.create({
      productId: created.id,
      description: `${product.name} USD`,
      unitPrice: { amount: product.amountCents, currencyCode: 'USD' },
      billingCycle: { interval: 'month', frequency: 1 },
    })

    console.log(`  Price ID:   ${price.id}`)
    console.log()

    results[product.slug] = {
      productId: created.id,
      priceId: price.id,
    }
  }

  console.log('='.repeat(60))
  console.log('Done! Copy these into your .env.local:\n')

  for (const [slug, ids] of Object.entries(results)) {
    const envKey = `PADDLE_${slug.replace(/-/g, '_').toUpperCase()}_PRICE_ID`
    console.log(`${envKey}=${ids.priceId}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\nFull reference:')
  console.log(JSON.stringify(results, null, 2))
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
