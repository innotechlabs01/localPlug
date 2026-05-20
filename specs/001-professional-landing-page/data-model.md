# Data Model: Premium Andean Hospitality Landing Page

## Service

A concierge offering displayed as a card in the services section.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique identifier |
| title | string | yes | Service name (e.g., "Airport Pickup") |
| description | string | yes | Brief service description |
| icon | string | yes | Icon identifier or image path |
| imageUrl | string | no | Optional background/feature image |
| ctaLabel | string | no | Optional CTA button text |
| ctaHref | string | no | Optional CTA link target |

**Validation**: title 2-60 chars, description 10-200 chars.

## Step (How It Works)

A numbered step in the process section.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order | number | yes | Step number (1-based) |
| title | string | yes | Step title |
| description | string | yes | Step description |
| icon | string | yes | Icon identifier or image path |

**Validation**: order >= 1, title 2-50 chars, description 10-200 chars.

## Contact Inquiry

A user-submitted contact form entry.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | yes | Min 2 chars |
| email | string | yes | Valid email format |
| phone | string | no | Optional, valid phone if provided |
| message | string | yes | Min 10 chars |
| submittedAt | datetime | auto | Timestamp of submission |

## Brand Information

Organization data used for SEO structured data and page metadata.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | "Premium Andean Hospitality" |
| description | string | yes | Brand tagline / value proposition |
| logo | string | yes | Logo image URL or path |
| url | string | yes | Website canonical URL |
| email | string | no | Contact email |
| phone | string | no | Contact phone |
| address | string | no | Physical address (if applicable) |
| serviceArea | string | yes | "Medellín, Colombia" |
| socialLinks | string[] | no | Array of social media profile URLs |

## State Transitions

```
Page Load → [Hero Visible] → [Scrolling] → [Section Visible]
                                                  ↓
                                           [CTA Click] → [Scroll to Form / External Link]
                                                  ↓
                                [Form Submit] → [Validation Pass] → [Success Message]
                                [Form Submit] → [Validation Fail] → [Error State]
                                [Image Load Fail] → [CSS Placeholder Shown]
```
