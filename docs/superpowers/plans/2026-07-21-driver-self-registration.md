# Driver Self-Registration & Active Status Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drivers self-register, fill in vehicle details on first login, toggle active/inactive status, and only active drivers appear in dispatch.

**Architecture:** Clerk `<SignUp />` for self-registration → auto-create driver profile on first login → profile completion form → active/inactive toggle in sidebar → dispatch filters by `status = 'available'`.

**Tech Stack:** Next.js 15, Clerk auth, SQLite (Turso), inline styles with CSS variables.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/sign-up/driver/[[...sign-up]]/page.tsx` | Create | Driver self-registration page |
| `middleware.ts` | Modify | Add `/sign-up(.*)` to public routes |
| `app/driver/layout.tsx` | Modify | Fix race condition, add active/inactive toggle |
| `app/api/driver/status/route.ts` | Create | Toggle driver active/inactive status |
| `app/api/admin/dispatch/route.ts` | Modify | Filter drivers by `status IN ('available','active')` |
| `app/admin/dispatch/page.tsx` | Modify | Frontend filter for active drivers only |
| `lib/driver/auth.ts` | Modify | Set initial status to `inactive` (not `available`) |

---

### Task 1: Create Driver Sign-Up Page

**Files:**
- Create: `app/sign-up/driver/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Create the sign-up page**

```tsx
'use client'

import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useI18n } from '@/lib/i18n'

export default function DriverSignUpPage() {
  const { t } = useI18n()

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-dark, #0a0a0a)',
    }}>
      {/* Left branding panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="driver-signup-branding"
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(74,222,128,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))',
          border: '1px solid rgba(74,222,128,0.2)',
          marginBottom: 24, position: 'relative',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 700, color: '#fff',
          marginBottom: 8, textAlign: 'center', position: 'relative',
          fontFamily: 'var(--font-display)',
        }}>
          Driver Portal
        </h1>
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.6)',
          textAlign: 'center', maxWidth: 320, lineHeight: 1.6,
          position: 'relative',
        }}>
          Registrate para comenzar a recibir asignaciones y ganar con LocalPlug
        </p>
        <div style={{
          display: 'flex', gap: 8, marginTop: 32, flexWrap: 'wrap',
          justifyContent: 'center', position: 'relative',
        }}>
          {['Asignaciones', 'Rutas', 'Ganancias'].map((label) => (
            <span key={label} style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.15)',
              color: 'rgba(74,222,128,0.8)',
              fontSize: 12, fontWeight: 500,
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        background: 'var(--bg-dark, #0a0a0a)',
        position: 'relative',
      }}
        className="driver-signup-form"
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))',
              border: '1px solid rgba(74,222,128,0.2)',
              marginBottom: 16, margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </div>
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
              marginBottom: 4,
            }}>
              Crear Cuenta
            </h2>
            <p style={{
              fontSize: 14, color: 'var(--text-muted)',
            }}>
              Completa tus datos para empezar
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: 380 }}>
            <SignUp
              routing="path"
              path="/sign-up/driver"
              forceRedirectUrl="/driver"
              appearance={{
                baseTheme: dark,
                elements: {
                  rootBox: { width: '100%' },
                  card: {
                    background: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    padding: 0,
                    width: '100%',
                  },
                  formButtonPrimary: {
                    background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                    color: '#000',
                    fontWeight: 600,
                    borderRadius: 10,
                    padding: '12px 0',
                    fontSize: 14,
                    textTransform: 'none',
                    boxShadow: '0 2px 12px rgba(74,222,128,0.3)',
                    transition: 'all 200ms ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      boxShadow: '0 4px 20px rgba(74,222,128,0.4)',
                      transform: 'translateY(-1px)',
                    },
                  },
                  formFieldInput: {
                    background: 'var(--bg-secondary, #161b22)',
                    border: '1px solid var(--border, #30363d)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    padding: '10px 12px',
                    transition: 'border-color 200ms ease',
                    '&:focus': {
                      borderColor: '#4ade80',
                      boxShadow: '0 0 0 2px rgba(74,222,128,0.15)',
                    },
                  },
                  formFieldLabel: {
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                  },
                  footerActionLink: {
                    color: '#4ade80',
                    fontWeight: 500,
                    '&:hover': { color: '#22c55e' },
                  },
                  headerTitle: {
                    color: 'var(--text-primary)',
                    fontSize: 20,
                    fontWeight: 700,
                  },
                  headerSubtitle: {
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  },
                  dividerLine: {
                    background: 'var(--border)',
                  },
                  dividerText: {
                    color: 'var(--text-muted)',
                  },
                  socialButtonsBlockButton: {
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    '&:hover': {
                      background: 'var(--surface-hover)',
                    },
                  },
                  socialButtonsBlockButtonText: {
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  },
                  formFieldAction: {
                    color: '#4ade80',
                    fontSize: 13,
                    fontWeight: 500,
                  },
                  identityPreviewEditButton: {
                    color: '#4ade80',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile: hide branding */}
      <style>{`
        @media (max-width: 768px) {
          .driver-signup-branding { display: none !important; }
          .driver-signup-form { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/sign-up/driver/[[...sign-up]]/page.tsx
git commit -m "feat(driver): add self-registration page with Clerk SignUp"
```

---

### Task 2: Add `/sign-up` to Public Routes in Middleware

**Files:**
- Modify: `middleware.ts:6-33`

- [ ] **Step 1: Add sign-up route to public routes**

In `middleware.ts`, add `/sign-up(.*)` to the `isPublicRoute` matcher array (after line 32, the `/sign-in(.*)` entry):

```typescript
const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
  '/booking/confirmation',
  '/api/booking',
  '/api/payments/status',
  '/api/payments/create-intent',
  '/api/payments/confirm',
  '/api/flights/validate',
  '/api/bookings/search',
  '/api/webhooks/(.*)',
  '/api/admin/lookup',
  '/api/chat/start',
  '/api/chat/send',
  '/api/chat/rating',
  '/api/chat/request-escalate',
  '/api/chat/close',
  '/api/ratings(.*)',
  '/api/hotels(.*)',
  '/api/promotions/validate(.*)',
  '/api/config',
  '/api/health(.*)',
  '/api/cron/(.*)',
  '/api/plans',
  '/api/trm',
  '/api/geocode',
  '/sign-in(.*)',
  '/sign-up(.*)',
])
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "fix(middleware): add /sign-up to public routes for driver self-registration"
```

---

### Task 3: Fix Race Condition in Driver Layout

**Files:**
- Modify: `app/driver/layout.tsx:65-68`

The current code fires `ensure` and `claim-role` in parallel. If `claim-role` runs before `ensure` creates the driver, it returns 404. Fix: fire sequentially.

- [ ] **Step 1: Fix the useEffect to fire sequentially**

Replace lines 65-68 in `app/driver/layout.tsx`:

```typescript
  // Auto-create driver profile + fix role mismatch on first load
  useEffect(() => {
    fetch('/api/driver/ensure')
      .then(() => fetch('/api/driver/claim-role'))
      .catch(() => {})
  }, [])
```

- [ ] **Step 2: Commit**

```bash
git add app/driver/layout.tsx
git commit -m "fix(driver): fix ensure/claim-role race condition in layout"
```

---

### Task 4: Create Active/Inactive Toggle API

**Files:**
- Create: `app/api/driver/status/route.ts`

- [ ] **Step 1: Create the status toggle endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request) {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await req.json()
    const { status } = body

    if (status !== 'available' && status !== 'inactive') {
      return NextResponse.json({ error: 'Status must be "available" or "inactive"' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `UPDATE drivers SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [status, result.driver.id],
    })

    console.log(`[Driver Status] ${result.driver.name} → ${status}`)
    return NextResponse.json({ success: true, status })
  } catch (err) {
    console.error('[Driver Status]', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/driver/status/route.ts
git commit -m "feat(driver): add active/inactive status toggle API"
```

---

### Task 5: Add Active/Inactive Toggle to Driver Layout

**Files:**
- Modify: `app/driver/layout.tsx`

- [ ] **Step 1: Add state and toggle handler**

Add imports and state at the top of the component (after line 61):

```typescript
  const [driverStatus, setDriverStatus] = useState<string>('inactive')
  const [toggling, setToggling] = useState(false)
```

- [ ] **Step 2: Fetch status on mount**

Update the useEffect to also fetch the driver status:

```typescript
  // Auto-create driver profile + fix role mismatch on first load
  useEffect(() => {
    fetch('/api/driver/ensure')
      .then(() => fetch('/api/driver/claim-role'))
      .then(() => fetch('/api/driver/profile'))
      .then(r => r.json())
      .then(data => {
        if (data.driver?.status) setDriverStatus(data.driver.status)
      })
      .catch(() => {})
  }, [])
```

- [ ] **Step 3: Add toggle handler**

Add the toggle function:

```typescript
  const toggleStatus = async () => {
    if (toggling) return
    setToggling(true)
    try {
      const newStatus = driverStatus === 'available' ? 'inactive' : 'available'
      const res = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setDriverStatus(newStatus)
      }
    } catch {
      // ignore
    } finally {
      setToggling(false)
    }
  }
```

- [ ] **Step 4: Add toggle button to sidebar (before sign-out button)**

Insert before the sign-out button section (before line 170):

```tsx
        <div style={{ padding: '12px 8px 4px' }}>
          <button
            onClick={toggleStatus}
            disabled={toggling}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: driverStatus === 'available' ? '#4ade80' : 'var(--text-muted)',
              background: driverStatus === 'available' ? 'rgba(74,222,128,0.1)' : 'transparent',
              border: `1px solid ${driverStatus === 'available' ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
              cursor: toggling ? 'wait' : 'pointer',
              transition: 'all 200ms ease',
              opacity: toggling ? 0.6 : 1,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: driverStatus === 'available' ? '#4ade80' : 'var(--text-muted)',
                boxShadow: driverStatus === 'available' ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
              }} />
              {driverStatus === 'available' ? 'Activo' : 'Inactivo'}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              transform: driverStatus === 'available' ? 'scaleX(1)' : 'scaleX(-1)',
            }}>
              {driverStatus === 'available' ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </button>
        </div>
```

- [ ] **Step 5: Commit**

```bash
git add app/driver/layout.tsx
git commit -m "feat(driver): add active/inactive toggle to sidebar"
```

---

### Task 6: Set Initial Status to Inactive for New Drivers

**Files:**
- Modify: `lib/driver/auth.ts:88`

New drivers should start as `inactive` so they must explicitly activate after completing their profile.

- [ ] **Step 1: Change INSERT status from 'available' to 'inactive'**

In `lib/driver/auth.ts`, change line 88:

```typescript
      'inactive', 5.0, 'Spanish', 'Standard', 0,
```

(Previously was `'available'`)

- [ ] **Step 2: Commit**

```bash
git add lib/driver/auth.ts
git commit -m "fix(driver): new drivers start as inactive, must activate after profile"
```

---

### Task 7: Filter Dispatch to Show Only Active Drivers

**Files:**
- Modify: `app/api/admin/dispatch/route.ts:56-66`
- Modify: `app/admin/dispatch/page.tsx` (driver list rendering)

- [ ] **Step 1: Update dispatch API to filter active drivers**

In `app/api/admin/dispatch/route.ts`, change line 56:

```typescript
    let driverSql = `SELECT * FROM drivers WHERE status IN ('available', 'active')`
```

Remove the old `WHERE 1=1` and add the status filter. The category filter still applies on top:

```typescript
    let driverSql = `SELECT * FROM drivers WHERE status IN ('available', 'active')`
    const driverArgs: (string | number)[] = []

    if (driverCat !== 'all') {
      driverSql += ' AND category = ?'
      driverArgs.push(driverCat)
    }

    driverSql += ' ORDER BY rating DESC'
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/dispatch/route.ts
git commit -m "fix(dispatch): filter drivers to only show active/available"
```

---

### Task 8: Verify & Test

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: 0 errors (warnings from packages/ are pre-existing)

- [ ] **Step 2: Test sign-up flow locally**

1. Navigate to `http://localhost:3000/sign-up/driver`
2. Verify Clerk SignUp component renders with green theme
3. Complete sign-up → should redirect to `/driver`
4. Driver should see profile form (profile_complete = 0)
5. Fill in vehicle details → save → profile_complete = 1
6. Toggle active/inactive in sidebar → status changes
7. Check dispatch page → only active drivers shown

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: driver self-registration flow final adjustments"
```

- [ ] **Step 4: Push to develop and QA**

```bash
git push origin develop
git checkout qa && git merge develop && git push origin qa && git checkout develop
```
