# UI (Customers)

## Applications Using This Domain

| Application | Pages | Components | Notes |
|-------------|-------|------------|-------|
| Admin | Customer Management, Customer Detail | CustomerList, CustomerForm, CustomerStats | Direct DB queries (needs refactor) |
| Customer Portal | Profile, Preferences, Addresses, Data Export (planned) | — | Not yet built |

## Admin Pages

| Page | Path | Components | Data Source |
|------|------|------------|-------------|
| Customer Management | /admin/customers | CustomerList, CustomerSearch, CustomerStats | API → CustomerService |
| Customer Detail | /admin/customers/[id] | CustomerProfile, BookingHistory, Preferences | API → CustomerService |

### Current State
- `app/admin/customers/page.tsx` — Direct DB queries
- Schema discrepancy: Drizzle vs raw SQL

### Target State
- Page becomes thin consumer of API
- All logic in CustomerService
- Schema discrepancy fixed

## Portal Pages (Planned)

| Page | Path | Components | Data Source |
|------|------|------------|-------------|
| Profile | /portal/profile | ProfileForm, AvatarUpload | API → CustomerService |
| Preferences | /portal/preferences | NotificationSettings, QuietHours | API → CustomerService |
| Addresses | /portal/addresses | AddressList, AddressForm | API → CustomerService |
| Data Export | /portal/data-export | ExportButton, DownloadLink | API → CustomerService |
