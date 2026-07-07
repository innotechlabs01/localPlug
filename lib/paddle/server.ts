function getBaseUrl() {
  if (
    process.env.PADDLE_ENV === 'production' ||
    process.env.PADDLE_LIVE === '1' ||
    process.env.PADDLE_LIVE === 'true'
  ) {
    return 'https://api.paddle.com'
  }
  return 'https://sandbox-api.paddle.com'
}

function getClient() {
  const apiKey =
    process.env.PADDLE_API_KEY ||
    process.env.PADDLE_SANDBOX_API_KEY ||
    ''
  if (!apiKey) throw new Error('PADDLE_API_KEY is not configured')
  return { apiKey, baseUrl: getBaseUrl() }
}

function getDefaultProductId(): string {
  return process.env.PADDLE_PRODUCT_ID || process.env.PADDLE_PRO_PRODUCT_ID || ''
}

interface TransactionItem {
  description: string
  name: string
  unitPrice: { amount: string; currencyCode: string }
  quantity: number
  productId?: string
}

export async function createTransaction(params: {
  items: TransactionItem[]
  customData: Record<string, string>
  customer?: { email: string; name: string }
}) {
  const { apiKey, baseUrl } = getClient()
  const defaultProductId = getDefaultProductId()

  const body: Record<string, unknown> = {
    items: params.items.map((item) => ({
      price: {
        product_id: item.productId || defaultProductId,
        description: item.description,
        name: item.name,
        unit_price: {
          amount: item.unitPrice.amount,
          currency_code: item.unitPrice.currencyCode.toUpperCase(),
        },
      },
      quantity: item.quantity,
    })),
    custom_data: params.customData,
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
  amount?: number
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
