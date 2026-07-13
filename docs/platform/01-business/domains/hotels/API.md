# API (Hotels)

## Routes

| Method | Path | Auth | Permission | Description |
|--------|------|:----:|------------|-------------|
| GET | /api/hotels | ✅ | hotels:list | List all hotels (admin) or own hotel (manager) |
| GET | /api/hotels/:id | ✅ | hotels:read | Get hotel details |
| POST | /api/hotels | ✅ | hotels:create | Create new hotel |
| PUT | /api/hotels/:id | ✅ | hotels:update | Update hotel profile |
| DELETE | /api/hotels/:id | ✅ | hotels:delete | Delete hotel (admin only) |
| POST | /api/hotels/:id/activate | ✅ | hotels:activate | Activate hotel |
| POST | /api/hotels/:id/deactivate | ✅ | hotels:deactivate | Deactivate hotel |
| POST | /api/hotels/:id/suspend | ✅ | hotels:suspend | Suspend hotel (admin only) |
| PUT | /api/hotels/:id/commission | ✅ | hotels:commission | Update commission rate |
| POST | /api/hotels/:id/managers | ✅ | hotels:assign-manager | Assign manager |
| DELETE | /api/hotels/:id/managers/:userId | ✅ | hotels:remove-manager | Remove manager |
| GET | /api/hotels/:id/rooms | ✅ | hotels:rooms:list | List hotel rooms |
| POST | /api/hotels/:id/rooms | ✅ | hotels:rooms:create | Create room |
| PUT | /api/hotels/:id/rooms/:roomId | ✅ | hotels:rooms:update | Update room |
| DELETE | /api/hotels/:id/rooms/:roomId | ✅ | hotels:rooms:delete | Delete room |
| POST | /api/hotels/:id/rooms/:roomId/availability | ✅ | hotels:rooms:availability | Check availability |

## Request/Response Schemas

### Create Hotel
```typescript
// Request
interface CreateHotelInput {
  name: string
  slug: string
  description?: string
  address: string
  lat: number
  lng: number
  phone: string
  email: string
  website?: string
  stars: number
  commissionRate: number
}

// Response
interface HotelResponse {
  id: string
  name: string
  slug: string
  status: 'pending'
  createdAt: string
}
```

### Update Commission
```typescript
// Request
interface UpdateCommissionInput {
  rate: number // 0-100
}

// Response
interface CommissionResponse {
  hotelId: string
  previousRate: number
  newRate: number
  updatedAt: string
}
```

## RBAC

| Role | Hotels | Rooms | Commission | Managers | Activate |
|------|:------:|:-----:|:----------:|:--------:|:--------:|
| Admin | All | All | All | All | Yes |
| Hotel Manager | Own | Own | View | View | No |
| Hotel Staff | Own | Own | View | View | No |
| Customer | Active only | View | No | No | No |

## Thin Orchestrator Rule
API routes MUST NOT contain business logic.
Validate → Call domain service → Return result.
