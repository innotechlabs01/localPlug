# Reference — Naming Conventions

## Files
| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `DriverCard.tsx` |
| Hooks | camelCase + `use` | `useAvailability.ts` |
| Services | camelCase + action | `registration.service.ts` |
| Types | PascalCase | `DriverProfile.ts` |
| Utils | camelCase | `formatPhone.ts` |
| Tests | `.test.ts` suffix | `registration.test.ts` |

## Variables & Functions
| Type | Convention | Example |
|---|---|---|
| Variables | camelCase | `driverStatus` |
| Functions | camelCase | `registerDriver()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `DriverProfile` |
| Enums | PascalCase | `AvailabilityStatus` |

## Database
| Type | Convention | Example |
|---|---|---|
| Tables | Plural, snake_case | `driver_documents` |
| Columns | snake_case | `account_status` |
| Primary keys | `id` (UUID v4) | `id` |
| Foreign keys | `{table}_id` | `driver_id` |
| Timestamps | `{verb}_at` | `created_at` |
| Junction tables | `{a}_{b}` | `driver_vehicle_assignments` |
| Log tables | `{entity}_{purpose}_log` | `driver_availability_log` |

## Events
- Format: `<domain>:<action>` (e.g., `assignment:accepted`, `trip:completed`).
- Past tense for completed actions.
