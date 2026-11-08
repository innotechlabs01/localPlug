# Palette UX Journal

## 2026-11-08 - Accessible Card Selection Groups
**Learning:** Selection cards rendered with `<button>` elements in multi-option forms (such as traveler profiles or package pickers) require ARIA radio semantics (`role="radiogroup"` on container, `role="radio"` and `aria-checked` on items) alongside compound `aria-label`s and `focus-visible` styling. Without these, screen reader and keyboard users cannot easily determine group association, selection state, or navigate via standard keyboard cues.
**Action:** When designing or refactoring card selection patterns in forms, always provide `role="radiogroup"`, `role="radio"`, `aria-checked={isSelected}`, `aria-label={`${title}: ${description}`}`, and distinct `focus-visible:ring-2` focus rings.
