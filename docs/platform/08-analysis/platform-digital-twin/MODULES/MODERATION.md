# Moderation (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `lib/moderation/comment-filter.ts`
  - **Responsibilities (real):** ✔ Exports `filterComment(comment: string): ModerationResult` where `ModerationResult = { isClean: boolean; filteredComment: string }`. ✔ Returns `isClean:true, filteredComment:''` for empty/whitespace input. ✔ Blocks any comment matching `URL_REGEX` (`https?://...` or `www.`). ✔ Blocks `SPAM_REPEAT_REGEX` (char repeated ≥5 times) and `SPAM_CAPS_BLOCK_REGEX` (≥20 consecutive uppercase chars). ✔ Blocks profanity via `PROFANITY_LIST_EN` (12 words) and `PROFANITY_LIST_ES` (17 words) using substring `includes`. ✔ On any block, returns `{ isClean:false, filteredComment:'' }` (the comment is dropped entirely, not redacted). ✔ On pass, returns trimmed comment.
  - **Problem (real):** This is the ENTIRE Moderation domain — a single pure function, no service/repo/DB. Blocking behavior is all-or-nothing (drops the whole comment) with no redaction or quarantine. Profanity lists are hardcoded arrays; substring matching yields false positives (e.g. "class" contains no listed word but "ass" is a substring of many innocent words like "pass", "class", "grass"). No locale awareness, no allow-list, no logging/audit, no configurable rules. `isClean` result is currently unused by callers (they only use `filteredComment`).

- **File:** `app/components/chat/__tests__/comment-filter.test.ts` (test reference, not a source module but the only other file touching this domain)
  - **Responsibilities (real):** ✔ Unit tests for `filterComment` covering clean, EN/ES profanity, URL, repeat-char, caps-block, empty, and `FUCK` (uppercase) cases.
  - **Problem (real):** Indicates the function is also exercised by the chat domain (import path `app/components/chat/...`), but no chat source file was in the listed moderation scope; the moderation rule is shared with chat/ratings.

## Consumers (real, observed)
- **File:** `app/api/ratings/route.ts` — imports `filterComment` and applies it to the rating `comment` on POST, storing `moderation.filteredComment` as the rating comment. This is the only production caller observed in the listed domains.
- (Per grep, `comment-filter.test.ts` under `app/components/chat` also imports it — chat domain usage.)

## Module-level real responsibilities
- ✔ Synchronous comment moderation: URL/spam/profanity detection with whole-comment suppression.
- ✔ Shared pure utility used by Ratings (and Chat) submission paths.

## Proposed split (target per Blueprint domains/packages)
- `packages/domains/moderation` — `ModerationService` wrapping `filterComment`; add `decision` types (`approve`/`redact`/`quarantine`/`reject`) instead of binary drop; redaction vs suppression.
- `packages/domains/moderation/rules` — externalize profanity/spam rules (config/DB-driven) with word-boundary matching to avoid substring false positives; locale-aware lists.
- `packages/infra/audit` — emit a moderation event/log when a comment is blocked (today nothing is recorded).
- `packages/domains/ratings` (and chat) — call `ModerationService.moderate()` and handle the returned decision (e.g. set rating `resolved=0`/quarantine) instead of always storing `resolved=1`.

## Dependency observations (real)
- `lib/moderation/comment-filter.ts` imports NOTHING — zero dependencies, fully standalone pure module. No DB, no config, no i18n.
- It is consumed by `app/api/ratings/route.ts` (via `import { filterComment } from '@/lib/moderation/comment-filter'`) and by chat tests; no other domain in the listed set imports it.
- No `moderation` table, no moderation API route, and no admin UI for moderation exist — the domain is a single library function with no persistence or workflow.
- The `ModerationResult.isClean` field is effectively dead: `app/api/ratings/route.ts` only reads `.filteredComment` and always inserts `resolved: 1`, so a blocked (empty) comment is stored as a valid resolved rating with no marker that it was moderated.
