# Quickstart: Premium Andean Hospitality Landing Page

## Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm (install via `npm install -g pnpm`)

## Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run Vitest component tests
pnpm test:e2e     # Run Playwright E2E tests
pnpm test:lighthouse  # Run Lighthouse CI audit
pnpm prettier     # Format code with Prettier
```

## Project Structure

```
app/
├── layout.tsx         # Root layout (fonts, metadata, JSON-LD)
├── page.tsx           # Landing page (server component)
├── loading.tsx        # Loading state
├── error.tsx          # Error boundary
├── not-found.tsx      # 404 page
├── globals.css        # Tailwind imports + CSS variables
├── sitemap.ts         # Dynamic sitemap
├── robots.ts          # Robots.txt
├── opengraph-image.tsx # OG image generation
└── components/        # Section components
    ├── hero/
    ├── services/
    ├── how-it-works/
    ├── contact/
    ├── layout/
    └── ui/

lib/
├── design-tokens.ts   # Design system constants
└── metadata.ts        # Metadata helpers

public/images/         # Static image assets
```

## Design System

The Premium Andean Hospitality design tokens are configured in `tailwind.config.js`:

- **Primary**: Slate Navy `#0F172A`
- **Secondary**: Mountain Emerald `#059669`
- **Accent**: Golden Sol `#F59E0B`
- **Background**: Clean White `#FFFFFF` / Cool Slate 50 `#F8FAFC`
- **Headline Font**: Plus Jakarta Sans (via `next/font`)
- **Body Font**: Inter (via `next/font`)
- **Spacing**: 8px base unit
- **Corner Radius**: 8px default, 16px for large containers

## Key Conventions

- Server components by default; `'use client'` only for interactivity
- All images use `next/image` with explicit width/height
- Every page exports `metadata` with title, description, OG tags
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Lighthouse CI audit before deployment

## Deployment

Deploy to Vercel:

```bash
pnpm vercel
```

Or connect the GitHub repository for automatic deployments.
