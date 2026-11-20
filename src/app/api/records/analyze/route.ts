import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface AnalyzedDocResponse {
  category: "prescription" | "lab_report" | "imaging" | "discharge_summary" | "doctor_note" | "other";
  facility_name: string;
  doctor_name: string;
  document_date: string;
  summary: string;
  confidence_score: number;
  lab_results: Array<{
    test_name: string;
    value: number | string;
    unit: string;
    reference_range: string;
    is_abnormal: boolean;
    category?: string;
  }>;
  medications: Array<{
    name: string;
    generic_name?: string;
    dosage: string;
    frequency: string;
    route?: string;
    instructions?: string;
  }>;
  diagnoses: Array<{
    name: string;
    icd10?: string;
    status?: "active" | "managed" | "resolved";
    notes?: string;
  }>;
  extracted_text: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fileBase64,
      mimeType = "image/jpeg",
      fileName = "Document",
      apiKey: clientKey,
    } = body;

    // Resolve Gemini API key from multiple sources:
    // 1. Client passed key
    // 2. Request header `x-gemini-api-key`
    // 3. Server environment variables
    const headerKey = req.headers.get("x-gemini-api-key");
    const apiKey =
      clientKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_API_KEY",
          message:
            "No Google Gemini API key provided. Please connect your Gemini API key in Settings or scanner prompt to activate live OCR & clinical entity extraction.",
        },
        { status: 400 }
      );
    }

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, error: "NO_FILE", message: "No document file provided for analysis." },
        { status: 400 }
      );
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = fileBase64.includes(";base64,")
      ? fileBase64.split(";base64,").pop()
      : fileBase64;

    // Call Google Gemini Multimodal Vision API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const promptText = `You are a board-certified clinical medical AI and expert optical character recognition (OCR) engine for ChronicAI.
Analyze this scanned medical record / document carefully and extract all clinical entities.
File name: ${fileName}

CRITICAL INSTRUCTIONS:
1. Transcribe the visible text accurately.
2. Identify the document type: "lab_report", "prescription", "discharge_summary", "imaging", "doctor_note", or "other".
3. Extract the clinic/hospital/lab facility name, the treating physician's name, and the official document or specimen collection date (format: YYYY-MM-DD; if not visible, use today's date).
4. Extract all lab test results / biomarkers: test name, numeric or qualitative value, unit (e.g. mg/dL, %, mL/min), reference range, and whether the value is abnormal (true/false).
5. Extract any prescribed medications: drug name, generic name, dosage/strength, frequency, route (e.g. oral), and instructions.
6. Extract any explicit clinical diagnoses or conditions mentioned.
7. Write a concise, professional 2-3 sentence clinical summary.
8. Assess your overall confidence score (integer 0-100).

Return ONLY valid JSON matching this schema:
{
  "category": "lab_report" | "prescription" | "discharge_summary" | "imaging" | "doctor_note" | "other",
  "facility_name": "string",
  "doctor_name": "string",
  "document_date": "YYYY-MM-DD",
  "summary": "string",
  "confidence_score": 95,
  "lab_results": [
    {
      "test_name": "string",
      "value": "string or number",
      "unit": "string",
      "reference_range": "string",
      "is_abnormal": false,
      "category": "glycemic | renal | lipid | hematology | general"
    }
  ],
  "medications": [
    {
      "name": "string",
      "generic_name": "string",
      "dosage": "string",
      "frequency": "string",
      "route": "oral",
      "instructions": "string"
    }
  ],
  "diagnoses": [
    {
      "name": "string",
      "icd10": "string",
      "status": "active" | "managed" | "resolved",
      "notes": "string"
    }
  ],
  "extracted_text": "string"
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };

    let geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Fallback to gemini-1.5-flash if 2.5 is unavailable on this key
    if (!geminiRes.ok && geminiRes.status === 404) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      geminiRes = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch {}

      const msg = parsedErr?.error?.message || `Gemini API returned status ${geminiRes.status}`;
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_ERROR",
          message: msg,
        },
        { status: 502 }
      );
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "EMPTY_RESPONSE", message: "Gemini did not return any content." },
        { status: 502 }
      );
    }

    let parsedResult: AnalyzedDocResponse;
    try {
      parsedResult = JSON.parse(candidate);
    } catch {
      // If candidate has markdown backticks, strip them
      const cleaned = candidate.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error("Error analyzing medical document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to analyze document with Gemini API.",
      },
      { status: 500 }
    );
  }
}
