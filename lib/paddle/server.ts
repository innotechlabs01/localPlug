import { getDefaultCurrency } from '@/lib/config'

const BASE_URL =
  process.env.PADDLE_ENV === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com'

function getClient() {
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) throw new Error('PADDLE_API_KEY is not configured')
  return { apiKey, baseUrl: BASE_URL }
}

interface TransactionItem {
  description: string
  name: string
  unitPrice: { amount: string; currencyCode: string }
  quantity: number
}

export async function createTransaction(params: {
  items: TransactionItem[]
  customData: Record<string, string>
  customer?: { email: string; name: string }
  currencyCode?: string
}) {
  const { apiKey, baseUrl } = getClient()

  const body: Record<string, unknown> = {
    items: params.items.map((item) => ({
      price: {
        description: item.description,
        name: item.name,
        unit_price: {
          amount: item.unitPrice.amount,
          currency_code: item.unitPrice.currencyCode,
        },
      },
      quantity: item.quantity,
    })),
    custom_data: params.customData,
    currency_code: params.currencyCode || 'USD',
  }

  if (params.customer) {
    body.customer = {
      email: params.customer.email,
      name: params.customer.name,
    }
  }

  const res = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paddle API error (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as { id: string; status: string }
}

export async function getTransaction(transactionId: string) {
  const { apiKey, baseUrl } = getClient()

  const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paddle API error (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as { id: string; status: string; custom_data?: Record<string, string> }
}

export function formatPaddleAmount(cents: number): string {
  return String(Math.round(cents))
}

export async function createPaddleRefund(params: {
  transactionId: string
  amount?: number // Optional: partial refund amount in cents. If omitted, full refund
  reason?: string
}) {
  const { apiKey, baseUrl } = getClient()

  const body: Record<string, unknown> = {
    transaction_id: params.transactionId,
  }

  if (params.amount) {
    body.amount = formatPaddleAmount(params.amount)
  }

  if (params.reason) {
    body.reason = params.reason
  }

  const res = await fetch(`${baseUrl}/transactions/${params.transactionId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paddle refund error (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as { id: string; status: string }
}
