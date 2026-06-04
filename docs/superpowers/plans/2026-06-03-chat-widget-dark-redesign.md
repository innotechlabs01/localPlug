# Chat Widget Dark Professional Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap the chat widget color scheme from WhatsApp-style (green/beige) to Dark Professional (dark navy + red accent).

**Architecture:** Single-file change to `app/components/chat/ChatWidget.tsx` — replace hardcoded green WhatsApp colors with the Dark Professional palette defined in the spec.

**Tech Stack:** Next.js 15, Tailwind CSS, React

---

### Task 1: Update ChatWidget.tsx color tokens

**Files:**
- Modify: `app/components/chat/ChatWidget.tsx`

- [ ] **Step 1: Replace WhatsApp green header with dark navy**

Change the header wrapper from green WhatsApp color to dark navy:
- Background: `bg-[#075e54]` → `bg-[#16213e]`
- Status text keep green dot but change to blue-ish
- Icon button colors to match dark theme

- [ ] **Step 2: Replace chat body background**

Change the main chat area from WhatsApp beige to dark:
- Background: `bg-[#efeae2]` → `bg-[#1a1a2e]`

- [ ] **Step 3: Update user message bubbles**

Right-aligned user messages from green to red accent:
- Background: `bg-[#d9fdd3]` → `bg-[#e94560]`
- Text: `text-gray-800` → `text-white`

- [ ] **Step 4: Update AI/agent message bubbles**

Left-aligned AI messages from white to dark card:
- Background: `bg-white` → `bg-[#16213e]`
- Text: `text-gray-800` → `text-gray-200`
- Add subtle border: `border border-[#0f3460]`

- [ ] **Step 5: Update input bar area**

Input bar from light to dark:
- Container background: transparent → `bg-[#16213e]` with top border `border-t border-[#0f3460]`
- Input field: white bg → `bg-[#1a1a2e]`, white text, `#0f3460` border
- Send button: green → `bg-[#e94560]`

- [ ] **Step 6: Update floating toggle button**

Change the FAB from WhatsApp green to red accent:
- Background: `bg-[#075e54]` → `bg-[#e94560]`

- [ ] **Step 7: Update text-muted and secondary elements**

- Timestamps, status, secondary text: use `text-[#a0aec0]` or similar gray-blue
- Close button, header icons: white or `#a0aec0`

- [ ] **Step 8: Run build to verify no errors**

```bash
npm run build 2>&1 | tail -20
```
Expected: No TypeScript or build errors.

- [ ] **Step 9: Commit**

```bash
git add app/components/chat/ChatWidget.tsx docs/superpowers/specs/2026-06-03-chat-widget-dark-redesign.md docs/superpowers/plans/2026-06-03-chat-widget-dark-redesign.md
git commit -m "feat(chat): redesign widget to Dark Professional theme"
```
