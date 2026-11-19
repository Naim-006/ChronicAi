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
- **Containerization**: Docker with multi-stage builds, Docker Compose orchestration.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20 (for local development)
- [Docker](https://www.docker.com/) ≥ 24 and Docker Compose (for containerized deployment)

### Option 1: Docker (Recommended for Hackathon / Production)

**Single command to build and run:**

```bash
# 1. Clone the repository
git clone https://github.com/Naim-006/ChronicAi.git
cd ChronicAi

# 2. Create your environment file
cp .env.example .env

# 3. Build and start (production mode)
docker compose up --build
```

The app will be available at **http://localhost:3000**.

**Development mode with hot-reload:**

```bash
docker compose --profile dev up --build
```

**Other useful commands:**

```bash
# Run in background (detached)
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop the application
docker compose down

# Rebuild from scratch (clean build)
docker compose build --no-cache
docker compose up
```

### Option 2: Local Development (without Docker)

```bash
# 1. Clone the repository
git clone https://github.com/Naim-006/ChronicAi.git
cd ChronicAi

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local

# 4. Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Docker Architecture

```
┌──────────────────────────────────────────────┐
│                 Dockerfile                   │
│                                              │
│  Stage 1: deps      (node:20-alpine)         │
│  └─ npm ci (cached dependency layer)         │
│                                              │
│  Stage 2: builder   (node:20-alpine)         │
│  └─ next build → .next/standalone            │
│                                              │
│  Stage 3: runner    (node:20-alpine)          │
│  └─ Minimal production image (~120MB)        │
│  └─ Non-root user (nextjs:nodejs)            │
│  └─ Health check endpoint                    │
│  └─ node server.js                           │
└──────────────────────────────────────────────┘
```

**Key optimizations:**
- **Multi-stage build** — final image contains only production runtime (~120MB vs ~1GB unoptimized)
- **Standalone output** — Next.js bundles only required `node_modules`, no full install needed
- **Layer caching** — `package.json` copied first so dependencies are cached across rebuilds
- **Non-root user** — runs as `nextjs:nodejs` (UID 1001) for security
- **Health checks** — built-in Docker HEALTHCHECK for orchestration readiness
- **Alpine base** — minimal Linux image for smallest attack surface

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `AI_PROVIDER` | No | AI provider: `gemini`, `openai`, `anthropic`, or `mock` (default: `mock`) |
| `AI_API_KEY` | No | API key for the selected AI provider |
| `AI_MODEL` | No | Model name (default: `gemini-1.5-pro`) |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (default: `http://localhost:3000`) |
| `APP_PORT` | No | Host port for Docker (default: `3000`) |

> **Note:** `NEXT_PUBLIC_*` variables are embedded into the client bundle at build time. To change them, you must rebuild the Docker image.

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
