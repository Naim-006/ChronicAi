from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from app.core.auth import get_current_user, CurrentUser
from app.config import settings
import httpx
import base64

router = APIRouter()


class LabResultEntity(BaseModel):
    test_name: str
    value: str
    unit: str
    reference_range: str
    is_abnormal: bool
    category: Optional[str] = None


class MedicationEntity(BaseModel):
    name: str
    dosage: str
    frequency: str
    route: Optional[str] = "oral"
    instructions: Optional[str] = None


class OCRAnalysisResponse(BaseModel):
    category: str
    facility_name: str
    doctor_name: str
    document_date: str
    summary: str
    confidence_score: int
    lab_results: List[LabResultEntity]
    medications: List[MedicationEntity]
    extracted_text: str


@router.post("/ocr/analyze", response_model=OCRAnalysisResponse, tags=["Document Processing"])
async def analyze_document(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Parses scanned medical documents, prescriptions, or lab panels
    using Google Gemini Multimodal Vision API, extracting clinical entities.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is not configured on the backend.",
        )

    file_bytes = await file.read()
    b64_content = base64.b64encode(file_bytes).decode("utf-8")
    mime_type = file.content_type or "image/jpeg"

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"

    prompt = """You are a clinical medical AI. Analyze this medical document.
Extract: category (lab_report, prescription, discharge_summary, imaging, doctor_note, other),
facility_name, doctor_name, document_date (YYYY-MM-DD), summary, confidence_score (0-100),
lab_results (list with test_name, value, unit, reference_range, is_abnormal),
medications (list with name, dosage, frequency, route, instructions),
extracted_text.
Return strictly valid JSON."""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": mime_type, "data": b64_content}},
                ]
            }
        ],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1},
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(gemini_url, json=payload)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Gemini API error: {res.text}")

        res_json = res.json()
        raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        import json
        parsed = json.loads(raw_text)
        return parsed
