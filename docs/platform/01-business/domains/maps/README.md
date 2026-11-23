# MAPS DOMAIN

> Mapping, geocoding, routing, and location services.

## Responsibility
- Owns: map rendering, geocoding, routing, location services, distance calculation
- Does NOT own: GPS tracking (Trips), driver location (Drivers)

## Boundaries
- Inbound: All domains (location requests)
- Outbound: Google Maps API, Mapbox API, OSRM

## Status
- Stage: Capability (not yet extracted)
- Maturity: 10%
- Extraction: Not started

## Domain Model
- Entities: Location, Route, GeocodeResult, DistanceMatrix
- Value Objects: Coordinates, Address, Distance, Duration, TravelMode
- Aggregates: Route (root, invariants: valid coordinates, route exists)
- Events: location.geocoded, route.calculated
- Policies: APIKeyPolicy, RateLimitPolicy, CachePolicy
