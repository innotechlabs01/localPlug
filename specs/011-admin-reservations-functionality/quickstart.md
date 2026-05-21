# Quick Start Guide: Admin Reservations Functionality

## Overview
This guide provides instructions for setting up and running the admin reservations functionality locally.

## Prerequisites
- Node.js 18+ and pnpm (as specified in the project constitution)
- Turso database instance configured
- Access to the project repository

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd LocalPlug
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the project root with the following variables:
   ```
   # Turso Database
   TURSO_DATABASE_URL=libsql://your-database-url.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token

   # Other required environment variables (refer to .env.example)
   ```

4. **Run database migrations**:
   ```bash
   pnpm prisma migrate dev
   ```
   *Note: Adjust command based on actual migration system used*

## Running the Application

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Access the admin reservations page**:
   Open your browser and navigate to:
   ```
   http://localhost:3000/admin/reservations
   ```

## Project Structure for This Feature

The reservations functionality is implemented in:
```
app/admin/reservations/
├── page.tsx              # Main reservations page (React Server Component)
├── components/
│   ├── ReservationTable.tsx      # Displays reservation data in a table
│   ├── ReservationFilters.tsx    # Filter and search controls
│   ├── ReservationKPIs.tsx       # Key performance indicators display
│   ├── ReservationTimeline.tsx   # Upcoming arrivals timeline
│   └── ReservationDetailModal.tsx# Modal for viewing reservation details
├── lib/
│   ├── reservations-api.ts       # Data fetching functions
│   └── reservations-types.ts     # TypeScript types and interfaces
└── hooks/
    └── useReservations.ts        # Custom hook for reservation data management
```

## Key Implementation Details

### Data Fetching
- The main `page.tsx` uses React Server Components to fetch reservation data directly on the server
- Data is passed down to client components as props
- Client components handle interactivity (filtering, search, modal interactions)

### State Management
- Filter and search state is managed in the page component using React's `useState`
- Modal state (open/closed) is also managed in the page component
- Reservation data flows from server to client components as props

### Components
- **ReservationKPIs**: Displays the key metrics cards at the top
- **ReservationFilters**: Contains the filter tabs and search input
- **ReservationTable**: Shows the main data table with sorting capabilities
- **ReservationTimeline**: Displays upcoming arrivals in a timeline format
- **ReservationDetailModal**: Modal dialog showing complete reservation details

### Styling
- All components use Tailwind CSS with the project's design tokens
- Responsive breakpoints follow the project's standards (mobile, tablet, desktop)
- Dark/light mode considerations follow the project's CSS variables

## Testing

To run tests for this feature:
```bash
pnpm test          # Runs Vitest unit and integration tests
pnpm test:e2e      # Runs Playwright end-to-end tests
```

## Deployment

The feature will be automatically deployed to Vercel when pushed to the default branch, following the project's standard deployment workflow.

## Troubleshooting

### Common Issues
1. **Database connection errors**: Verify Turso credentials in `.env.local`
2. **Missing dependencies**: Run `pnpm install` again
3. **TypeScript errors**: Check that all types are properly defined in `reservations-types.ts`
4. **Styling issues**: Ensure Tailwind is properly configured and design tokens are available

### Getting Help
- Refer to the project's constitution for development guidelines
- Check existing admin pages for implementation patterns
- Consult the research.md and data-model.md files for technical decisions