# POLICIES (Customers)

## Policy: PrivacyPolicy

**Description**: Customer data privacy and GDPR compliance.
**Trigger**: Any access to customer data.
**Rule**: Customer data is only accessible by authorized parties.

### Business Rules
1. Customer can export their data (GDPR right to portability)
2. Customer can request data deletion (GDPR right to erasure)
3. Customer data is encrypted at rest
4. Customer data is never shared with third parties without consent
5. Customer can revoke consent at any time
6. Data retention: 7 years after last activity (legal requirement)

### Implementation
```typescript
// packages/domains/customers/src/policies/privacy.ts
export class PrivacyPolicy {
  canAccess(requesterId: string, customerId: string, role: string): boolean {
    if (role === 'admin') return true
    if (requesterId === customerId) return true
    return false
  }
}
```

---

## Policy: MergePolicy

**Description**: Rules for merging duplicate customer accounts.
**Trigger**: Admin detects duplicate customers.
**Rule**: Merge preserves all bookings, payments, and history.

### Business Rules
1. Both customers must exist
2. Primary customer retains their ID
3. Secondary customer's data is merged into primary
4. Bookings from secondary are transferred to primary
5. Preferences from secondary override primary (if different)
6. Merge is irreversible
7. Merge requires admin role

### Implementation
```typescript
// packages/domains/customers/src/policies/merge.ts
export class MergePolicy {
  validate(primary: Customer, secondary: Customer): ValidationResult {
    // Both must be active
    // Cannot merge same customer
    // Email conflict check
  }
}
```

---

## Policy: ProfileCompletenessPolicy

**Description**: Rules for complete customer profiles.
**Trigger**: Customer registration or profile update.
**Rule**: Minimum required fields for active status.

### Business Rules
1. Name is required
2. Email is required
3. Phone is optional but recommended
4. Profile completeness score: 0-100%
5. Incomplete profiles can still book but with limitations
6. Complete profiles get priority support

### Scoring
- Name: 25%
- Email: 25%
- Phone: 25%
- Address: 25%
