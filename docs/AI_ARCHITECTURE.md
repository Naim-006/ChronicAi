# AI Architecture & Safety Guardrails — Universal Personal Medical AI

## 1. Modular Provider Abstraction

The platform uses a pluggable AI service interface (`src/lib/ai/provider.ts`) supporting:
- OpenAI (GPT-4o, text-embedding-3-small)
- Google Gemini (Gemini 1.5 Pro / Flash)
- Anthropic Claude (Claude 3.5 Sonnet)
- Local / Fallback mock provider for offline development and deterministic unit testing.

Configuration is controlled entirely through environment variables:
```env
AI_PROVIDER=gemini # or openai, anthropic, mock
AI_API_KEY=your_key_here
AI_MODEL=gemini-1.5-pro
AI_EMBEDDING_MODEL=text-embedding-3-small
```

---

## 2. RAG (Retrieval-Augmented Generation) Pipeline

```
[User Medical Question]
         │
         ▼
[1. Clinical Safety & Emergency Classifier]
         │
    ┌────┴──────────────────────────┐
    │ Red-flag detected?            │ Safe query
    ▼                               ▼
[Emergency Triage Alert]    [2. Multi-Context Retrieval]
                             ├── A. Relational SQL Fetch (Active conditions, medications, recent metrics)
                             └── B. Semantic Vector Fetch (Extracted document chunks via pgvector)
                                    │
                                    ▼
                            [3. Grounded Context Synthesis]
                                    │
                                    ▼
                            [4. Guardrailed LLM Execution]
                                    │
                                    ▼
                            [5. Citation Anchor Parser]
                                    │
                                    ▼
                            [Streamed Markdown with Clickable Source Chips]
```

---

## 3. Strict Healthcare Safety Protocol
1. **Never Independently Diagnose**: The system explicitly frames possibilities as topics for discussion with a doctor.
2. **Never Modify or Prescribe Medications**: Dosing alterations or discontinuation suggestions are strictly blocked.
3. **Emergency Red-Flag Interception**: If words suggesting life-threatening symptoms (e.g. crushing chest pain, anaphylaxis, severe dyspnea, stroke signs) are identified, the assistant immediately displays an Emergency Notice and instructs the user to contact local emergency services.
4. **Mandatory Attribution**: Every assertion of historical clinical fact must point to a specific document ID or verified timeline entry.
