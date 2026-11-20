# ChronicAI Python FastAPI Backend

High-performance, HIPAA-aligned clinical intelligence backend powering:
- **Multimodal OCR & Entity Extraction** (Google Gemini 2.5 Flash)
- **Vector Embeddings & Semantic Document Indexing** (`text-embedding-004`, 768 dimensions)
- **Patient-Isolated Vector Search & RAG** (Supabase `pgvector` with HNSW cosine distance indexing)
- **Evidence-Based Clinical Reasoning Copilot** with guideline grounding

---

## 🛠️ Quickstart

### 1. Requirements
- Python 3.10+
- Virtual environment tool (e.g. `venv`, `uv`, or `conda`)

### 2. Environment Setup
Create a `.env` file in `backend/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://rzxzdwwnivvcfvmzhbia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Running the Dev Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 📡 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/health` | GET | Public | Service health & Supabase connection status |
| `/api/v1/ocr/analyze` | POST | Bearer JWT | Multimodal extraction of labs, medications & diagnosis from images/PDFs |
| `/api/v1/rag/embed-document` | POST | Bearer JWT | Generates 768-dim embeddings and saves to `document_embeddings` |
| `/api/v1/rag/search` | POST | Bearer JWT | Patient-isolated semantic search using `match_patient_documents` RPC |
| `/api/v1/copilot/consult` | POST | Bearer JWT | RAG clinical consult grounded in patient records & medical guidelines |
| `/api/v1/copilot/guidelines/ingest` | POST | Bearer JWT | Ingests clinical guideline chunks into `medical_knowledge_embeddings` |
