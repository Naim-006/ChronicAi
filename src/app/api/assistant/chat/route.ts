import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      query,
      messages = [],
      attachedDocId,
      explanationDepth = "plain",
      apiKey: clientKey,
    } = body;

    if (!userId || !query?.trim()) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", message: "Missing userId or query." },
        { status: 400 }
      );
    }

    // Emergency Triage Red Flags
    const redFlags = [
      "chest pain",
      "shortness of breath",
      "severe bleeding",
      "stroke",
      "loss of consciousness",
      "can't breathe",
      "heart attack",
      "coughing up blood",
      "anaphylaxis",
    ];
    const isEmergencyFlag = redFlags.some((rf) => query.toLowerCase().includes(rf));

    const headerKey = req.headers.get("x-gemini-api-key");
    const apiKey =
      clientKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Fetch user's real clinical database record
    const supabase = getSupabaseClient();

    const [profileRes, docsRes, metricsRes, medsRes] = await Promise.all([
      supabase.from("health_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("medical_documents")
        .select("*")
        .eq("user_id", userId)
        .order("document_date", { ascending: false })
        .limit(10),
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(20),
      supabase
        .from("medications")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active"),
    ]);

    const profile = profileRes.data || null;
    const documents = docsRes.data || [];
    const metrics = metricsRes.data || [];
    const medications = medsRes.data || [];

    // Optional attached document details
    let attachedDocDetails: any = null;
    if (attachedDocId) {
      const { data: aDoc } = await supabase
        .from("medical_documents")
        .select("*, extracted_records(*)")
        .eq("id", attachedDocId)
        .maybeSingle();
      attachedDocDetails = aDoc;
    }

    // If no Gemini key is provided, return an honest, grounded summary of their actual DB data
    if (!apiKey) {
      let groundedFallback = "";

      if (isEmergencyFlag) {
        groundedFallback = `⚠️ **CRITICAL TRIAGE ALERT:** The symptoms described ("${query}") may indicate a medical emergency. Please call 911 or go to the nearest emergency department immediately.\n\n`;
      }

      groundedFallback += `**System Notice:** A Google Gemini API key has not been connected yet. Here is what is currently verified in your health database:\n\n`;

      if (profile?.chronic_conditions?.length) {
        const condList = (profile.chronic_conditions as any[])
          .map((c: any) => typeof c === "string" ? c : `${c.name} (${c.status || "active"})`)
          .join(", ");
        groundedFallback += `• **Documented Conditions:** ${condList}\n`;
      } else {
        groundedFallback += `• **Chronic Conditions:** None recorded.\n`;
      }

      if (medications.length) {
        const medList = medications.map((m: any) => `${m.name} ${m.dosage || ""} (${m.frequency || ""})`).join("; ");
        groundedFallback += `• **Active Medications:** ${medList}\n`;
      } else {
        groundedFallback += `• **Active Medications:** None active.\n`;
      }

      if (metrics.length) {
        const metricList = metrics.slice(0, 5).map((m: any) => `${m.metric_type.toUpperCase()}: ${m.value_primary} ${m.unit || ""} (${m.is_abnormal ? "Abnormal" : "Normal"})`).join(" | ");
        groundedFallback += `• **Recent Biomarkers:** ${metricList}\n`;
      } else {
        groundedFallback += `• **Recent Biomarkers:** No lab metrics recorded.\n`;
      }

      if (documents.length) {
        groundedFallback += `• **Health Records:** ${documents.length} verified records in vault (${documents.map((d: any) => d.file_name).slice(0, 3).join(", ")}).\n\n`;
      } else {
        groundedFallback += `• **Health Records:** 0 documents uploaded in Vault.\n\n`;
      }

      groundedFallback += `💡 *To enable full clinical dialogue, natural-language question answering, and OCR analysis, add your Gemini API key in **Settings → AI & Scanner Credentials**.*`;

      return NextResponse.json({
        success: true,
        reply: groundedFallback,
        citations: documents.slice(0, 2).map((d: any) => ({
          document_id: d.id,
          document_title: d.file_name,
          date: d.document_date || d.created_at,
          page: 1,
          snippet: d.summary || "Verified medical record in vault",
        })),
        is_emergency_flag: isEmergencyFlag,
        requires_api_key: true,
      });
    }

    // -------------------------------------------------------------
    // RAG Pipeline: Vector semantic search on patient docs & guidelines
    // -------------------------------------------------------------
    let retrievedDocChunks: any[] = [];
    let retrievedGuidelines: any[] = [];

    try {
      const embedUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${apiKey}`;
      const embedRes = await fetch(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: query.slice(0, 1024) }] },
          outputDimensionality: 768,
        }),
      });

      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const queryVector = embedData.embedding?.values;
        if (queryVector && queryVector.length === 768) {
          const [docRpc, kbRpc] = await Promise.all([
            supabase.rpc("match_patient_documents", {
              query_embedding: JSON.stringify(queryVector) as any,
              match_threshold: 0.35,
              match_count: 4,
              filter_document_id: attachedDocId || null,
            }),
            supabase.rpc("match_medical_knowledge", {
              query_embedding: JSON.stringify(queryVector) as any,
              match_threshold: 0.35,
              match_count: 3,
            }),
          ]);

          if (docRpc.data && Array.isArray(docRpc.data)) {
            retrievedDocChunks = docRpc.data;
          }
          if (kbRpc.data && Array.isArray(kbRpc.data)) {
            retrievedGuidelines = kbRpc.data;
          }
        }
      }
    } catch (ragErr) {
      console.warn("RAG retrieval skipped or failed:", ragErr);
    }

    // Prepare patient dossier context for Gemini
    const patientDossier = {
      patient_name: profile?.full_name || "Patient",
      sex: profile?.sex || "Unspecified",
      blood_group: profile?.blood_group || "Unknown",
      height_cm: profile?.height_cm,
      weight_kg: profile?.weight_kg,
      chronic_conditions: profile?.chronic_conditions || [],
      allergies: profile?.allergies || [],
      active_medications: medications.map((m: any) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions,
        prescribing_doctor: m.prescribing_doctor,
      })),
      recent_lab_metrics: metrics.map((m: any) => ({
        type: m.metric_type,
        value: m.value_primary,
        unit: m.unit,
        is_abnormal: m.is_abnormal,
        recorded_at: m.recorded_at,
        notes: m.notes,
      })),
      retrieved_semantic_evidence: retrievedDocChunks.map((c: any) => ({
        document_id: c.document_id,
        content: c.chunk_content,
        similarity: c.similarity,
        metadata: c.metadata,
      })),
      clinical_guidelines_evidence: retrievedGuidelines.map((g: any) => ({
        source: g.source_title,
        topic: g.topic,
        guideline: g.chunk_content,
        similarity: g.similarity,
      })),
      vault_documents: documents.map((d: any) => ({
        id: d.id,
        file_name: d.file_name,
        category: d.category,
        facility: d.facility_name,
        doctor: d.doctor_name,
        date: d.document_date,
        summary: d.summary,
      })),
      attached_document: attachedDocDetails
        ? {
            id: attachedDocDetails.id,
            name: attachedDocDetails.file_name,
            summary: attachedDocDetails.summary,
            extracted: attachedDocDetails.extracted_records?.[0]?.confirmed_data || attachedDocDetails.extracted_records?.[0]?.raw_extracted,
          }
        : null,
    };

    const systemInstruction = `You are ChronicAI Clinical Copilot, an empathetic, highly competent, evidence-based AI health assistant.
You are assisting ${patientDossier.patient_name}.

CRITICAL CLINICAL RULES:
1. GROUNDING: Ground all your statements strictly in the patient's verified records provided below.
2. CITATIONS: Whenever you cite a lab result, medication, or document, reference the exact document name or test date from their record.
3. EXPLANATION DEPTH: The user requested "${explanationDepth}" depth.
   - If "plain": Use conversational, easy-to-understand language. Translate medical jargon into clear analogies.
   - If "clinical": Use precise medical terminology, pharmacological mechanisms, and quantitative clinical thresholds.
4. SAFETY & BOUNDARIES: You do not provide definitive prescriptions or replace licensed clinicians. Remind the patient to discuss treatment changes with their doctor.
5. NO HALLUCINATIONS: If the patient has no records or metrics on file for a specific query, state honestly that no data is present in their vault yet, and invite them to scan or upload that document.

PATIENT CLINICAL DOSSIER:
${JSON.stringify(patientDossier, null, 2)}

RESPONSE FORMAT:
Return a JSON object with:
{
  "reply": "Markdown formatted clinical explanation...",
  "citations": [
    {
      "document_id": "string",
      "document_title": "string",
      "date": "string",
      "page": 1,
      "snippet": "string"
    }
  ],
  "is_emergency_flag": false
}`;

    // Format previous turns for Gemini API
    const formattedHistory = messages.slice(-6).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Ensure the current user prompt is included
    formattedHistory.push({
      role: "user",
      parts: [{ text: query }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: formattedHistory,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    let geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok && geminiRes.status === 404) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      geminiRes = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_ERROR",
          message: `Gemini API returned error: ${errText.slice(0, 180)}`,
        },
        { status: 502 }
      );
    }

    const geminiJson = await geminiRes.json();
    const candidateText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return NextResponse.json(
        { success: false, error: "EMPTY_RESPONSE", message: "Gemini did not return a response." },
        { status: 502 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(candidateText);
    } catch {
      const cleaned = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      reply: parsed.reply || candidateText,
      citations: parsed.citations || [],
      is_emergency_flag: isEmergencyFlag || parsed.is_emergency_flag || false,
    });
  } catch (error: any) {
    console.error("Error in assistant chat route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to process assistant request.",
      },
      { status: 500 }
    );
  }
}
