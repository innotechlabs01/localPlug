# Changelog

Todos los cambios notables a este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/),
y este proyecto sigue [Versionado Semántico](https://semver.org/).

## [Sin release - Rama `bugfix/page-and-api-fixes`] - 2026-07-13

### Fixed / Corregido

- **Driver App completamente rota** — el filtro de estado usaba valores incorrectos
  (`pending`/`offered` en lugar de `pending_acceptance`), por lo que los conductores
  nunca podían ver ni aceptar/rechazar asignaciones. Ahora coincide con el flujo real de la API.
- **Pago de planes subcobrado** — el total del plan se enviaba en dólares al formateador
  de centavos de Paddle, cobrando `$0.99` en lugar de `$99`. Ahora convierte
  USD → centavos correctamente.
- **Falsificación de confirmación de pago** — `/api/payments/confirm` nunca verificaba
  que la transacción de Paddle perteneciera a la reserva. Ahora valida que
  `custom_data.booking_reference` coincida.
- **Doble decimal en precio** — mostraba `$74.26.00 USD` en lugar de `$74.26 USD`.
- **Confirmación de reserva en fallo** — el usuario veía "Booking Confirmed!" incluso cuando
  el envío fallaba (encolado para reintento). Ahora solo se muestra en éxito.
- **Imagen rota en Feria** — typo `experencies-13.jpg` → `experiences-15.jpg` válido.
- **Página de Settings no funcional** — los checkboxes de notificaciones y los selects de
  Idioma/Regional usaban manipulación directa del DOM / elementos no controlados, por lo que
  los cambios se perdían al re-renderizar y nunca se guardaban. Ahora propermente
  vinculados al estado de React.
- **Fuga de PII en estado de pago** — `/api/payments/status` (público) devolvía
  email/nombre del cliente. Se eliminó la PII; el cliente solo usa el campo `status`.
- **Ancla incorrecta en Hero CTA** — "Explore Plans" apuntaba a `#services` (inexistente)
  en lugar de `#pricing`.
- **Tests fallando por aliases faltantes** — `vitest.config.ts` solo tenía
  `@` → raíz, pero el código usa `@lp/db/factory` y `@lp/shared` (de la
  extracción de paquetes `migration/platform-v2`). Se agregaron los aliases
  `@lp/*` para que los 148 tests pasen. (Pre-existent, no causado por los
  cambios anteriores).
- **Errores de TypeScript (`tsc --noEmit`)** — pre-existentes de la
  extracción `migration/platform-v2` y del feature de planes:
  - `packages/communication/src/kernel.ts`: imports `../contracts/*` → `./contracts/*`,
    y `event.type` (shorthand inválido) → `event: event.type` (campo de `ProcessingResult`).
  - `lib/db/migrate-plans.ts`: `SEED_PLANS` inferia `tours: never[]`; se agregó
    interfaz `SeedPlan`/`SeedTour`.
  - `lib/i18n/locales/{en,es}.ts`: falta clave `pricing.tours` usada por
    `pricing-section.tsx`. Ahora `tsc --noEmit` pasa sin errores.

### Archivos modificados / Modified files

- `app/driver/page.tsx` — filtro de estado de asignaciones
- `app/api/payments/create-intent/route.ts` — conversión USD→centavos para planes
- `app/api/payments/confirm/route.ts` — validación de `booking_reference`
- `app/components/booking/step-payment.tsx` — formato de precio
- `app/components/booking/booking-form.tsx` — confirmación solo en éxito
- `app/components/feria/feria-section.tsx` — ruta de imagen corregida
- `app/components/hero/hero-cta.tsx` — ancla `#pricing`
- `app/admin/settings/page.tsx` — estado controlado para toggles/selects
- `app/api/payments/status/route.ts` — eliminación de PII

### Notas / Notes

- La autenticación de APIs de Driver/Hotel se omite intencionalmente según el spec
  (selector de nombre / órdenes abiertas).
- PR: https://github.com/innotechlabs01/localPlug/pull/31

## [Sin release - Rama `feature/payout-ledger-realtime`] - 2026-09-04

### Added / Agregado

- **Sistema de pagos marketplace (split + liquidación)** — nuevo `payout_ledger`
  (una línea por reserva + beneficiario, snapshot en el hito), `payout_requests`
  (solicitudes de pago), `refunds_disputes` (registro de reembolsos/write-off) y
  `vehicle_categories` (tarifas por categoría, dinámicas, administradas desde admin).
- **Conductor paga semanal** — ganancia = tarifa de su categoría de vehículo
  (snapshot al completar el viaje); **Hotel paga mensual** — comisión liberada en
  `check-in`. Ambos cobran vía **solicitud de pago**; el admin consigna por
  transferencia y confirma desde el panel.
- **Panel admin "Liquidaciones y Tarifas"** (`/admin/settlements`) — CRUD de
  categorías + tarifas, lista de solicitudes con liquidar/cancelar, y vista de
  reembolsos con totales por resolución.
- **Track en tiempo real (outbox + eventos)** — tabla `events_outbox` append-only,
  `emitEvent`, `GET /api/events?since=` (cursor polling) + `GET /api/events/stream`
  (SSE), y hook cliente `useEventStream`. ~21 eventos conectados en bookings,
  pagos, reembolsos, driver (ofrecida/aceptada/rechazada/en ruta/recogida/completada/
  disponibilidad), hotel (check-in/out/cancelación), chat (message/escalada/IA),
  ratings, parking proofs y payouts. Push activo en admin completo, ia-chat, driver
  home + assignments, hotel reservations, settlements, parking-proofs y ratings.
- **Estado de cuenta descargable (CSV y PDF)** con selector de periodo para
  conductor (semanal) y hotel (mensual) — líneas por reserva + totales por estado
  (disponible/solicitado/pagado/write-off).
- **Contabilidad precisa** — `platformTake` = ingreso bruto − payouts conductores
  − payouts hoteles − refunds; KPIs de hoteles y reembolsos en el dashboard admin.
- **Garantía de esquema en runtime** — las tablas de pagos/realtime se auto-crean
  de forma idempotente al primer uso de la DB (sin depender del script de migración).

### Changed / Cambiado

- **Webhook Polar** — se eliminó el cálculo de split en `onOrderPaid` (el pasivo ya
  nace en el hito); se agregó `onOrderRefunded` (pre-hito cancela servicios y
  devuelve al cliente sin pasivo; post-hito genera write-off con registro).
- **`driver/earnings` e `income-summary`** leen del ledger en vez de calcular
  `base + parking` al vuelo.
- **`app/driver/settings`** corregido — mapeo snake_case real del perfil +
  selector de categoría de vehículo que muestra la tarifa de la carrera.
- **`app/api/admin/payments`** — payouts de driver/hotel desde el ledger.

### Fixed / Corregido

- **[CRÍTICO] Build de producción roto** — `scripts/backfill_dispatch_assignments.ts`
  importaba con extensión `.ts`, rompiendo `next build` (no se podía desplegar).
  Ahora `pnpm build` compila completo.
- **Race de esquema en DB fría** — `getDb()` ahora espera el ensure idempotente
  antes de la primera operación (Proxy sobre `execute`/`batch`).
- **Idempotencia del accrual** — índice único en `payout_ledger(booking, payee_type, payee_id)`
  para evitar duplicados ante replays.
- **`useEventStream`** — salta al tail en la primera conexión (no reproduce historial)
  y omite el polling en pestañas ocultas.
- **Crecimiento del outbox** — prune diario que conserva los 2000 eventos más recientes.
- **Tests de chat rompiéndose** — se mockea `@/lib/events-outbox` como no-op.

### Archivos modificados / Modified files

- `lib/payout.ts`, `lib/payout-receipt.ts`, `lib/events-outbox.ts`, `lib/use-event-stream.ts`, `lib/db/ensure-runtime.ts`
- `lib/db/migrations/040_payout_ledger.sql`, `041_payout_ledger_unique.sql`, `042_events_outbox.sql`
- `app/api/webhooks/polar/route.ts`, `app/api/driver/assignments/[id]/complete`, `app/api/hotel/orders/[id]/action`
- `app/api/admin/payouts`, `app/api/admin/vehicle-categories`, `app/api/admin/refunds`
- `app/api/driver/payout*`, `app/api/hotel/payout*`, `app/api/events*`, `app/api/chat/*`, `app/api/ratings`
- `app/admin/settlements`, `app/admin/page.tsx`, `app/admin/parking-proofs`, `app/admin/ia-chat`
- `app/driver/*`, `app/hotel/*`, `app/components/ratings/*`
- `docs/platform/02-architecture/event-driven.md`, `realtime.md`

### Notas / Notes

- `scripts/migrate.ts` no se puede re-correr en DB existente (migración 013 no
  idempotente, pre-existente) — se usa `scripts/apply-payout-migration.ts`.
- Migraciones `040/041/042` aplicadas a producción; además el ensure de runtime
  las garantiza en cualquier entorno.

## Tipos de cambios / Change types

- `Added` / `Agregado` — nueva funcionalidad
- `Changed` / `Cambiado` — cambio en funcionalidad existente
- `Deprecated` / `Desaprobado` — pronto a ser eliminado
- `Removed` / `Eliminado` — funcionalidad eliminada
- `Fixed` / `Corregido` — arreglo de bug
- `Security` / `Seguridad` — arreglo de vulnerabilidad
