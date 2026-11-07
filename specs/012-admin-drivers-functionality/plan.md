# Implementation Plan: Admin Drivers

## Overview
Sistema completo de gestión de conductores con dashboard operativo, compliance monitoring, performance tracking y gestión documental.

---

## Phase 1 — Core Dashboard ✅ (Completado)

### UI Components (app/admin/drivers/page.tsx)
| Feature | Archivo | Estado |
|---------|---------|--------|
| KPIs (6 cards) | page.tsx | ✅ |
| Filter chips (7 status) | page.tsx | ✅ |
| Compliance alerts panel | page.tsx | ✅ |
| Eligibility grid | page.tsx | ✅ |
| Driver cards grid (2-col) | page.tsx | ✅ |
| Search (por nombre, placa, vehículo) | page.tsx | ✅ |
| Side panel — Profile | page.tsx | ✅ |
| Side panel — Compliance docs | page.tsx | ✅ |
| Side panel — Performance metrics | page.tsx | ✅ |
| Score ring + metric bars | page.tsx | ✅ |
| Empty / loading / error states | page.tsx | ✅ |
| Toast notifications | page.tsx | ✅ |

### API (app/api/admin/drivers/route.ts)
| Method | Uso | Estado |
|--------|-----|--------|
| `GET` | Listar drivers con active_orders | ✅ |
| `POST` | Crear driver (name, phone, email, vehicle, plate, category, languages) | ✅ |
| `PUT` | Actualizar cualquier campo dinámico | ✅ |
| `DELETE` | Soft-delete (status = inactive) | ✅ |

### Create Driver Modal
| Campo | Estado |
|-------|--------|
| Full name | ✅ |
| Phone / Email / Languages | ✅ |
| Vehicle / Plate / Type | ✅ |
| Experience level | ✅ |
| Operational notes | ✅ |

### Spec
| Documento | Estado |
|-----------|--------|
| spec.md | ✅ Actualizado |
| plan.md | ✅ Actualizado |

---

## Phase 2 — Document Compliance 🟡 (En progreso — requiere DB)

### Database Migration (cuando Supabase responda)
```sql
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS doc_status TEXT DEFAULT 'valid';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_expiry TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS soat_expiry TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tech_inspection_expiry TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_expiry TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS capacity TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city TEXT;
```

### API Updates
- [ ] `POST` — aceptar license_expiry, soat_expiry, year, capacity, emergency fields
- [ ] `GET` — calcular `doc_status` automáticamente según fechas de expiración
- [ ] Endpoint `PATCH /:id/documents` — actualizar docs individuales

### UI Updates
- [ ] Fechas de expiración en el modal de creación (date pickers)
- [ ] Campos de contacto de emergencia
- [ ] Indicador visual de "expirando pronto" (warning) en compliance panel

---

## Phase 3 — Extended Driver Management 🟡 (En progreso)

### Features
- [ ] **Editar driver** — Modal de edición con datos precargados
- [ ] **Document uploads** — Drag & drop para license, SOAT, insurance, photos
- [ ] **Driver photo** — Avatar upload con preview
- [ ] **Historial de cambios** — Timeline de asignaciones y cambios de estado
- [ ] **Notas internas** — Section de notas de operaciones

### API
- [ ] `PUT /:id/photo` — Subir foto de perfil
- [ ] `POST /:id/documents` — Subir documentos
- [ ] `GET /:id/history` — Historial de cambios

---

## Phase 4 — Performance & Analytics ⬜ (Futuro)

### Features
- [ ] **Revenue tracking** — Ingresos generados por driver con gráficos
- [ ] **Customer reviews** — Rating promedio por viaje con desglose
- [ ] **VIP services completed** — Conteo y revenue de servicios VIP
- [ ] **Cancellation rate** — % de cancelaciones con tendencia
- [ ] **On-time performance** — % de llegadas a tiempo al pickup
- [ ] **Ranking board** — Top drivers por mes/trimestre

### Database
```sql
CREATE TABLE driver_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL,
  period TEXT NOT NULL, -- '2026-05'
  trips_completed INTEGER DEFAULT 0,
  revenue_generated REAL DEFAULT 0,
  vip_services INTEGER DEFAULT 0,
  cancellations INTEGER DEFAULT 0,
  avg_rating REAL DEFAULT 0,
  on_time_rate REAL DEFAULT 0,
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
```

---

## Phase 5 — Fleet Integration ⬜ (Futuro)

### Features
- [ ] **Vehicle maintenance tracking** — Mantenimiento programado por vehículo
- [ ] **Fuel efficiency** — Consumo por driver/vehículo
- [ ] **GPS integration** — Live tracking en mapa
- [ ] **Zone coverage** — Cobertura geográfica por driver
- [ ] **Shift scheduling** — Turnos y disponibilidad calendarizada

---

## Architecture

```
app/admin/drivers/
  page.tsx                        ← Full page (unified component)

app/api/admin/drivers/
  route.ts                        ← GET, POST, PUT, DELETE
  [id]/
    documents/route.ts            ← Phase 3
    history/route.ts             ← Phase 3
    photo/route.ts               ← Phase 3

lib/
  drivers-types.ts                ← Phase 2 (optional - types inline por ahora)
  drivers-api.ts                  ← Phase 2 (optional)

supabase/migrations/
  XXX_add_driver_compliance.sql   ← Phase 2
```

## Dependencies
- ✅ Auth (Clerk) — ya integrado
- ✅ DB connection — funcionando (timeouts esporádicos)
- ⬜ File storage (upload de documentos/fotos) — Phase 3
- ⬜ GPS/maps API — Phase 5
