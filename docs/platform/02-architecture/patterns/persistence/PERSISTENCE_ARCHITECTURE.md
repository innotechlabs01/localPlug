# Persistence Architecture (B8)

> **Constitución Técnica de LocalPlug — Capa de Persistencia.**
> Define cómo cualquier dato entra y sale de la plataforma. Toda implementación
> de repositorios, servicios de dominio y capas de acceso a datos debe seguir
> este documento como referencia única.
>
> Companion: `IMPLEMENTATION_RULES.md` (contracto de ejecución),
> `MIGRATION_BACKLOG.md` (orden de pasos), `ddd.md` (bounded contexts).

---

## 1. Filosofía

```
Business Domain
       ↓
Repository Interface (contract)
       ↓
Persistence Layer (implementation)
       ↓
Database (Drizzle → LibSQL/Turso)
```

**Regla fundamental:** El dominio nunca conoce el mecanismo de persistencia.

| Nunca en el dominio | Siempre en la persistencia |
|---|---|
| `import { sql } from 'drizzle-orm'` | Query builder dentro del repository |
| `SELECT ... FROM orders` | Raw SQL dentro del repository |
| `process.env.TURSO_*` | Configuración del factory |
| Cache invalidation lógica | Implementación del repository |
| Redis, MongoDB, etc. | Detalle de infraestructura |

El dominio expresa **intención** ("necesito esta reserva"), el repository la
**traduce** a la consulta adecuada. Si mañana cambias de Drizzle a Prisma, o
de Turso a PlanetScale, el dominio no se entera.

---

## 2. Repository Contract

### 2.1 Interfaz base

Cada dominio implementa una interfaz conceptual common. No significa que
todos tengan exactamente estos métodos, pero sí la misma filosofía:

```typescript
interface Repository<T, TId = number, TFilters = Record<string, unknown>> {
  // ── Lecturas ──
  findById(id: TId): Promise<T | null>
  findMany(filters: TFilters): Promise<PaginatedResult<T>>
  exists(filters: TFilters): Promise<boolean>
  count(filters: TFilters): Promise<number>

  // ── Escrituras ──
  create(data: CreateInput<T>): Promise<T>
  update(id: TId, data: UpdateInput<T>): Promise<T | null>
  delete(id: TId): Promise<boolean>          // soft delete
  deleteHard(id: TId): Promise<boolean>      // hard delete (admin only)

  // ── Transacciones ──
  // NO inician transacciones — ver §4
}
```

### 2.2 Convenciones de nombres

| Método | Acción | Retorna |
|---|---|---|
| `findById(id)` | Busca por PK | `T \| null` |
| `findMany(filters)` | Lista paginada | `PaginatedResult<T>` |
| `exists(filters)` | ¿Existe al menos uno? | `boolean` |
| `count(filters)` | Cuenta coincidencias | `number` |
| `create(data)` | Inserta registro | `T` (con ID asignado) |
| `update(id, data)` | Actualiza registro | `T \| null` (null si no existe) |
| `delete(id)` | Soft delete | `boolean` |
| `deleteHard(id)` | Hard delete (admin) | `boolean` |

### 2.3 Tipos de retorno

```typescript
interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
```

### 2.4 Repositorios existentes (B4 stubs)

B4 ya define repositorios en `packages/db/src/repositories/index.ts`.
Estos son **stubs** que siguen la filosofía pero con implementaciones
parciales. B8 formaliza el contrato; B8+ los implementa completamente.

| Repository | Estado | Dominio |
|---|---|---|
| `bookingRepository` | Stub (parcial) | Booking |
| `driverRepository` | Stub | Drivers |
| `vehicleRepository` | Stub | Vehicles |
| `assignmentRepository` | Stub | Dispatch |
| `paymentRepository` | Stub | Payments |
| + 18 stubs más | Stub | Varios |

**Regla:** Un stub no entra en producción. Se completa con tests antes de
ser consumido por un servicio de dominio.

---

## 3. Queries — Commands vs Queries

Separar claramente operaciones de lectura y escritura. No mezclar.

### 3.1 Commands (escrituran)

```typescript
// Un command modifica estado y produce efectos colaterales
async function createBooking(input: CreateBookingInput): Promise<Booking> {
  return withTransaction(async (tx) => {
    const booking = await bookingRepo.create(input)
    await eventBus.emit('booking.created', { bookingId: booking.id })
    return booking
  })
}
```

### 3.2 Queries (leen)

```typescript
// Un query solo lee, nunca modifica estado
async function getBookingSummary(bookingId: number): Promise<BookingSummary> {
  const booking = await bookingRepo.findById(bookingId)
  if (!booking) throw new NotFoundError('Booking', bookingId)
  return mapToSummary(booking)
}
```

### 3.3 Por qué importa

| Command | Query |
|---|---|
| Puede lanzar eventos | Nunca lanzar eventos |
| Debe usar transacción | Puede usar lectura de replica |
| Modifica una aggregate root | Lee de una o más tablas |
| Validación estricta | Validación de filtros |
| Logging de auditoría | Cacheable |

Si en el futuro decides implementar CQRS, la migración será casi gratis
porque la separación ya está en el diseño.

---

## 4. Transactions

### 4.1 Regla

**Nunca iniciar transacciones dentro del dominio.**

Siempre:

```
Application Service
       ↓
   withTransaction()
       ↓
   Repositories (reciben tx como argumento)
```

Nunca:

```
BookingRepository
       ↓
   db.begin() / db.transaction()
```

### 4.2 Uso

```typescript
import { withTransaction } from '@lp/db'

// Application Service
async function cancelBooking(bookingId: number, reason: string) {
  return withTransaction(async (tx) => {
    // Repositories reciben tx — NO crean su propia conexión
    const booking = await bookingRepo.findByIdtx(bookingId)
    if (!booking) throw new NotFoundError('Booking', bookingId)

    booking.status = 'cancelled'
    await bookingRepo.update(bookingId, { status: 'cancelled' }, tx)
    await refundRepo.create({ bookingId, reason }, tx)
    await eventBus.emit('booking.cancelled', { bookingId, reason }, tx)

    return booking
  })
}
```

### 4.3 Implementación actual

`packages/db/src/transaction.ts` exporta:
- `withTransaction(fn)` — Drizzle's `db.transaction(fn)`
- `runInTransaction(fn)` — alias
- `withRetry(fn)` — retry con backoff exponencial

**Transición:** Cuando `use-drizzle=OFF`, las transacciones no están
disponibles (legacy path no soporta transacciones de Drizzle). Esto es
aceptable porque el legacy path no las usa actualmente.

---

## 5. Unit of Work

### 5.1 Decisión

**LocalPlug SÍ usará Unit of Work. No implementarla todavía. Diseñar para ella.**

### 5.2 Diseño para Unit of Work

El patrón actual (pasar `tx` explícitamente) es compatible con Unit of Work
futuro. Cuando se implemente:

```typescript
// Futuro — Unit of Work
const uow = createUnitOfWork(db)

uow.bookings.update(bookingId, { status: 'cancelled' })
uow.refunds.create({ bookingId, reason })
uow.events.add('booking.cancelled', { bookingId })

await uow.commit()  // una sola transacción
```

### 5.3 ¿Por qué esperar?

- Unit of Work agrega complejidad significativa
- Hoy no hay servicios que modifiquen múltiples aggregate roots
  en una sola operación (excepto cancelación de Booking)
- Cuando B13 (Booking) + B14 (Dispatch) + B19 (Payments) estén
  completos, el caso de uso de Unit of Work será claro
- Diseñar la interfaz de repositorios para que `tx` sea opcional
  permite migrar sin cambios

---

## 6. Specifications (Filtros)

### 6.1 Regla

**No llenar repositorios de métodos de consulta específicos.**

Mal:

```typescript
bookingRepository.findBookingsByHotel()
bookingRepository.findBookingsByAirport()
bookingRepository.findBookingsByStatus()
bookingRepository.findBookingsByDriver()
bookingRepository.findBookingsByVehicle()
bookingRepository.findBookingsByCustomer()
bookingRepository.findBookingsCreatedToday()
```

Bien:

```typescript
bookingRepository.findMany(BookingFilters)
```

### 6.2 Definición de filtros

Cada dominio define su tipo de filtros como un DTO:

```typescript
interface BookingFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Filtros específicos del dominio
  status?: BookingStatus
  dispatchStatus?: DispatchStatus
  hotelId?: number
  driverId?: number
  passengerEmail?: string
  passengerPhone?: string
  dateFrom?: string    // ISO date
  dateTo?: string      // ISO date
}
```

### 6.3 Composición de filtros

Para consultas complejas, usar composición:

```typescript
// Specification pattern (futuro, no implementar aún)
interface Specification<T> {
  isSatisfiedBy(entity: T): boolean
  toQuery(): QueryFragment
}

// Uso conceptual
const activeHotelBookings = BookingSpecification
  .forHotel(hotelId)
  .withStatus('confirmed')
  .arrivingBetween(dateFrom, dateTo)

bookingRepository.findMany(activeHotelBookings.toFilters())
```

### 6.4 Reglas de filtros

1. **Filtros son opcionales** — `findMany({})` retorna todos
2. **Filtros son tipos** — no strings, no any
3. **Filtros se validan con Zod** — en la capa de API antes del repository
4. **Filtros no contienen lógica de negocio** — son parámetros de consulta
5. **Un filtro por campo** — no filtros compuestos (usar specification para eso)

---

## 7. Pagination

### 7.1 Convención única

**Una sola convención para toda la plataforma. No mezclar.**

```typescript
interface PaginationParams {
  page: number     // 1-indexed (no 0-indexed)
  limit: number    // default: 20, max: 100
  sortBy?: string  // nombre de columna
  sortOrder?: 'asc' | 'desc'  // default: 'desc'
}

interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}
```

### 7.2 Restricciones

| Parámetro | Permitido | Prohibido |
|---|---|---|
| `page` | `1`, `2`, `3`... | `0`, `-1` |
| `limit` | `1`–`100` | `>100`, `0` |
| `sortBy` | Columnas del schema | `*`, subqueries |
| `sortOrder` | `'asc'`, `'desc'` | `'ASC'`, `'DESC'`, `'random'` |

### 7.3 Implementación

```typescript
function applyPagination(query: any, params: PaginationParams): any {
  const { page, limit, sortBy, sortOrder } = params
  const offset = (page - 1) * limit

  if (sortBy) {
    const col = getValidColumn(sortBy)  // whitelist de columnas
    query = query.orderBy(sortOrder === 'asc' ? asc(col) : desc(col))
  }

  return query.limit(limit).offset(offset)
}
```

---

## 8. Soft Delete

### 8.1 Política

**Usar `deleted_at` (timestamp nullable). No mezcar `is_deleted`, `deleted`, `active`, etc.**

| Estado | Valor de `deleted_at` |
|---|---|
| Activo | `NULL` |
| Eliminado | `2024-01-15T10:30:00Z` (timestamp de eliminación) |

### 8.2 Implementación

```typescript
// En el schema Drizzle
export const orders = sqliteTable('orders', {
  // ... columnas ...
  deletedAt: text('deleted_at'),  // nullable timestamp
})

// En el repository
async delete(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.update(schema.orders)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.orders.id, id))
  return result.rowsAffected > 0
}

// En findMany — excluir eliminados por defecto
async findMany(filters: BookingFilters) {
  const conditions = [isNull(schema.orders.deletedAt)]  // ← siempre
  if (filters.status) conditions.push(eq(schema.orders.status, filters.status))
  // ...
}
```

### 8.3 Hard delete

Solo para admin. Siempre con confirmación explícita:

```typescript
async deleteHard(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.delete(schema.orders)
    .where(eq(schema.orders.id, id))
  return result.rowsAffected > 0
}
```

### 8.4 Tablas que NO usan soft delete

- `settings` — se sobrescribe con `INSERT OR REPLACE`
- `outgoing_messages` — se limpia con job de mantenimiento
- `whatsapp_events` — eventos inmutables

---

## 9. Auditing

### 9.1 Modelo

Cada repository debe saber dónde ocurre el audit event.
No automáticamente. Sí dónde ocurre.

```
Command ejecuta
       ↓
   Repository modifica datos
       ↓
   Audit Event se registra
       ↓
   Outbox lo captura
       ↓
   Analytics + Notifications lo procesan
```

### 9.2 Tipos de evento auditables

| Evento | Trigger | Ejemplo |
|---|---|---|
| `entity.created` | `repository.create()` | `booking.created` |
| `entity.updated` | `repository.update()` | `booking.status_changed` |
| `entity.deleted` | `repository.delete()` | `booking.cancelled` |
| `entity.accessed` | `repository.findById()` (admin) | `driver.viewed_by_admin` |

### 9.3 Implementación futura (B10 — Event Bus)

```typescript
// Conceptual — no implementar hasta B10
await bookingRepo.create(data)
await eventBus.outbox.add({
  entity: 'booking',
  action: 'created',
  entityId: booking.id,
  performedBy: ctx.userId,
  timestamp: new Date(),
  snapshot: booking,  // para analytics
})
```

### 9.4 ¿Por qué no automáticamente?

- No todos los reads necesitan audit (ej: dashboard polls)
- El audit tiene costo de performance
- El evento debe incluir el contexto del usuario (ctx.userId)
- Automatizarlo implica acoplar repository con event bus

---

## 10. Testing — Repository Contract Tests

### 10.1 Regla

**Todos los repositorios pasan exactamente las mismas pruebas contractuales.**

Eso evita implementaciones inconsistentes y garantiza que cambiar de
repository (ej: de stub a Drizzle) no rompa el contrato.

### 10.2 Test suite contract

```typescript
// tests/repositories/contract/repository-contract.test.ts

import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Suite de testing que todo repository debe pasar.
 * Cada dominio implementa createTestRepository() que retorna
 * el repository específico + factory de datos de prueba.
 */
function describeRepositoryContract<T extends { id: number }>(
  name: string,
  createTestRepo: () => {
    repository: Repository<T>
    factory: () => CreateInput<T>
  }
) {
  describe(`${name} — Repository Contract`, () => {
    let repo: Repository<T>
    let factory: () => CreateInput<T>

    beforeEach(() => {
      const setup = createTestRepo()
      repo = setup.repository
      factory = setup.factory
    })

    describe('CRUD', () => {
      it('create: returns entity with id', async () => {
        const input = factory()
        const result = await repo.create(input)
        expect(result.id).toBeDefined()
        expect(result).toMatchObject(input)
      })

      it('findById: returns entity by id', async () => {
        const created = await repo.create(factory())
        const found = await repo.findById(created.id)
        expect(found).toEqual(created)
      })

      it('findById: returns null for non-existent', async () => {
        const found = await repo.findById(999999)
        expect(found).toBeNull()
      })

      it('findMany: returns paginated results', async () => {
        await repo.create(factory())
        await repo.create(factory())
        const result = await repo.findMany({ page: 1, limit: 10 })
        expect(result.data).toBeInstanceOf(Array)
        expect(result.pagination.total).toBeGreaterThanOrEqual(2)
      })

      it('update: modifies and returns entity', async () => {
        const created = await repo.create(factory())
        const updated = await repo.update(created.id, { status: 'updated' } as any)
        expect(updated).not.toBeNull()
        expect(updated!.status).toBe('updated')
      })

      it('update: returns null for non-existent', async () => {
        const result = await repo.update(999999, { status: 'x' } as any)
        expect(result).toBeNull()
      })

      it('delete: soft-deletes entity', async () => {
        const created = await repo.create(factory())
        const deleted = await repo.delete(created.id)
        expect(deleted).toBe(true)
        const found = await repo.findById(created.id)
        expect(found).toBeNull()  // soft-deleted
      })

      it('exists: returns true when records exist', async () => {
        await repo.create(factory())
        const result = await repo.exists({})
        expect(result).toBe(true)
      })

      it('count: returns correct count', async () => {
        await repo.create(factory())
        await repo.create(factory())
        const result = await repo.count({})
        expect(result).toBeGreaterThanOrEqual(2)
      })
    })

    describe('Pagination', () => {
      it('respects page and limit', async () => {
        for (let i = 0; i < 5; i++) await repo.create(factory())
        const page1 = await repo.findMany({ page: 1, limit: 2 })
        const page2 = await repo.findMany({ page: 2, limit: 2 })
        expect(page1.data).toHaveLength(2)
        expect(page2.data.length).toBeGreaterThan(0)
        expect(page1.pagination.hasNext).toBe(true)
      })
    })
  })
}
```

### 10.3 Uso por dominio

```typescript
// tests/repositories/contract/booking-repository.test.ts
import { bookingRepository } from '@lp/db/repositories'

describeRepositoryContract('BookingRepository', () => ({
  repository: bookingRepository,
  factory: () => ({
    bookingReference: 'BK-TEST-001',
    status: 'pending',
    // ... otros campos requeridos
  }),
}))
```

---

## 11. Mapeo de implementación actual

### 11.1 Schema → Repository → Service

| Schema (B4) | Repository (B4 stub) | Service (actual en lib/) | Domain Target |
|---|---|---|---|
| `orders` | `bookingRepository` | `booking-service.ts` | Booking (B13) |
| `drivers` | `driverRepository` | — | Drivers (B15) |
| `vehicles` | `vehicleRepository` | — | Vehicles (B17) |
| `assignments` | `assignmentRepository` | — | Dispatch (B14) |
| `payments` | `paymentRepository` | `payment-service.ts` | Payments (B19) |
| `customers` | — | — | Customers (B18) |
| `notifications` | — | `whatsapp-service.ts` | Notifications (B11) |
| `conversations` | — | `chat-service.ts` | Chat (B29) |

### 11.2 Camino de migración

```
Hoy (lib/services/*.ts)
  → Usa lib/db.ts (raw SQL)
  → Sin repository pattern
  → Sin transacciones
  → Sin eventos

Después (packages/domains/*/services/*.ts)
  → Usa repositories (contrato §2)
  → Transacciones vía withTransaction (§4)
  → Eventos vía event bus (§9)
  → Specifications para filtros (§6)
```

---

## 12. Checklist de implementación

Cuando implementes un nuevo repository, verifica contra esta lista:

- [ ] **Interfaz:** Sigue el contrato de §2 (findById, findMany, create, update, delete, exists, count)
- [ ] **Filtros:** Define `Filters` type específico del dominio (§6)
- [ ] **Pagination:** Usa convención de §7 (page 1-indexed, limit 1-100)
- [ ] **Soft delete:** Usa `deleted_at` nullable (§8)
- [ ] **Transacciones:** NO inicia transacciones — recibe `tx` como argumento (§4)
- [ ] **Specs:** No tiene métodos de consulta específicos (§6)
- [ ] **Tests:** Pasa la suite contract de §10
- [ ] **Audit:** Sabe dónde registrar eventos de audit (§9)
- [ ] **Types:** Exporta `Filters`, `CreateInput`, `UpdateInput` types
- [ ] **Zero imports:** No importa drizzle-orm, @libsql/client, ni任何数据库特定的东西 fuera de packages/db

---

## 13. Documentos futuros (patterns/)

Este documento es el primero de la serie `02-architecture/patterns/`.
Los siguientes patrones se definirán conforme avancen los epics:

| Patrón | Epic | Descripción |
|---|---|---|
| **Persistence Architecture** | B8 (este) | Cómo los datos entran y salen |
| **Event Architecture** | B10 | Cómo los dominios se comunican |
| **Domain Service Pattern** | B9 | Cómo se orquesta la lógica de negocio |
| **API Pattern** | B12 | Cómo las rutas HTTP orquestan servicios |
| **Factory Pattern** | B24 | Cómo se crean objetos de dominio |
| **Feature Flag Pattern** | B24 | Cómo se controla la activación |
| **Transaction Pattern** | — | Cómo se maneja consistencia multi-escritura |

---

> **Nota final:** Este documento es la **Constitución Técnica de Persistencia**.
> Toda implementación de repository en LocalPlug debe seguir estas reglas.
> Si una regla no aplica a tu caso, documenta la excepción aquí mismo.
> Si una regla necesita cambiar, propón el cambio PRIMERO como discusión,
> DESPUÉS como código.
