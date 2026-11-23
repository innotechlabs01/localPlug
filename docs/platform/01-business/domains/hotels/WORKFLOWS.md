# WORKFLOWS (Hotels)

## Workflow: Hotel Onboarding

### Trigger
Admin creates a new hotel.

### Steps
1. Admin submits hotel profile → HotelService.createHotel()
2. Hotel created with status: pending → Publish `hotel.created`
3. Admin adds rooms → RoomService.createRoom()
4. Room created → Publish `room.created`
5. Admin sets commission rate → CommissionService.updateRate()
6. Commission updated → Publish `commission.updated`
7. Admin assigns manager → HotelService.assignManager()
8. Manager assigned → Publish `hotel.manager.assigned`
9. Admin activates hotel → HotelService.activateHotel()
10. Hotel activated → status: active → Publish `hotel.status.changed`

### Events
- `hotel.created` at step 2
- `room.created` at step 4
- `commission.updated` at step 6
- `hotel.manager.assigned` at step 8
- `hotel.status.changed` at step 10

### Error Handling
- If step 2 fails: Hotel not created, retry
- If step 4 fails: Room not created, retry
- If step 9 fails: Hotel remains pending

---

## Workflow: Hotel Booking

### Trigger
Customer books a room at a hotel.

### Steps
1. Customer selects room → RoomAvailabilityPolicy.canBook()
2. Availability confirmed → BookingService.createBooking()
3. Booking created → Publish `booking.created`
4. Payment processed → PaymentService.processPayment()
5. Payment succeeded → Publish `payment.succeeded`
6. Booking confirmed → status: confirmed → Publish `booking.confirmed`
7. Room marked unavailable → Publish `room.status.changed`
8. Commission calculated → CommissionPolicy.calculate()
9. Commission recorded → CommissionService.recordCommission()

### Events
- `booking.created` at step 3
- `payment.succeeded` at step 5
- `booking.confirmed` at step 6
- `room.status.changed` at step 7
- `commission.updated` at step 9

### Error Handling
- If step 1 fails: Room not available, show alternatives
- If step 4 fails: Booking not confirmed, payment failed
- If step 7 fails: Room remains available (compensating transaction)

---

## Workflow: Hotel Cancellation

### Trigger
Customer cancels a hotel booking.

### Steps
1. Customer requests cancellation → BookingService.cancelBooking()
2. Cancellation window check → CancellationPolicy
3. If within window: full refund → PaymentService.refund()
4. If outside window: partial/no refund → PaymentService.refund()
5. Booking cancelled → status: cancelled → Publish `booking.cancelled`
6. Room restored → Publish `room.status.changed`
7. Commission reversed → CommissionService.reverseCommission()

### Events
- `booking.cancelled` at step 5
- `room.status.changed` at step 6
- `commission.updated` at step 7

---

## Workflow: Manager Assignment

### Trigger
Admin assigns a manager to a hotel.

### Steps
1. Admin selects user → HotelService.assignManager()
2. Role validation → ManagerAssignmentPolicy
3. Manager added → Publish `hotel.manager.assigned`
4. Notification sent → Communication (WhatsApp, Email)

### Events
- `hotel.manager.assigned` at step 3

### Error Handling
- If step 2 fails: Invalid role, reject assignment
- If user already manager: Update role instead of duplicate
