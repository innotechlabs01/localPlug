# MAPS DOMAIN

> Mapping, geocoding, routing, and location services.

## Responsibility
- Owns: map rendering, geocoding, routing, location services
- Does NOT own: GPS tracking (Trips), driver location (Drivers)

## Boundaries
- Inbound: All domains (location requests)
- Outbound: Google Maps API, Mapbox API, OSRM

## Status
- Maturity: 10%
- Extraction: Not started (Google Maps API usage only)
- Portal: None

## Domain Model
- **Entities**: Location, Route, GeocodeResult
- **Value Objects**: Coordinates, Address, Distance, Duration
- **Aggregates**: Location (root: Location, invariants: coordinate validity)
- **Events**: location.geocoded, route.calculated
- **Policies**: API key management, rate limiting, caching

## Key Files
- `lib/maps.ts` — Map utilities (needs extraction)
- `components/map-picker.tsx` — Map component

## Extraction Plan
1. Create Maps domain package
2. Abstract Google Maps dependency
3. Add Mapbox/OSRM support
