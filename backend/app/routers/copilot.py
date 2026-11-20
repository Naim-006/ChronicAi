from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.core.auth import get_current_user, CurrentUser
from app.config import settings
from app.routers.rag import generate_gemini_embedding
import httpx
import uuid

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class CopilotConsultRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    recent_history: Optional[List[ChatMessage]] = Field(default_factory=list)


class CopilotSource(BaseModel):
    source_type: str  # "patient_record" or "clinical_guideline"
    title: str
    content_snippet: str
    similarity: float


class CopilotConsultResponse(BaseModel):
    answer: str
    clinical_risk_tier: str  # "low", "moderate", "high", "critical"
    actionable_recommendations: List[str]
    questions_for_doctor: List[str]
    grounded_sources: List[CopilotSource]


class IngestGuidelineRequest(BaseModel):
    source_title: str
    topic: str
    chunk_content: str
    source_url: Optional[str] = None
    chunk_index: Optional[int] = 0
    token_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/copilot/consult", response_model=CopilotConsultResponse, tags=["Clinical Copilot"])
async def consult_copilot(
    req: CopilotConsultRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    RAG-grounded clinical AI copilot.
    1. Embeds patient inquiry via text-embedding-004.
    2. Retrieves isolated patient EHR records via match_patient_documents RPC.
    3. Retrieves clinical guidelines via match_medical_knowledge RPC.
    4. Synthesizes medical guidance with Gemini 2.5 Flash.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    # 1. Embed query for RAG
    query_vector = await generate_gemini_embedding(req.query)

    supabase_headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }

    grounded_sources: List[CopilotSource] = []
    patient_context_lines: List[str] = []
    knowledge_context_lines: List[str] = []

    # 2. Retrieve patient records and clinical guidelines
    async with httpx.AsyncClient(timeout=25.0) as client:
        # Patient documents RPC
        res_patient = await client.post(
            f"{settings.SUPABASE_URL}/rest/v1/rpc/match_patient_documents",
            headers=supabase_headers,
            json={
                "query_embedding": query_vector,
                "match_threshold": 0.35,
                "match_count": 4,
            },
        )
        if res_patient.status_code == 200:
            for row in res_patient.json():
                content = row.get("chunk_content", "")
                patient_context_lines.append(f"- [Patient Record]: {content}")
                grounded_sources.append(
                    CopilotSource(
                        source_type="patient_record",
                        title=row.get("metadata", {}).get("category", "Medical Record"),
                        content_snippet=content[:200] + "...",
                        similarity=float(row.get("similarity", 0)),
                    )
                )

        # Medical knowledge guidelines RPC
        res_kb = await client.post(
            f"{settings.SUPABASE_URL}/rest/v1/rpc/match_medical_knowledge",
            headers=supabase_headers,
            json={
                "query_embedding": query_vector,
                "match_threshold": 0.40,
                "match_count": 3,
            },
        )
        if res_kb.status_code == 200:
            for row in res_kb.json():
                content = row.get("chunk_content", "")
                knowledge_context_lines.append(f"- [Guideline - {row.get('topic')}]: {content}")
                grounded_sources.append(
                    CopilotSource(
                        source_type="clinical_guideline",
                        title=f"{row.get('source_title')} ({row.get('topic')})",
                        content_snippet=content[:200] + "...",
                        similarity=float(row.get("similarity", 0)),
                    )
                )

    patient_context = "\n".join(patient_context_lines) if patient_context_lines else "No specific prior matching lab records found."
    guideline_context = "\n".join(knowledge_context_lines) if knowledge_context_lines else "Standard evidence-based internal medicine standards apply."

    # 3. Construct Clinical Copilot prompt
    system_prompt = f"""You are ChronicAI's Clinical Reasoning Copilot, an evidence-based clinical intelligence system.
You assist chronic disease patients and reviewing clinicians with high-precision, empathetic, and scientifically grounded insights.

IMPORTANT CLINICAL CONSTRAINTS:
1. Always base statements on the provided Patient EHR records and Clinical Guidelines.
2. Clearly distinguish between verified patient history vs general clinical information.
3. State uncertainty when data is missing or incomplete.
4. Output strictly valid JSON conforming to the requested schema.

PATIENT EHR CONTEXT:
{patient_context}

CLINICAL GUIDELINES & PROTOCOLS:
{guideline_context}

Return a JSON object with:
- "answer": Clear, informative clinical analysis directly answering the query.
- "clinical_risk_tier": "low" | "moderate" | "high" | "critical"
- "actionable_recommendations": list of short, concrete next steps or lifestyle/monitoring tips.
- "questions_for_doctor": list of 2-4 high-value questions for the patient to ask their physician.
"""

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt},
                    {"text": f"User Query: {req.query}"},
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        },
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(gemini_url, json=payload)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Gemini API error: {res.text}")

        res_json = res.json()
        raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        import json
        parsed = json.loads(raw_text)

        return CopilotConsultResponse(
            answer=parsed.get("answer", "Analysis completed."),
            clinical_risk_tier=parsed.get("clinical_risk_tier", "low"),
            actionable_recommendations=parsed.get("actionable_recommendations", []),
            questions_for_doctor=parsed.get("questions_for_doctor", []),
            grounded_sources=grounded_sources,
        )


@router.post("/copilot/guidelines/ingest", tags=["Clinical Copilot"])
async def ingest_clinical_guideline(
    req: IngestGuidelineRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Ingests official clinical practice guidelines (e.g. ADA Diabetes, ACC/AHA Hypertension)
    into the vector database (medical_knowledge_embeddings).
    """
    embedding_vector = await generate_gemini_embedding(f"{req.topic}: {req.chunk_content}")

    supabase_headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }

    row_data = {
        "id": str(uuid.uuid4()),
        "source_title": req.source_title,
        "source_url": req.source_url,
        "topic": req.topic,
        "chunk_index": req.chunk_index or 0,
        "chunk_content": req.chunk_content,
        "token_count": req.token_count,
        "embedding": embedding_vector,
        "metadata": req.metadata or {},
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(
            f"{settings.SUPABASE_URL}/rest/v1/medical_knowledge_embeddings",
            headers=supabase_headers,
            json=row_data,
        )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Database insert error: {res.text}")

    return {"status": "success", "id": row_data["id"], "source_title": req.source_title}
