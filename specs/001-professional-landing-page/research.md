# Research: Professional Landing Page

## Technical Decisions

### Framework: Next.js 14+ with App Router

**Decision**: Use Next.js 14+ App Router with React Server Components by default.

**Rationale**: App Router provides built-in metadata API for SEO, automatic image optimization via `next/image`, file-based routing with layout nesting, and server components that reduce client-side JavaScript. Metadata (`metadata` export / `generateMetadata`) handles title, description, Open Graph, and canonical URLs without manual `<head>` manipulation. Structured data (JSON-LD) is embedded via `<script type="application/ld+json">` in server components.

**Key conventions**:
- `metadataBase` must be set in root layout to prevent broken OG image URLs
- `sitemap.ts` and `robots.ts` at app root for automatic sitemap/robots generation
- `opengraph-image.tsx` for dynamic OG image generation using `@vercel/og`
- All images use `next/image` with explicit `width`, `height`, and `sizes` prop
- Canonical URLs set via `alternates.canonical` in metadata
- Client components (`'use client'`) only for interactive elements (contact form)

**Alternatives considered**: Pages Router (older, less flexible metadata), static HTML (no SSR flexibility, no image optimization).

### Styling: Tailwind CSS v3 with Design Tokens

**Decision**: Use Tailwind CSS v3 with `tailwind.config.js` extending the theme with Premium Andean Hospitality design tokens.

**Rationale**: Tailwind v3 is well-supported with Next.js 14. Custom tokens for colors, fonts, spacing, and border radii are configured in `tailwind.config.js` under `theme.extend`. This keeps the design system centralized and generates utility classes automatically.

**Design tokens mapping**:
- `slate-navy`: #0F172A → `primary`
- `mountain-emerald`: #059669 → `secondary`
- `golden-sol`: #F59E0B → `accent`
- `clean-white`: #FFFFFF → `background` / card surfaces
- `cool-slate-50`: #F8FAFC → page background
- Typography: `Plus Jakarta Sans` (headlines via `next/font`), `Inter` (body via `next/font`)

**Alternatives considered**: Tailwind v4 with `@theme` directive (newer but less tested with Next.js 14 ecosystem), CSS Modules (no utility classes, slower development).

### Image Strategy

**Decision**: All images use `next/image` with explicit dimensions, `sizes` attribute, WebP format, and lazy loading (except hero which uses `priority`).

**Rationale**: Prevents CLS (explicit width/height), optimizes bandwidth (WebP/AVIF), and improves LCP (priority for hero).

**Device sizes config**: `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`

### SEO Strategy

**Decision**: Comprehensive metadata per page + JSON-LD structured data in root layout.

**Metadata per page**:
- `title` (45-60 chars) and `description` (120-160 chars)
- `openGraph` with title, description, image (1200x630), url, type
- `twitter` card with same data
- `alternates.canonical` for canonical URL
- `metadataBase` set to production URL via env var

**JSON-LD in root layout**:
- `Organization` schema: name, logo, url, contact info
- `LocalBusiness` schema: service area (Medellín), description, image

**Alternatives considered**: Manual `<head>` tags (error-prone), third-party SEO plugin (unnecessary dependency).

### Contact Form Handling

**Decision**: Client component with no backend dependency for MVP. Form data is validated client-side and submitted to a configurable endpoint (Vercel Edge Function or console.log for development).

**Rationale**: The spec says "initially log to console or send to configurable endpoint." A placeholder endpoint allows easy future integration with a backend service without changing the frontend code.

**Validation rules**:
- Name: required, min 2 chars
- Email: required, valid email format
- Phone: optional, valid phone format if provided
- Message: required, min 10 chars

### Font Loading

**Decision**: Use `next/font` to self-host Plus Jakarta Sans (headlines) and Inter (body text).

**Rationale**: Self-hosted fonts via `next/font` eliminate external HTTP requests, reduce CLS by preloading with fallback, and respect user privacy (no Google Fonts API call).

### Performance Targets

**Decision**: Target Lighthouse 90+ on all categories with specific CWV thresholds.

| Metric | Target |
|--------|--------|
| Performance | 90+ |
| Accessibility | 90+ |
| Best Practices | 90+ |
| SEO | 90+ |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |

## References

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld)
- [Next.js Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Tailwind CSS Custom Colors](https://tailwindcss.com/docs/colors#custom-colors)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
