import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(__dirname, '..', '.env.local') })

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
const CLERK_API_URL = 'https://api.clerk.com/v1'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_API_KEY!,
})

async function clerkRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${CLERK_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Clerk API error ${res.status}: ${err}`)
  }
  return res.json()
}

async function main() {
  const email = 'anthonyrivera51@gmail.com'

  console.log('1. Finding user in Clerk...')
  let clerkUser: any

  try {
    // Search by email
    const searchRes = await clerkRequest(`/users?email_address=${encodeURIComponent(email)}&limit=5`)
    clerkUser = searchRes.data?.find((u: any) =>
      u.email_addresses?.some((e: any) => e.email_address === email)
    )
  } catch (err: any) {
    console.log('   Search failed:', err.message)
  }

  if (!clerkUser) {
    console.log(`\n   ⚠ User not found in Clerk.`)
    console.log(`\n   Please create the user in Clerk Dashboard:`)
    console.log(`   1. Go to https://dashboard.clerk.com`)
    console.log(`   2. Select your project (bursting-hen-5)`)
    console.log(`   3. Go to "Users" → "Create user"`)
    console.log(`   4. Email: ${email}`)
    console.log(`   5. Password: LocalPlug1!`)
    console.log(`   6. After creation, run this script again\n`)
    process.exit(1)
  }

  console.log(`   ✓ Found Clerk user: ${clerkUser.id} (${clerkUser.email_addresses?.[0]?.email_address})`)

  console.log('\n2. Setting Clerk metadata (role: admin)...')
  await clerkRequest(`/users/${clerkUser.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      public_metadata: { role: 'admin' },
      private_metadata: { role: 'admin', permissions: ['*'] },
    }),
  })
  console.log('   ✓ Clerk metadata updated')

  console.log('\n3. Syncing to local database...')

  // Check if user already exists
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE clerk_id = ?',
    args: [clerkUser.id],
  })

  const firstName = clerkUser.first_name || 'Anthony'
  const lastName = clerkUser.last_name || 'Rivera'
  const fullName = `${firstName} ${lastName}`.trim()

  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (clerk_id, email, name, role_id, status, employee_status, created_at, updated_at)
            VALUES (?, ?, ?, 1, 'active', 'active', datetime('now'), datetime('now'))`,
      args: [clerkUser.id, email, fullName],
    })
    console.log('   ✓ User created in local DB with admin role (id=1)')
  } else {
    await db.execute({
      sql: `UPDATE users SET role_id = 1, status = 'active', name = ?, updated_at = datetime('now') WHERE clerk_id = ?`,
      args: [fullName, clerkUser.id],
    })
    console.log('   ✓ User updated in local DB with admin role')
  }

  // Verify
  const user = await db.execute({
    sql: `SELECT u.id, u.clerk_id, u.email, u.name, u.role_id, r.name as role_name
          FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.clerk_id = ?`,
    args: [clerkUser.id],
  })
  console.log('\n4. Verification:')
  console.log(JSON.stringify(user.rows[0], null, 2))

  console.log('\n✅ Admin user ready!')
  console.log(`   Email: ${email}`)
  console.log(`   Role: admin`)
  console.log(`   Clerk ID: ${clerkUser.id}`)

  await db.close()
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
