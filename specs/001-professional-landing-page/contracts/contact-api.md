# Contact Form Contract

## POST /api/contact

Submit a contact inquiry from the landing page.

### Request

**Content-Type**: `application/json`

```json
{
  "name": "string (required, min 2 chars)",
  "email": "string (required, valid email)",
  "phone": "string (optional, valid phone format)",
  "message": "string (required, min 10 chars)"
}
```

### Success Response (200)

```json
{
  "status": "success",
  "message": "Thank you for your inquiry. We will contact you shortly."
}
```

### Validation Error Response (400)

```json
{
  "status": "error",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" },
    { "field": "name", "message": "Name must be at least 2 characters" }
  ]
}
```

### Server Error Response (500)

```json
{
  "status": "error",
  "message": "An unexpected error occurred. Please try again later."
}
```

### Notes

- For MVP development: form data is logged to console when no backend is available.
- Production: implement as a Vercel Edge Function or integrate with a CRM/email service.
- Rate limiting: implement per-IP rate limiting in production (max 5 submissions per 10 minutes).
