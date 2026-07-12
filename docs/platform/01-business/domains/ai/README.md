# AI DOMAIN

> AI response generation, model management, and confidence scoring.

## Responsibility
- Owns: AI response generation, model selection, confidence scoring, learning
- Does NOT own: chat conversations (Chat), notifications (Communication)

## Boundaries
- Inbound: Chat (request), Admin (configuration)
- Outbound: Chat (response), Analytics (metrics)

## Status
- Maturity: 18%
- Extraction: Not started (split across Chat, n8n, WhatsApp)
- Portal: None

## Domain Model
- **Entities**: AIResponse, AIConfidence, AIModel, AILearning
- **Value Objects**: AIModelType, ConfidenceLevel, ResponseQuality
- **Aggregates**: AIResponse (root: AIResponse, invariants: confidence thresholds)
- **Events**: ai.response_generated, ai.confidence_scored, ai.learning_updated
- **Policies**: Confidence thresholds, model selection, fallback rules

## Key Files
- `lib/agent-service.ts` — AI agent (shared with Chat)
- `lib/ai-confidence.ts` — Confidence scoring
- `app/admin/ia-chat/` — Admin AI Chat page (951L)

## Extraction Plan
1. Separate AI from Chat domain
2. Create AI domain package
3. Build model management UI
