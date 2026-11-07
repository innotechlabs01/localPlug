# Senior Software Engineering Review & Architecture Roadmap: LocalPlug

Este documento presenta una auditoría técnica profunda, análisis arquitectónico y una hoja de ruta (roadmap) de refactorización y escalabilidad para el proyecto **LocalPlug** (Premium Andean Hospitality), orientada a estándares de nivel **Staff / Senior Software Engineer**.

---

## 1. Diagnóstico del Estado Actual del Proyecto

El proyecto es una aplicación web full-stack construida sobre:
- **Next.js 15 (App Router)** y React 18.
- **Monorepo hibrido** con Turborepo (`packages/db`, `packages/domains`, `packages/events`, `packages/auth`, `packages/types`, `packages/config`, `packages/validation`).
- **Base de Datos**: LibSQL / Turso SQLite (con capa de transición Drizzle ORM y SQL crudo).
- **Autenticación**: Clerk Auth y control de acceso basado en roles (RBAC).
- **Integraciones**: Paddle / Stripe / Polar, WhatsApp Evolution API, flujos n8n y modelos Ollama/OpenAI.

### Principales "Code Smells" y Deuda Técnica Detectada

1. **Arquitectura Dividida / Acoplamiento Híbrido**:
   - Existen dos mundos paralelos: `lib/` (código legado tipo monolito en la raíz de Next.js) y `packages/domains` / `packages/db` (arquitectura limpia DDD iniciada pero incompleta).
   - Rutas API como `app/api/booking/route.ts` ejecutan más de 200 líneas de lógica de negocio, cálculos de comisiones, inserciones directas a base de datos en SQL crudo (`db.execute`) y eventos, saltándose la capa de dominio `BookingService` (`packages/domains/_services/src/booking.ts`).
2. **Inconsistencias en Capa de Datos y Modelado**:
   - Mezcla de consultas en SQL directo con Drizzle ORM (`packages/db`).
   - Esquemas no normalizados: nombres completos almacenados juntos (`customer_name` requiriendo split por regex en el frontend), campos JSON sin tipado estricto en la BD, dos campos de estado que se solapan (`status` y `dispatch_status`) sin una máquina de estados finitos (FSM) formal.
3. **Puntos Críticos de Seguridad**:
   - Webhooks (p. ej. Paddle/n8n/Evolution) con verificación estática de strings o firmas ausentes/incompletas.
   - Manejo de fallback en `lib/rate-limit.ts`: si Redis falla, un flag en memoria desactiva permanentemente Redis hasta reiniciar el contenedor.
   - Posibilidad de exposición de credenciales y variables de entorno en commits si no se audita `.gitignore`.

---

## 2. Propuesta de Arquitectura Senior: Clean Architecture / Hexagonal

Para que el sistema sea escalable, mantenible y desacoplado, se debe consolidar la arquitectura hexagonal (Ports & Adapters) estructurada en el monorepo Turborepo:

```
                  ┌─────────────────────────────────────┐
                  │       PRESENTATION LAYER            │
                  │ (Next.js App Router, Pages, API)    │
                  └──────────────────┬──────────────────┘
                                     │ Uses
                                     ▼
                  ┌─────────────────────────────────────┐
                  │        APPLICATION / DOMAIN         │
                  │   Use Cases, Entities, Services     │
                  │       (@lp/domains)                 │
                  └─────────┬─────────────────┬─────────┘
                            │                 │
              Defines Port  │                 │ Defines Port
                            ▼                 ▼
             ┌─────────────────────┐   ┌────────────────────────┐
             │   PERSISTENCE PORT  │   │   NOTIFICATION PORT    │
             │ (BookingRepository) │   │ (NotificationService)  │
             └──────────▲──────────┘   └───────────▲────────────┘
                        │                          │
                        │ Implements               │ Implements
             ┌──────────┴──────────┐   ┌───────────┴────────────┐
             │ INFRASTRUCTURE (DB) │   │ INFRASTRUCTURE (COMMS) │
             │    (@lp/db)         │   │ WhatsApp, n8n, Email   │
             └─────────────────────┘   └────────────────────────┘
```

### Principios Fundamentales:
1. **Regla de Dependencia**: Las capas internas (Dominio y Casos de Uso) no saben nada de Next.js, HTTP, ni SQL. Dependen únicamente de interfaces (Puertos).
2. **Single Responsibility en Rutas API**: Las rutas en `app/api/*` deben limitarse a:
   - Validar entrada con Zod.
   - Extraer contexto de sesión y autorización (Clerk / RBAC).
   - Invocar el Caso de Uso o Servicio de Dominio (`BookingService.create()`).
   - Mapear el `Result<T, E>` a una respuesta HTTP estandarizada (Envelope Pattern).

---

## 3. Patrones de Diseño a Implementar

### A. Repository Pattern (Persistencia Desacoplada)
- Eliminar sentencias SQL inline en controladores/rutas API.
- Usar contratos explícitos:
  ```typescript
  export interface BookingRepository {
    findById(id: string): Promise<BookingEntity | null>
    save(booking: BookingEntity): Promise<void>
    search(criteria: BookingSearchCriteria): Promise<PaginatedResult<BookingEntity>>
  }
  ```
- Implementación en `@lp/db` usando **Drizzle ORM** de manera uniforme.

### B. Strategy Pattern (Pasarelas de Pago y Proveedores de Mensajería)
- **Problema actual**: Lógica condicional rígida para procesar pagos (Paddle, Stripe, Polar) y mensajería (WhatsApp, n8n, Email).
- **Solución**:
  ```typescript
  export interface PaymentGatewayStrategy {
    createCheckout(order: Order): Promise<CheckoutSession>
    verifyWebhookSignature(payload: string, signature: string): boolean
    processWebhook(event: WebhookEvent): Promise<PaymentResult>
  }
  ```
- Un `PaymentGatewayFactory` selecciona la estrategia adecuada basada en configuración o geolocalización.

### C. State Machine Pattern (Máquinas de Estados Finitos)
- Centralizar las transiciones de estado de órdenes y reservas para evitar inconsistencias (`status`: `new` -> `pending` -> `confirmed` -> `completed` / `cancelled`).
- Validar transiciones permitidas impidiendo estados inválidos (por ejemplo, asignar chofer a una orden cancelada).

### D. Transactional Outbox Pattern & Event-Driven Architecture
- Actualmente, `emitEvent` en `lib/events-outbox.ts` ya es un buen comienzo.
- Debe garantizarse atomicidad: guardar la reserva y el evento outbox en la **misma transacción de base de datos** (`Unit of Work`).
- Un worker en background (cron o daemon) procesa el outbox garantizando entrega *at-least-once* hacia n8n o Evolution API.

---

## 4. Estrategia de Refactorización de Código

### Paso 1: Migración Gradual de `lib/` a Paquetes `@lp/*`
- Evitar código duplicado (p. ej., `packages/domains/_services/src/booking.ts` vs `app/api/booking/route.ts`).
- Configurar reglas de ESLint Boundaries (`eslint-plugin-boundaries`) para prohibir que `app/` importe directamente módulos internos de infraestructura sin pasar por la capa de dominio.

### Paso 2: Normalización del Modelo de Datos
- Separar la entidad `Customer` de la entidad `Order/Booking`.
- Almacenar nombres normalizados (`first_name`, `last_name`), código de país ISO y teléfono con validación E.164.
- Tipar fuertemente las columnas JSON (e.g. `additional_trips`, `traveler_profile`) mediante esquemas Zod compartidos en `@lp/validation`.

### Paso 3: Tipado Estricto de Errores (Result Envelope Pattern)
- Eliminar excepciones no controladas en capas de servicio.
- Retornar siempre tipos discriminados:
  ```typescript
  type Result<T, E = DomainError> =
    | { ok: true; value: T }
    | { ok: false; error: E }
  ```

---

## 5. Endurecimiento de Seguridad (Security Hardening)

1. **Validación Criptográfica Estricta de Webhooks**:
   - Usar `crypto.timingSafeEqual` para comparar firmas HMAC (Paddle, Evolution, n8n, Stripe) para prevenir ataques de temporización (timing attacks).
2. **Defensa en Profundidad en API Routes**:
   - Mantener el middleware de Clerk combinado con autorización a nivel de servicio (ABAC/RBAC).
   - Sanitización de parámetros y limitación estricta del tamaño de carga (`content-length`).
3. **Resiliencia en Rate Limiting**:
   - Arreglar el fallo en `lib/rate-limit.ts`: el flag `_redisFailed` debe contar con un reintento con backoff exponencial o verificación periódica en lugar de desactivar Redis permanentemente.
4. **Protección contra CSRF y Headers de Seguridad**:
   - Aplicar cabeceras `Content-Security-Policy` (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, y validación estricta de encabezados de origen `Origin` y `Referer` en mutaciones.

---

## 6. Escalabilidad y Rendimiento

1. **Base de Datos y Replicación**:
   - Con LibSQL/Turso, aprovechar réplicas de lectura de borde (edge read replicas) y centralizar escrituras en la base de datos primaria.
   - Indexación optimizada sobre columnas de consulta frecuente (`status`, `arrival_date`, `customer_email`, `booking_reference`).
2. **Estrategia de Caché Multinivel**:
   - Capa 1: Caché en memoria para configuraciones dinámicas (`settings`) con invalidación basada en eventos o Webhooks.
   - Capa 2: Redis para sesiones efímeras, rate limiting distribuido y bloqueo distribuido (distributed locks) en asignaciones de conductores.
3. **Optimización del Frontend y SSR**:
   - Paginación server-side y filtrado en base de datos para tablas de administración (`ReservationTable`, `OrdersQueue`).
   - Code splitting y lazy loading en componentes pesados y archivos de internacionalización (`locales/en.ts`, `es.ts`).
   - Evitar el uso excesivo de `'use client'` en componentes informativos o estáticos.

---

## 7. Plan de Acción Inmediato y Métricas de Calidad

| Prioridad | Tarea | Impacto |
|---|---|---|
| **P0 (Inmediata)** | Validar firmas HMAC en todos los endpoints de Webhooks (Paddle, Evolution, n8n) con `timingSafeEqual`. | Elimina vulnerabilidades críticas de falsificación de pagos y mensajes. |
| **P0 (Inmediata)** | Enlazar `app/api/booking/route.ts` al `BookingService` y estandarizar transacciones de DB. | Elimina código duplicado e inconsistencias de estado. |
| **P1 (Alta)** | Implementar paginación server-side en paneles de administración (`/admin/reservations`, `/admin/dispatch`). | Evita degradación de memoria y rendimiento con cientos de registros. |
| **P1 (Alta)** | Corregir resiliencia de Redis en `rate-limit.ts` (reconexión automática). | Garantiza protección DDoS distribuida permanente. |
| **P2 (Media)** | Migración progresiva de consultas SQL crudas hacia Drizzle Repositories tipados en `@lp/db`. | Mejora mantenibilidad, previene SQL injections y facilita migraciones. |
| **P3 (Media/Baja)**| CI/CD Pipeline (GitHub Actions) con linter, typecheck, tests unitarios y e2e. | Previene regresiones y asegura calidad continua. |
