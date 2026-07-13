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

## Tipos de cambios / Change types

- `Added` / `Agregado` — nueva funcionalidad
- `Changed` / `Cambiado` — cambio en funcionalidad existente
- `Deprecated` / `Desaprobado` — pronto a ser eliminado
- `Removed` / `Eliminado` — funcionalidad eliminada
- `Fixed` / `Corregido` — arreglo de bug
- `Security` / `Seguridad` — arreglo de vulnerabilidad
