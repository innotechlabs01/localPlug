# Palette's Journal - Critical UX & Accessibility Learnings

## 2026-11-10 - Dialog Semantics and Escape-to-Focus Restoration Pattern
**Learning:** Floating overlay widgets (like concierge/AI chat windows) often lack accessible dialog semantics and keyboard control. Without `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`, screen reader users miss context about the popup boundary. Furthermore, without an `Escape` key listener and explicit focus restoration to the trigger button (`triggerRef.current?.focus()`), keyboard-only users get disoriented when the panel unmounts and focus falls back to document body.
**Action:** When implementing popup or floating interactive panels, always pair `aria-expanded` and `aria-haspopup="dialog"` on the trigger with `role="dialog"`, `aria-labelledby`, an `Escape` keyboard dismissal handler, and focus restoration to the activator button.
