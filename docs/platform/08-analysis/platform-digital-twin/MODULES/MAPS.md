# Maps (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `app/api/geocode/route.ts`
  - **Responsibilities (real):** ✔ `GET` proxies address search to OpenStreetMap **Nominatim** (`https://nominatim.openstreetmap.org/search?format=json&q=<encoded>&limit=1&countrycodes=co`). ✔ Rejects queries shorter than 3 chars (400). ✔ Sets a `User-Agent: LocalPlug/1.0 (https://localplug.vercel.app)` and `Accept: application/json` header. ✔ Returns raw Nominatim JSON (array) or error (502 on fetch failure, upstream status on non-OK).
  - **Problem (real):** No authentication. No caching of geocode results. No rate-limiting beyond Nominatim's own (risk of 429/blocking under load). Hardcoded `countrycodes=co` (Colombia-only) and `limit=1`. Returns the upstream array directly (caller must parse `data[0].lat`/`data[0].lon`). No stored coordinates — every address lookup hits the external API.

- **File:** `app/components/ui/leaflet-map.tsx`
  - **Responsibilities (real):** ✔ Client component `LeafletMap({ address })` that on `address` change calls `/api/geocode?q=<address>` and places a marker at the returned lat/lon; flies to it. ✔ Initializes a Leaflet map (via `require('leaflet')`) centered on Medellín default `[6.2442, -75.5812]`; OSM tile layer; fixes default icon paths; shows loading/error overlays. ✔ `addLeafletCss()` injects Leaflet CSS from unpkg once.
  - **Problem (real):** UI owns the geocode→marker flow and the Medellín default; couples the Maps UI to the `/api/geocode` proxy and to Leaflet loaded from CDN (unpkg). No abstraction for "geocoding service" — the component calls the HTTP endpoint directly. No reverse-geocoding, no multiple-result selection, no persistence of coordinates to any table.

## Module-level real responsibilities
- ✔ Address → coordinates geocoding via a public Nominatim proxy (server route).
- ✔ Interactive Leaflet map rendering a single geocoded point for an address (client component).

## Proposed split (target per Blueprint domains/packages)
- `packages/infra/geo` — `GeocodeService` wrapping Nominatim (or a pluggable provider) with caching, rate-limit/backoff, and a normalized response (not raw upstream array). Absorb `app/api/geocode/route.ts`.
- `packages/domains/locations` — if address/coordinate storage is needed (e.g. hotel/pickup addresses), a `LocationRepository` to persist geocoded results instead of re-querying each render.
- `packages/ui/maps` — `LeafletMap` as a UI package consuming `GeocodeService` via a typed client, not raw `fetch('/api/geocode')`; move CDN/Leaflet bootstrap into a map-provider module.

## Dependency observations (real)
- `app/api/geocode/route.ts` imports only `next/server` (`NextRequest`, `NextResponse`) and uses the global `fetch`. No local lib dependencies — fully standalone proxy.
- `app/components/ui/leaflet-map.tsx` imports only `react` (`useEffect`, `useRef`, `useState`) and `leaflet` (via `require` at runtime from node_modules, assumed present). It calls `/api/geocode` over HTTP.
- Confirmed consumers of `/api/geocode`: only `app/components/ui/leaflet-map.tsx` (grep). Confirmed consumers of `checkDriverAvailability`/Leaflet: none in this Maps domain — note `leaflet` is also referenced by the map component while driver availability is a separate dispatch concern.
- No Maps-related lib module exists (no `lib/maps*` or `lib/geo*`). The Maps "domain" today is exactly two files: one proxy route + one Leaflet UI component.
