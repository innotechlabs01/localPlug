# UI (Hotels)

## Applications Using This Domain

| Application | Pages | Components | Notes |
|-------------|-------|------------|-------|
| Admin | Hotel Management, Hotel Detail, Room Management | HotelList, HotelForm, RoomForm, CommissionEditor | Currently 935-line page |
| Hotel Portal | Dashboard, Rooms, Bookings, Settings (planned) | — | Not yet built |
| Customer Portal | Hotel Search, Room Selection, Booking (planned) | — | Not yet built |

## Admin Pages

| Page | Path | Components | Data Source |
|------|------|------------|-------------|
| Hotel Management | /admin/hotel-management | HotelList, HotelSearch, HotelStats | API → HotelService |
| Hotel Detail | /admin/hotel-management/[id] | HotelProfile, RoomList, CommissionEditor, ManagerList | API → HotelService |
| Room Management | /admin/hotel-management/[id]/rooms | RoomList, RoomForm, AvailabilityCalendar | API → RoomService |

### Current State (935-line page)
The current `app/admin/hotel-management/page.tsx` is a 935-line monolith that:
- Queries hotels directly from database
- Has inline commission calculation
- Has inline tenancy filtering
- Mixes UI and business logic

### Target State
After extraction:
- Page becomes thin consumer of API
- All logic in HotelService
- CommissionPolicy as single source of truth

## Portal Pages (Planned)

| Page | Path | Components | Data Source |
|------|------|------------|-------------|
| Dashboard | /portal/hotels/[id] | StatsCard, RecentBookings | API → HotelService |
| Rooms | /portal/hotels/[id]/rooms | RoomList, RoomForm, AvailabilityCalendar | API → RoomService |
| Bookings | /portal/hotels/[id]/bookings | BookingList, BookingDetail | API → BookingService |
| Settings | /portal/hotels/[id]/settings | ProfileForm, CommissionView | API → HotelService |

## Components

| Component | Purpose | Used By |
|-----------|---------|---------|
| HotelList | Display list of hotels | Admin, Hotel Portal |
| HotelForm | Create/edit hotel profile | Admin, Hotel Portal |
| RoomForm | Create/edit room | Admin, Hotel Portal |
| CommissionEditor | Edit commission rate | Admin |
| ManagerList | Display hotel managers | Admin, Hotel Portal |
| AvailabilityCalendar | Show room availability | Admin, Hotel Portal, Customer Portal |
