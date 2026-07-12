# INTERACTION_MATRIX (Real — Digital Twin)

> Module × module interaction **as it exists today**. Two kinds of link are distinguished:
> - **D** = direct code dependency, confirmed by `DEPENDENCIES/scan-deps.mjs` (one module imports the other).
> - **B** = business/runtime interaction only (they cooperate at runtime, but no direct import — usually via the DB or an HTTP/WhatsApp round-trip).
> - **—** = no observed interaction.
>
> This matrix is the early-warning system for future coupling: a **D** cell that the Blueprint
> says should be **B** (via events) is a refactor target.

Legend: Bk=Booking Ds=Dispatch Dr=Drivers Vh=Vehicles Tr=Trips Cu=Customers Py=Payments
Nf=Notifications Ch=Chat AI=AI Rt=Realtime Au=Auth Ho=Hotels Ra=Ratings Cs=Cases Ma=Maps

|   |Bk|Ds|Dr|Vh|Tr|Cu|Py|Nf|Ch|AI|Rt|Au|Ho|Ra|Cs|Ma|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|**Bk**|-|B|B|–|–|B|B|B|–|–|B|–|B|B|–|B|
|**Ds**|B|-|B|–|–|–|–|D|–|–|B|D|–|–|–|–|
|**Dr**|B|B|-|B|–|–|–|B|D|–|B|D|–|–|–|–|
|**Vh**|–|–|B|-|–|–|–|–|–|–|–|–|–|–|–|–|
|**Tr**|–|–|–|–|-|–|–|–|–|–|–|–|–|–|–|–|
|**Cu**|B|–|–|–|–|-|–|B|–|–|B|–|–|–|–|–|
|**Py**|B|–|–|–|–|–|-|B|–|–|B|D|–|–|–|–|
|**Nf**|B|D|–|–|–|B|B|-|D|B|D|–|–|–|D|–|
|**Ch**|–|–|–|–|–|–|–|D|-|D|B|–|–|B|–|–|
|**AI**|–|–|–|–|–|–|–|B|D|-|B|–|–|–|B|–|
|**Rt**|B|B|B|–|–|B|B|B|B|B|-|B|B|B|B|B|
|**Au**|D|D|D|–|–|–|D|D|D|–|B|D|–|–|D|–|
|**Ho**|B|–|–|–|–|–|–|–|–|–|B|D|-|–|–|–|
|**Ra**|B|–|–|–|–|–|–|–|B|–|B|–|–|-|–|–|
|**Cs**|–|–|–|–|–|–|–|D|–|B|B|D|–|–|-|–|
|**Ma**|B|B|–|–|–|–|–|–|–|–|B|–|–|–|–|-|

## Reading the matrix
- **Vh (Vehicles) and Tr (Trips) are empty** — they do **not exist as modules today**; they are
  embedded (Vehicles in `drivers.vehicle`; Trips in `orders_new.additional_trips` /
  `assignments.service_type`). The Blueprint extracts them as first-class domains → these rows
  will fill in during 2C.
- **D cells that should become B (events) in 2C:** `Nf↔Ds` (dispatch calls n8n inline),
  `Nf↔Ch` (chat calls n8n inline), `Nf↔Queue` (**the confirmed circular dependency**),
  `Ch↔AI` (direct ollama call — acceptable as same-bounded-context, but still inline).
- **Auth (Au) is a hub of D edges** — every admin route imports `lib/admin/permissions`. That
  is correct (auth is infrastructure), but it shows auth is not yet a clean package.
- **Realtime (Rt) shows B everywhere** — confirming polling is the universal sync mechanism.

## Cross-check with Blueprint
Compare this to `blueprint/EVENT_OWNERSHIP.md`: every **D** that the Blueprint assigns to
*typed events* is a concrete 2C task (and a coupling risk to resolve before migration).
