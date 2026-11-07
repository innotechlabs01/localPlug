# Plan: Unified Hotel + Manager Creation

## Goal
When admin clicks "+ Add Hotel", the modal includes fields for hotel info AND manager credentials. On save, both the hotel and the Clerk user (hotel_manager) are created and linked. The admin sees credentials to share.

## Files to Modify

### 1. `app/api/admin/hotels/route.ts` (POST handler)
**Change:** Accept new fields `manager_name`, `manager_email`, `manager_password` in the POST body.

**Logic:**
1. Insert hotel into `hotels` table (existing logic)
2. Create Clerk user via `clerkClient().users.createUser()` with:
   - `emailAddress: [manager_email]`
   - `firstName`, `lastName` (from manager_name split)
   - `password: manager_password`
   - `publicMetadata: { role: 'hotel_manager' }`
3. Insert user into `users` table with:
   - `clerk_id`: the new Clerk user ID
   - `role_id`: 5 (hotel_manager)
   - `hotel_id`: the newly created hotel ID
   - `status`: 'active'
4. Return hotel + manager credentials

### 2. `app/admin/hotels/page.tsx`
**Change:** Expand the "New Hotel" modal to include a second section for manager credentials.

**UI:**
- Add fields: Manager Name, Manager Email, Temporary Password
- After successful creation, show a "Credentials Panel" with email + password
- Add a "Copy Credentials" button for easy sharing
- Hide the form, show success state

## Execution Steps

1. Read `app/api/admin/hotels/route.ts` to understand current POST handler
2. Read `app/admin/hotels/page.tsx` to understand current modal
3. Modify `route.ts` POST handler to create Clerk user + link to hotel
4. Modify `hotels/page.tsx` modal to add manager fields + credentials display
5. Test by creating a hotel and verifying the Clerk user is created
