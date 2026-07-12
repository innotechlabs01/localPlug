import { getDb } from '../client'
import * as schema from '../schema'

async function seed() {
  const db = getDb()

  console.log('[Seed] Starting database seed...')

  // Roles
  const roleData = [
    { name: 'admin', description: 'Super administrator with full access' },
    { name: 'manager', description: 'Manager with operational access' },
    { name: 'concierge', description: 'Concierge for daily operations' },
    { name: 'viewer', description: 'Read-only access' },
    { name: 'hotel_manager', description: 'Hotel manager with access to their hotel dashboard' },
    { name: 'driver', description: 'Driver with trip access' },
    { name: 'customer', description: 'Customer with booking access' },
  ]

  for (const r of roleData) {
    await db.insert(schema.roles).values(r).onConflictDoNothing()
  }
  console.log('[Seed] Roles inserted')

  // Modules
  const moduleData = [
    { name: 'Dashboard', slug: 'dashboard', icon: 'LayoutDashboard', sortOrder: 1 },
    { name: 'Dispatch', slug: 'dispatch', icon: 'Truck', sortOrder: 2 },
    { name: 'Reservations', slug: 'reservations', icon: 'CalendarCheck', sortOrder: 3 },
    { name: 'Drivers', slug: 'drivers', icon: 'Users', sortOrder: 4 },
    { name: 'Fleet', slug: 'fleet', icon: 'Car', sortOrder: 5 },
    { name: 'Customers', slug: 'customers', icon: 'UserCircle', sortOrder: 6 },
    { name: 'Support', slug: 'support', icon: 'MessageSquare', sortOrder: 7 },
    { name: 'Team', slug: 'employees', icon: 'Building2', sortOrder: 8 },
    { name: 'Analytics', slug: 'analytics', icon: 'BarChart3', sortOrder: 9 },
    { name: 'Payments', slug: 'payments', icon: 'CreditCard', sortOrder: 10 },
    { name: 'Settings', slug: 'settings', icon: 'Settings', sortOrder: 11 },
    { name: 'Roles & Permissions', slug: 'roles', icon: 'Shield', sortOrder: 12 },
    { name: 'Agenda', slug: 'agenda', icon: 'Calendar', sortOrder: 13 },
    { name: 'Cases', slug: 'cases', icon: 'FolderOpen', sortOrder: 14 },
    { name: 'Hotels', slug: 'hotels', icon: 'Building', sortOrder: 15 },
  ]

  for (const m of moduleData) {
    await db.insert(schema.modules).values(m).onConflictDoNothing()
  }
  console.log('[Seed] Modules inserted')

  // Default permissions
  const defaultPerms: Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }> = {
    admin: { view: true, create: true, update: true, delete: true },
    manager: { view: true, create: true, update: true, delete: false },
    concierge: { view: true, create: true, update: true, delete: false },
    viewer: { view: true, create: false, update: false, delete: false },
  }

  const restrictedPerms: Record<string, Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }>> = {
    employees: { manager: { view: true, create: false, update: false, delete: false }, concierge: { view: false, create: false, update: false, delete: false }, viewer: { view: false, create: false, update: false, delete: false } },
    payments: { concierge: { view: false, create: false, update: false, delete: false }, viewer: { view: false, create: false, update: false, delete: false } },
    settings: { concierge: { view: false, create: false, update: false, delete: false }, viewer: { view: false, create: false, update: false, delete: false } },
    roles: { manager: { view: false, create: false, update: false, delete: false }, concierge: { view: false, create: false, update: false, delete: false }, viewer: { view: false, create: false, update: false, delete: false } },
    analytics: { concierge: { view: true, create: false, update: false, delete: false } },
  }

  const rolesResult = await db.select().from(schema.roles)
  const roleMap: Record<string, number> = {}
  for (const row of rolesResult) {
    roleMap[row.name] = row.id
  }

  const modulesResult = await db.select().from(schema.modules)
  const moduleMap: Record<string, number> = {}
  for (const row of modulesResult) {
    moduleMap[row.slug] = row.id
  }

  for (const [roleName, perms] of Object.entries(defaultPerms)) {
    const roleId = roleMap[roleName]
    if (!roleId) continue

    for (const [slug, modId] of Object.entries(moduleMap)) {
      const restricted = restrictedPerms[slug]?.[roleName]
      const effectivePerms = restricted || perms

      await db.insert(schema.rolePermissions).values({
        roleId,
        moduleId: modId,
        canView: effectivePerms.view,
        canCreate: effectivePerms.create,
        canUpdate: effectivePerms.update,
        canDelete: effectivePerms.delete,
      }).onConflictDoNothing()
    }
  }
  console.log('[Seed] Role permissions inserted')

  // Experiences
  const experiences = [
    { id: 'comuna13' as const, name: 'Comuna 13 Tour', description: 'Urban art and culture tour', durationMinutes: 180, basePrice: 8900, maxParticipants: 20, includes: JSON.stringify(['Guide', 'Transport']), excludes: JSON.stringify(['Meals']), requirements: 'Comfortable shoes', images: JSON.stringify([]), isActive: true },
    { id: 'guatape' as const, name: 'Guatapé Day Trip', description: 'Colorful town and rock climbing', durationMinutes: 480, basePrice: 14900, maxParticipants: 15, includes: JSON.stringify(['Guide', 'Transport', 'Boat']), excludes: JSON.stringify(['Meals']), images: JSON.stringify([]), isActive: true },
    { id: 'coffee' as const, name: 'Coffee Farm Experience', description: 'Colombian coffee culture', durationMinutes: 300, basePrice: 11900, maxParticipants: 12, includes: JSON.stringify(['Guide', 'Tasting', 'Transport']), excludes: JSON.stringify(['Meals']), images: JSON.stringify([]), isActive: true },
    { id: 'paragliding' as const, name: 'Paragliding Adventure', description: 'Flight over Medellín', durationMinutes: 240, basePrice: 7900, maxParticipants: 8, includes: JSON.stringify(['Guide', 'Equipment', 'Transport']), excludes: JSON.stringify(['Meals']), requirements: 'No heart conditions', images: JSON.stringify([]), isActive: true },
    { id: 'nightlife' as const, name: 'Nightlife Experience', description: 'Best bars and clubs', durationMinutes: 300, basePrice: 24900, maxParticipants: 10, includes: JSON.stringify(['Guide', 'Drinks', 'Transport']), excludes: JSON.stringify(['Personal expenses']), images: JSON.stringify([]), isActive: true },
    { id: 'vip_city' as const, name: 'VIP City Tour', description: 'Private luxury tour', durationMinutes: 480, basePrice: 39900, maxParticipants: 6, includes: JSON.stringify(['Guide', 'Luxury transport', 'Meals', 'Entry fees']), excludes: JSON.stringify(['Personal shopping']), images: JSON.stringify([]), isActive: true },
  ]

  for (const exp of experiences) {
    await db.insert(schema.experiences).values(exp).onConflictDoNothing()
  }
  console.log('[Seed] Experiences inserted')

  // Default settings
  const defaultSettings = [
    { key: 'pkg_smooth_landing_price', value: '89' },
    { key: 'pkg_first_24_price', value: '159' },
    { key: 'pkg_full_insider_price', value: '269' },
    { key: 'return_trip_charge', value: '48' },
    { key: 'service_fee_flat', value: '5' },
    { key: 'tax_rate_iva', value: '0.19' },
    { key: 'hotel_commission_rate', value: '0.10' },
    { key: 'driver_commission_rate', value: '30' },
    { key: 'hotel_revenue_per_night', value: '85' },
    { key: 'trm_fallback_rate', value: '4200' },
    { key: 'advance_booking_days', value: '10' },
    { key: 'rate_limit_max_requests', value: '20' },
    { key: 'rate_limit_window_ms', value: '60000' },
    { key: 'payment_intent_timeout_ms', value: '60000' },
    { key: 'payment_polling_interval_ms', value: '2000' },
    { key: 'payment_polling_max_attempts', value: '30' },
    { key: 'default_currency', value: 'usd' },
    { key: 'default_timezone', value: 'America/Bogota' },
    { key: 'default_language', value: 'en' },
    { key: 'date_format', value: 'MM/DD/YYYY' },
    { key: 'admin_refresh_interval_ms', value: '30000' },
    { key: 'chat_connection_timeout_ms', value: '90000' },
    { key: 'chat_reconnect_timeout_ms', value: '60000' },
    { key: 'inactivity_timeout_ms', value: '900000' },
    { key: 'exp_comuna13_price', value: '89' },
    { key: 'exp_guatape_price', value: '149' },
    { key: 'exp_coffee_price', value: '119' },
    { key: 'exp_paragliding_price', value: '79' },
    { key: 'exp_nightlife_price', value: '249' },
    { key: 'exp_vip_city_price', value: '399' },
    { key: 'platform_fee_percent', value: '0.10' },
    { key: 'platform_fee_fixed', value: '0.30' },
  ]

  for (const s of defaultSettings) {
    await db.insert(schema.settings).values(s).onConflictDoNothing()
  }
  console.log('[Seed] Default settings inserted')

  // Dispatch zones
  const zones = [
    { name: 'Centro', centerLat: 6.244, centerLng: -75.574, radiusKm: 5, isActive: true, priority: 1 },
    { name: 'El Poblado', centerLat: 6.209, centerLng: -75.575, radiusKm: 8, isActive: true, priority: 2 },
    { name: 'Laureles', centerLat: 6.259, centerLng: -75.593, radiusKm: 6, isActive: true, priority: 3 },
    { name: 'Envigado', centerLat: 6.167, centerLng: -75.585, radiusKm: 7, isActive: true, priority: 4 },
    { name: 'Sabaneta', centerLat: 6.147, centerLng: -75.603, radiusKm: 5, isActive: true, priority: 5 },
  ]

  for (const z of zones) {
    await db.insert(schema.dispatchZones).values(z).onConflictDoNothing()
  }
  console.log('[Seed] Dispatch zones inserted')

  console.log('[Seed] Database seed completed successfully')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Failed:', err)
      process.exit(1)
    })
}

export { seed }
