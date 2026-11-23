# WORKFLOWS (Customers)

## Workflow: Customer Registration

### Trigger
Customer signs up via app or website.

### Steps
1. Customer submits registration form → CustomerService.createCustomer()
2. Email validation → Check uniqueness
3. Customer created → status: active → Publish `customer.created`
4. Default preferences created → CustomerPreferenceService.createDefaults()
5. Welcome notification → Communication (WhatsApp, Email)

### Events
- `customer.created` at step 3

### Error Handling
- If step 2 fails: Email already exists, show error
- If step 4 fails: Customer created, preferences created separately

---

## Workflow: Customer Data Export (GDPR)

### Trigger
Customer requests data export.

### Steps
1. Customer requests export → CustomerService.exportData()
2. Verify identity → Auth check
3. Collect all customer data → CustomerRepository, BookingRepository, PaymentRepository
4. Generate export file → JSON/CSV
5. Send download link → Communication (Email)

### Events
- None (internal process)

### Error Handling
- If step 2 fails: Identity verification failed
- If step 3 fails: Partial data export with warning

---

## Workflow: Customer Account Deletion (GDPR)

### Trigger
Customer requests account deletion.

### Steps
1. Customer requests deletion → CustomerService.deleteAccount()
2. Verify identity → Auth check
3. Check for active bookings → Cannot delete if active bookings exist
4. Anonymize personal data → Replace with generic values
5. Mark as deactivated → Publish `customer.deactivated`
6. Send confirmation → Communication (Email)

### Events
- `customer.deactivated` at step 5

### Error Handling
- If step 3 fails: Active bookings exist, cannot delete
- If step 4 fails: Data anonymization failed, retry

---

## Workflow: Customer Merge

### Trigger
Admin detects duplicate customer accounts.

### Steps
1. Admin identifies duplicates → CustomerService.findDuplicates()
2. Admin selects primary and secondary → MergePolicy.validate()
3. Merge customers → CustomerService.mergeCustomers()
4. Transfer bookings → BookingService.transferCustomer()
5. Merge preferences → CustomerPreferenceService.merge()
6. Publish `customer.merged`

### Events
- `customer.merged` at step 6

### Error Handling
- If step 2 fails: Validation error, cannot merge
- If step 4 fails: Booking transfer failed, rollback merge
