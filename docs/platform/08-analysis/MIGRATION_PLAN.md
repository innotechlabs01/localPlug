# MIGRATION_PLAN

**Status:** Executed (phased, non-destructive)
**Date:** 2026-07-11
**Method:** Migration-architect process (like a DB migration — never delete, only move/link)

## Principle
Documentation is migrated, never deleted. Every major restructure moves the previous
tree to `archive/spec-vN/` and preserves history.

## Phases

### Fase 1 — Inventario
- No file deleted. Current state analyzed: `docs/platform/` (61 files) + `archive/spec-v1/`.
- Per-document inventory produced (status + action per file).
- Finding: minor overlap between `../03-engineering/ai-rules.md` and `09-ai/*`.

### Fase 2 — Gap Analysis
- **Exists:** Business, Architecture, Engineering, Operations, ADRs, Workflows, State Machines, UI, AI Context, Reference, Constitution, Platform Index, archive.
- **Missing:** `99-analysis/`, thin `../MASTER_SPEC.md` index, formal validation report.
- **Duplicate:** AI rules ↔ 09-ai (resolved by declaring `../03-engineering/ai-rules.md` as canonical brain).

### Fase 3 — Migration Plan (this document)
Proposed: add thin `../MASTER_SPEC.md`; add `99-analysis/`; declare `../03-engineering/ai-rules.md` as brain;
run validation. **Approved by user (target: `docs/platform/` + 99-analysis).**

### Fase 4 — Migración (executed)
- Added `../MASTER_SPEC.md` (thin index, links only).
- Added `99-analysis/` (this file, CURRENT_ARCHITECTURE, TECH_DEBT, REFACTOR_REPORT).
- Declared `../03-engineering/ai-rules.md` as canonical brain; linked from `../09-ai/master-context.md`.
- Added `11-product-management/` (PRODUCT_BACKLOG, EPICS, FEATURES, USER_STORIES, SPRINTS, MVP, RELEASE_PLAN, CHANGELOG, DECISION_LOG).
- Added `12-quality/` (CODE_REVIEW, UX, API, DATABASE, SECURITY, PERFORMANCE, PRE_RELEASE checklists).
- No deletion; v1 preserved in `archive/spec-v1/`.

### Fase 5 — Validación
- Scanned all internal markdown links for broken references.
- Checked for orphan files and contradictions.
- Report: `REFACTOR_REPORT.md`.

## Source → Destination map (this migration)
```
archive/spec-v1/MASTER_SPEC.md (v1, 1596 lines)
        │ (preserved, not deleted)
        ▼
docs/platform/MASTER_SPEC.md  (thin index, links only)   [NEW]

(no file was deleted; only added/linked)
```
