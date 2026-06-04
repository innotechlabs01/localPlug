# Chat Widget Dark Professional Redesign

## Goal
Redesign the floating chat widget from WhatsApp-style (green/beige) to Dark Professional (dark navy + red accent) inspired by Dribbble shot #21652548.

## Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `bg-chat` | `#1a1a2e` | Main chat window background |
| `bg-header` | `#16213e` | Chat header |
| `bg-input` | `#16213e` | Input bar background |
| `border` | `#0f3460` | Subtle borders |
| `accent` | `#e94560` | Send button, user bubbles, brand accent |
| `text-primary` | `#ffffff` | Header name, user bubble text |
| `text-secondary` | `#a0aec0` | Status text, timestamps |
| `bubble-user` | `#e94560` | User message bubble |
| `bubble-ai` | `#16213e` | AI message bubble background |
| `bubble-ai-border` | `#0f3460` | AI bubble subtle border |
| `bubble-ai-text` | `#e0e0e0` | AI message text |
| `floating-btn` | `#e94560` | Floating action button |

## Changes
- Floating button: red accent circle with pulse animation
- Chat window: dark navy background
- Header: dark blue with avatar, "LocalPlug" name, "Online" status
- User bubbles: red accent `#e94560`, white text, right-aligned
- AI bubbles: dark blue `#16213e`, light gray text, left-aligned, subtle border
- Input bar: dark blue background, pill-shaped input, red send button
- Close button: white `✕` in header

## Files Modified
- `app/components/chat/ChatWidget.tsx` — CSS variables and styles
