# UX Checklist

Apply to every UI feature. Derived from `08-ui/` and `../03-engineering/coding-standards.md`.

## Design system
- [ ] Uses tokens from `../08-ui/design-system.md` (no hardcoded colors/spacing)
- [ ] Touch targets ≥ 44px
- [ ] Dark theme background tokens applied

## Mobile-first (Driver Portal PWA)
- [ ] Designed for 375px+ first
- [ ] Offline indicator shown when connectivity lost
- [ ] Smooth transitions between screens
- [ ] Haptic feedback on critical actions (where supported)

## Principles (Constitution §2)
- [ ] Builds a workflow, not a screen
- [ ] Minimizes friction (fewest interactions)
- [ ] Intentional actions, not bare buttons
- [ ] Decision-support, not a dashboard

## Accessibility & states
- [ ] Loading / error / empty / disabled states handled
- [ ] Readable text contrast
- [ ] No business logic in components

## PWA
- [ ] Installable; manifest present
- [ ] Splash screen with brand logo
