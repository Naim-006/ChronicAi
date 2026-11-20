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

    const promptText = `You are a world-class board-certified clinical medical AI and expert optical character recognition (OCR) engine for ChronicAI.
Analyze this scanned medical record / document carefully and extract all clinical entities.
File name: ${fileName}

CRITICAL INSTRUCTIONS & SMART MULTILINGUAL TRANSLATION (BANGLA/ENGLISH MIX TO CLEAN ENGLISH):
1. SMART MULTILINGUAL TRANSLATION:
   - Prescriptions, diagnostic reports, and medical consultation notes frequently contain a mixture of Bengali (বাংলা) and English.
   - For example: medicine brand names in English combined with Bengali handwriting or print for dosage instructions, timings, duration, dietary advice, symptoms, or diagnoses (e.g. "১+০+১ খাবারের পর", "দিনে ২ বার", "জ্বর ও কাশি", "৭ দিন খাবেন", "খাবার ৩০ মিনিট আগে").
   - You MUST act as an intelligent medical translator and convert ANY and ALL Bengali text, instructions, symptoms, diagnoses, timings, dosages, and notes into clean, professional, standardized clinical English!
   - Examples of smart clinical translation:
     * "১+০+১ খাবারের পর" -> frequency: "1-0-1 (Twice daily)", timing: "Morning and Night after meals"
     * "১+১+১ খাবারের আগে" -> frequency: "1-1-1 (Three times daily)", timing: "Morning, Afternoon, and Night before meals"
     * "দিনে ৩ বার খাবার ৩০ মিনিট আগে" -> frequency: "Three times daily", timing: "30 minutes before meals"
     * "৭ দিন" / "৭ দিন চলবে" -> duration_text: "for 7 days", duration_days: 7
     * "২ সপ্তাহ" -> duration_text: "for 2 weeks", duration_days: 14
     * "১ মাস" -> duration_text: "for 1 month", duration_days: 30
     * "খাবার পর লাগাবেন" (cream/ointment) -> instructions: "Apply topically after washing"
     * Bengali complaints/diagnoses (e.g. "চুলকানি ও লালচে দাগ", "জ্বর ও গলা ব্যথা") -> translate to proper clinical English terms (e.g. "Pruritus and erythematous annular lesions / Tinea corporis", "Fever and pharyngitis").
   - ALL structured JSON fields (summary, facility_name, doctor_name, medications, instructions, timings, diagnoses, and lab results) MUST BE 100% IN PROFESSIONAL MEDICAL ENGLISH.
2. Transcribe visible text accurately (in extracted_text you may keep original transcription, but all structured JSON fields must be translated to English).
3. Identify the document type: "lab_report", "prescription", "discharge_summary", "imaging", "doctor_note", or "other".
4. Extract clinic/hospital/lab facility name, treating physician's name, and official document or collection date (format: YYYY-MM-DD; if not visible, use today's date).
5. Extract all lab test results / biomarkers: test name, numeric or qualitative value, unit (e.g. mg/dL, %, mL/min), reference range, and whether the value is abnormal (true/false).
6. Extract any prescribed medications with DURATION & TIMING RANGES: drug name, generic name, dosage/strength, frequency (e.g. "1-0-1", "Once daily"), timing/schedule (e.g. "Morning, Night after meal"), route (e.g. oral, topical, inhaler), duration_days (number of days, e.g. 7 for "৭ দিন", 42 for "৬ সপ্তাহ", 14 for "14 days"; null if ongoing/chronic), duration_text (e.g. "for 14 days", "for 6 weeks"), start_date (YYYY-MM-DD, defaults to document date), and end_date (YYYY-MM-DD, calculated as start_date + duration_days if a duration is specified). If the prescription has stepped or phased therapy (e.g. take X for 10 days, then take Y for 3 weeks), extract both items with consecutive date ranges!
7. Extract any explicit clinical diagnoses or conditions mentioned.
8. Write a concise, professional 2-3 sentence clinical summary strictly in English.
9. Assess your overall confidence score (integer 0-100).

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
      "timing": "string",
      "duration_days": 14,
      "duration_text": "for 14 days",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
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

    // High-speed multimodal OCR candidate models (flash-lite prioritised for sub-2s latency)
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.5-flash",
    ];

    let geminiRes: Response | null = null;
    let lastErrorText = "";

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        });

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          lastErrorText = await res.text();
          console.warn(`OCR model ${modelName} returned status ${res.status}:`, lastErrorText.slice(0, 100));
        }
      } catch (fetchErr: any) {
        lastErrorText = fetchErr?.message || "Network error";
        console.warn(`OCR model ${modelName} fetch error:`, lastErrorText);
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(lastErrorText);
      } catch {}

      const msg = parsedErr?.error?.message || `Gemini API returned status ${geminiRes?.status || 502}`;
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
