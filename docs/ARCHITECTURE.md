# System Architecture — Universal Personal Medical AI

## 1. High-Level Architecture

The platform is designed as a **Modular Monolith** optimized for developer velocity, robust typing, and clinical data integrity, with clean boundaries allowing seamless migration to micro-services or mobile clients.

```
                    ┌────────────────────────────────────────┐
                    │      Client Layer (Next.js 16 Web)     │
                    │      Future Mobile App (Flutter)       │
                    └───────────────────┬────────────────────┘
                                        │ HTTPS / WSS
                                        ▼
                    ┌────────────────────────────────────────┐
                    │    Edge & Routing Layer (App Router)   │
                    │   - Server Actions / Route Handlers    │
                    │   - Session & Auth Verification (JWT)  │
                    │   - PHI Sanitizer & Rate Limiting      │
                    └───────────────────┬────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌────────────────────┐       ┌────────────────────┐       ┌────────────────────┐
│ Domain Services    │       │ AI & RAG Engine    │       │ Processing Worker  │
│ - Vault Service    │       │ - Multi-LLM Layer  │       │ - Vision OCR / NLP │
│ - Timeline Engine  │       │ - Hybrid Search    │       │ - Follow-Up Crons  │
│ - Medication Engine│       │ - Safety Guardrails│       │ - PDF Generator    │
│ - Biometric Engine │       │ - Citation Mapper  │       │                    │
└──────────┬─────────┘       └──────────┬─────────┘       └──────────┬─────────┘
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        ▼
                    ┌────────────────────────────────────────┐
                    │       Persistence Layer (Supabase)     │
                    │  - PostgreSQL 16 (Relational Tables)   │
                    │  - Row Level Security (Tenant Policy)  │
                    │  - pgvector (Document Embeddings)      │
                    │  - Encrypted Storage Buckets (AES-256) │
                    └────────────────────────────────────────┘
```

---

## 2. Domain Feature Modularity
Each major capability is housed in `src/features/[module]` with clear separation:
- `components/`: UI specific to the domain.
- `services/`: Server-side business logic and data access.
- `schemas/`: Zod validation models shared between client and server.
- `types/`: Strict TypeScript interfaces.
- `hooks/`: Domain-specific React hooks.

---

## 3. Technology Stack Rationale
- **Next.js 16 (App Router)**: Hybrid Server Component rendering drastically reduces client bundle size for high performance on mobile devices.
- **Tailwind CSS v4 & shadcn/ui**: Clean, accessible component foundations without runtime CSS-in-JS overhead.
- **Supabase & PostgreSQL**: Battle-tested database with atomic transactions, ACID guarantees, and database-level security via Row Level Security (RLS).
- **pgvector**: Eliminates external vector database complexity by co-locating semantic embeddings with relational patient data.
