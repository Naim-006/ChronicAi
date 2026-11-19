# Universal Personal Medical AI — Intelligent Lifelong Healthcare Platform

> **"Your Entire Medical Life. One Intelligent Platform."**

A production-quality personal healthcare intelligence platform designed to store an individual's complete medical history, understand health records, track conditions and medications, monitor longitudinal biometrics, and provide context-grounded AI assistance.

---

## Key Capabilities

- **Personal Medical Vault**: Secure multi-format document repository (prescriptions, lab panels, imaging, discharge summaries) with automated extraction and Human-In-The-Loop (HITL) review.
- **Lifelong Medical Timeline**: Chronological, searchable medical trajectory connecting doctor visits, diagnoses, treatments, and test results.
- **Medication Intelligence**: Active prescription schedules, refill notifications, and daily adherence tracking (`Taken`, `Skipped`, `Snoozed`).
- **Health Measurements & Analytics**: Multi-metric longitudinal analytics (Blood Pressure, Glucose, HbA1c, Weight, Temp, SpO2) with clinical reference intervals and multi-report comparison.
- **Context-Aware Medical AI Assistant**: Grounded Retrieval-Augmented Generation (RAG) assistant with mandatory document citations and emergency red-flag triage protection.
- **Chronic Care Management**: Dedicated, specialized modules starting with Diabetes Care (glucose logs, HbA1c trajectory, hypo/hyperglycemia alerts).
- **Patient-Controlled Sharing**: One-click professional medical summaries and time-limited, encrypted access links for doctor visits.

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, React Hook Form, Zod.
- **Backend & Persistence**: PostgreSQL 16 via Supabase, Row Level Security (RLS), pgvector embeddings, AES-256 encrypted storage.
- **AI Architecture**: Pluggable multi-provider engine (Gemini, OpenAI, Claude, Mock) with grounded RAG and clinical safety filters.

---

## Documentation

- [Project Progress](docs/PROJECT_PROGRESS.md)
- [Product Overview](docs/PRODUCT_OVERVIEW.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [AI Architecture & Safety](docs/AI_ARCHITECTURE.md)
- [Security & Compliance](docs/SECURITY.md)
- [Implementation Roadmap](docs/ROADMAP.md)
- [Developer Setup Guide](docs/DEVELOPMENT.md)

---

## License
Proprietary — All rights reserved.
