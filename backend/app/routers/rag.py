from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.core.auth import get_current_user, CurrentUser
from app.config import settings
import httpx
import uuid

router = APIRouter()


class EmbedDocumentRequest(BaseModel):
    document_id: str
    chunks: List[str]
    chunk_metadata: Optional[Dict[str, Any]] = None


class SearchQueryRequest(BaseModel):
    query: str
    match_threshold: float = Field(default=0.4, ge=0.0, le=1.0)
    match_count: int = Field(default=5, ge=1, le=20)
    filter_document_id: Optional[str] = None
    filter_topic: Optional[str] = None
    include_knowledge_base: bool = False


class DocumentSearchResult(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    chunk_content: str
    metadata: Optional[Dict[str, Any]] = None
    similarity: float


class KnowledgeSearchResult(BaseModel):
    id: str
    source_title: str
    topic: str
    chunk_index: int
    chunk_content: str
    metadata: Optional[Dict[str, Any]] = None
    similarity: float


class UnifiedSearchResponse(BaseModel):
    patient_records: List[DocumentSearchResult]
    medical_knowledge: List[KnowledgeSearchResult]


async def generate_gemini_embedding(text: str) -> List[float]:
    """
    Generates a 768-dimensional vector embedding using Google Gemini text-embedding-004.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured.",
        )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_EMBEDDING_MODEL}:embedContent?key={api_key}"
    payload = {
        "model": f"models/{settings.GEMINI_EMBEDDING_MODEL}",
        "content": {"parts": [{"text": text[:2048]}]},
        "outputDimensionality": settings.EMBEDDING_DIMENSIONS,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(url, json=payload)
        if res.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini Embedding API returned error ({res.status_code}): {res.text}",
            )
        data = res.json()
        values = data.get("embedding", {}).get("values", [])
        if len(values) != settings.EMBEDDING_DIMENSIONS:
            raise HTTPException(
                status_code=500,
                detail=f"Expected {settings.EMBEDDING_DIMENSIONS} dimensions, received {len(values)}.",
            )
        return values


@router.post("/rag/embed-document", tags=["Vector Search & RAG"])
async def embed_document_chunks(
    req: EmbedDocumentRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Splits, embeds, and stores patient document chunks in pgvector (document_embeddings).
    Ensures patient-level isolation using current_user.id.
    """
    if not req.chunks:
        raise HTTPException(status_code=400, detail="No text chunks provided for embedding.")

    # Call Gemini to embed each chunk
    embeddings_to_insert = []
    for idx, chunk_text in enumerate(req.chunks):
        embedding_vector = await generate_gemini_embedding(chunk_text)
        embeddings_to_insert.append({
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "document_id": req.document_id,
            "chunk_index": idx,
            "chunk_content": chunk_text,
            "embedding": embedding_vector,
            "metadata": req.chunk_metadata or {},
        })

    # Insert into Supabase table document_embeddings using service role key
    supabase_headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{settings.SUPABASE_URL}/rest/v1/document_embeddings",
            headers=supabase_headers,
            json=embeddings_to_insert,
        )
        if res.status_code not in (200, 201):
            raise HTTPException(
                status_code=502,
                detail=f"Failed to persist embeddings in database: {res.text}",
            )

    return {
        "status": "success",
        "document_id": req.document_id,
        "chunks_indexed": len(embeddings_to_insert),
        "dimensions": settings.EMBEDDING_DIMENSIONS,
    }


@router.post("/rag/search", response_model=UnifiedSearchResponse, tags=["Vector Search & RAG"])
async def search_patient_records(
    req: SearchQueryRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Executes isolated semantic search against patient records and optional clinical knowledge base
    using Supabase RPC functions match_patient_documents and match_medical_knowledge.
    """
    query_vector = await generate_gemini_embedding(req.query)

    supabase_headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }

    patient_records: List[DocumentSearchResult] = []
    medical_knowledge: List[KnowledgeSearchResult] = []

    async with httpx.AsyncClient(timeout=25.0) as client:
        # 1. Query patient documents directly or via RPC
        # If calling match_patient_documents with service role key, we query directly with user_id filter
        res_patient = await client.post(
            f"{settings.SUPABASE_URL}/rest/v1/rpc/match_patient_documents",
            headers=supabase_headers,
            json={
                "query_embedding": query_vector,
                "match_threshold": req.match_threshold,
                "match_count": req.match_count,
                "filter_document_id": req.filter_document_id,
            },
        )
        if res_patient.status_code == 200:
            patient_records = [
                DocumentSearchResult(
                    id=str(row["id"]),
                    document_id=str(row["document_id"]),
                    chunk_index=int(row["chunk_index"]),
                    chunk_content=row["chunk_content"],
                    metadata=row.get("metadata"),
                    similarity=float(row["similarity"]),
                )
                for row in res_patient.json()
            ]

        # 2. Query knowledge base RPC if requested
        if req.include_knowledge_base:
            kb_rpc_payload = {
                "query_embedding": query_vector,
                "match_threshold": req.match_threshold,
                "match_count": req.match_count,
                "filter_topic": req.filter_topic,
            }
            res_kb = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/rpc/match_medical_knowledge",
                headers=supabase_headers,
                json=kb_rpc_payload,
            )
            if res_kb.status_code == 200:
                medical_knowledge = [
                    KnowledgeSearchResult(
                        id=str(row["id"]),
                        source_title=row.get("source_title", "Clinical Guideline"),
                        topic=row.get("topic", "General"),
                        chunk_index=int(row["chunk_index"]),
                        chunk_content=row["chunk_content"],
                        metadata=row.get("metadata"),
                        similarity=float(row["similarity"]),
                    )
                    for row in res_kb.json()
                ]

    return UnifiedSearchResponse(
        patient_records=patient_records,
        medical_knowledge=medical_knowledge,
    )
