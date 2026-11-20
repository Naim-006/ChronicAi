import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzxzdwwnivvcfvmzhbia.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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

    // Fetch user's real clinical database records with privileged client
    const supabase = getSupabaseClient();

    const [profileRes, docsRes, metricsRes, medsRes, extRes] = await Promise.all([
      supabase.from("health_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("medical_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(35),
      supabase
        .from("medications")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("extracted_records")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const profile = profileRes.data || null;
    const documents = docsRes.data || [];
    const metrics = metricsRes.data || [];
    const medications = medsRes.data || [];
    const allExtracted = extRes.data || [];

    // Resolve Target Document (explicitly attached, reference in messages, or inferred from query)
    let targetDocId = attachedDocId;

    if (!targetDocId) {
      // Check if current query or recent message contains [Attached Reference: ...]
      const combinedHistoryText = `${query} ${(messages || []).map((m: any) => m.content || "").join(" ")}`;
      const refMatch = combinedHistoryText.match(/\[Attached Reference:\s*([^\]]+)\]/i);
      if (refMatch && refMatch[1]) {
        const refName = refMatch[1].trim().toLowerCase();
        const matched = documents.find(
          (d: any) =>
            d.file_name?.toLowerCase().includes(refName) ||
            refName.includes(d.file_name?.toLowerCase()) ||
            d.id === refMatch[1].trim()
        );
        if (matched) targetDocId = matched.id;
      }
    }

    if (!targetDocId && documents.length > 0) {
      const qLower = query.toLowerCase();
      if (
        qLower.includes("this") ||
        qLower.includes("report") ||
        qLower.includes("lab") ||
        qLower.includes("result") ||
        qLower.includes("document") ||
        qLower.includes("test") ||
        qLower.includes("panel") ||
        qLower.includes("blood") ||
        qLower.includes("prescription") ||
        qLower.includes("doctor")
      ) {
        targetDocId = documents[0].id;
      }
    }

    let attachedDocDetails: any = null;
    let attachedExtractedData: any = null;
    let attachedChunks: any[] = [];
    let attachedDocMetrics: any[] = [];

    if (targetDocId) {
      const targetExt = allExtracted.find((e: any) => e.document_id === targetDocId);
      const [docRes, extDetailRes, chunkRes, docMetricsRes] = await Promise.all([
        supabase.from("medical_documents").select("*").eq("id", targetDocId).maybeSingle(),
        targetExt ? Promise.resolve({ data: targetExt }) : supabase.from("extracted_records").select("*").eq("document_id", targetDocId).maybeSingle(),
        supabase
          .from("document_embeddings")
          .select("chunk_index, chunk_content, metadata")
          .eq("document_id", targetDocId)
          .order("chunk_index", { ascending: true }),
        supabase.from("health_metrics").select("*").eq("document_id", targetDocId),
      ]);

      attachedDocDetails = docRes.data || null;
      attachedExtractedData = extDetailRes.data?.confirmed_data || extDetailRes.data?.raw_extracted || null;
      attachedChunks = chunkRes.data || [];
      attachedDocMetrics = docMetricsRes.data || [];
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
      // Formulate vector search term (augment with document summary if available)
      const searchQuery = attachedDocDetails?.summary
        ? `${query} ${attachedDocDetails.summary.slice(0, 300)}`
        : query;

      const embedUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${apiKey}`;
      const embedRes = await fetch(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: searchQuery.slice(0, 1024) }] },
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
              match_threshold: 0.25,
              match_count: 5,
              filter_document_id: targetDocId || null,
            }),
            supabase.rpc("match_medical_knowledge", {
              query_embedding: JSON.stringify(queryVector) as any,
              match_threshold: 0.25,
              match_count: 4,
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
      console.warn("RAG retrieval warning:", ragErr);
    }

    // Prepare rich patient dossier context for Gemini
    const patientDossier = {
      patient_name: profile?.full_name || "Patient",
      sex: profile?.sex || "Unspecified",
      age: profile?.date_of_birth ? `${new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()} years old` : "Adult",
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
      attached_document: attachedDocDetails
        ? {
            id: attachedDocDetails.id,
            file_name: attachedDocDetails.file_name,
            category: attachedDocDetails.category,
            facility: attachedDocDetails.facility_name,
            doctor: attachedDocDetails.doctor_name,
            document_date: attachedDocDetails.document_date,
            summary: attachedDocDetails.summary,
            extracted_clinical_data: attachedExtractedData,
            document_text_chunks: attachedChunks.map((c) => c.chunk_content),
            associated_metrics: attachedDocMetrics.map((m: any) => ({
              test: m.notes,
              value: m.value_primary,
              unit: m.unit,
              is_abnormal: m.is_abnormal,
            })),
          }
        : null,
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
      vault_documents: documents.map((d: any) => {
        const ext = allExtracted.find((e: any) => e.document_id === d.id);
        const docData = ext?.confirmed_data || ext?.raw_extracted || {};
        return {
          id: d.id,
          file_name: d.file_name,
          category: d.category,
          facility: d.facility_name,
          doctor: d.doctor_name,
          date: d.document_date,
          summary: d.summary,
          lab_results: docData.lab_results || [],
          medications: docData.medications || [],
          diagnoses: docData.diagnoses || [],
        };
      }),
    };

    const systemInstruction = `You are ChronicAI Super Clinical Intelligence Agent — a world-class, autonomous medical AI copilot for chronic disease management, clinical diagnostics, and patient advocacy.
You are assisting ${patientDossier.patient_name}.

YOUR CORE MISSION & AGENTIC ROLES:
1. DEEP MEDICAL REASONING & COMPREHENSIVE ANALYSIS:
   - When a document is attached or referred to (e.g. "tell me about this", "what is this", "explain my lab report", etc.): Provide an EXHAUSTIVE, structured clinical breakdown. State the test name, exact value, unit, reference range, whether it is normal or abnormal, the physiological role of that biomarker (e.g. renal filtration for creatinine, glycemic control for HbA1c, liver enzymes, lipids, hematology/CBC/platelets/MPV), and what it implies for the patient's overall health and chronic disease status.
   - When answering ANY medical or health question: Answer with high clinical intelligence, thoroughness, and scientific clarity. Explain the pathophysiology, mechanism of action, lifestyle/diet impacts, and clinical practice standards (ADA, ACC/AHA, KDIGO, GOLD, etc.).
   - CRITICAL GROUNDED INTELLIGENCE RULE: NEVER say or claim that data metrics, lab values, or records are "not loaded into your digital vault records yet" or "missing" if ANY document, summary, lab result, or biomarker is present in the patient dossier or vault documents. You have full access to all verified records in the vault (such as Serum Creatinine, Complete Blood Count, Platelets, MPV, Hemoglobin, Prescriptions, etc.). Always examine the dossier and provide a comprehensive clinical analysis.

2. AGENTIC CAPABILITIES & STRUCTURED ACTION PLANS:
   Structure your clinical responses using clear markdown sections:
   - 📊 **Clinical Overview & Biomarker Analysis**: Clear interpretation of findings, exact numbers, normal vs abnormal status, and organ system context.
   - 💡 **Physiological Insights & Health Impact**: Patient-friendly translation of clinical implications and disease trajectory.
   - 🩺 **Agent Action Plan & Next Steps**: Immediate, prioritized lifestyle, dietary, or monitoring recommendations (e.g. hydration, sodium restriction, fasting checks).
   - 📋 **Doctor Discussion Agenda**: 3-4 prioritized, high-yield questions for the patient to ask their physician at their next appointment.

3. EXPLANATION DEPTH:
   - The user requested "${explanationDepth}" depth.
   - "plain": Conversational, clear, empathetic, translating complex jargon into intuitive concepts.
   - "clinical": Precise medical terminology, pharmacological mechanisms, and quantitative clinical thresholds.

4. SAFETY & CLINICAL GOVERNANCE:
   - Remind the patient to discuss any dosage or treatment modifications with their licensed provider.
   - If emergency red-flag symptoms are noted (severe chest pain, acute shortness of breath, acute neurological signs, severe hypoglycemia), flag "is_emergency_flag": true and recommend immediate emergency evaluation.

PATIENT CLINICAL DOSSIER & ATTACHED RECORDS:
${JSON.stringify(patientDossier, null, 2)}

RESPONSE FORMAT:
Return strictly a valid JSON object matching this schema:
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
    const formattedHistory = messages.slice(-8).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Ensure the current user prompt is included
    formattedHistory.push({
      role: "user",
      parts: [{ text: query }],
    });

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: formattedHistory,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.15,
      },
    };

    // Robust Multi-Model Fallback for high availability and low latency
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
    ];

    let geminiRes: Response | null = null;
    let lastErrorText = "";

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
          signal: AbortSignal.timeout(12000),
        });

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          lastErrorText = await res.text();
          console.warn(`Model ${modelName} returned status ${res.status}:`, lastErrorText.slice(0, 100));
        }
      } catch (fetchErr: any) {
        lastErrorText = fetchErr?.message || "Network error";
        console.warn(`Model ${modelName} fetch error:`, lastErrorText);
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_ERROR",
          message: `Gemini API returned error: ${lastErrorText.slice(0, 180)}`,
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

    let parsedResponse: any = null;
    try {
      parsedResponse = JSON.parse(candidateText);
    } catch {
      parsedResponse = {
        reply: candidateText,
        citations: [],
        is_emergency_flag: isEmergencyFlag,
      };
    }

    // Build citations if document attached
    let finalCitations = parsedResponse.citations || [];
    if (finalCitations.length === 0 && attachedDocDetails) {
      finalCitations = [
        {
          document_id: attachedDocDetails.id,
          document_title: attachedDocDetails.file_name,
          date: attachedDocDetails.document_date || attachedDocDetails.created_at,
          page: 1,
          snippet: attachedDocDetails.summary || "Verified medical record in vault",
        },
      ];
    }

    return NextResponse.json({
      success: true,
      reply: parsedResponse.reply,
      citations: finalCitations,
      is_emergency_flag: parsedResponse.is_emergency_flag || isEmergencyFlag,
    });
  } catch (err: any) {
    console.error("Clinical assistant chat error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err.message || "An error occurred while generating the clinical consultation.",
      },
      { status: 500 }
    );
  }
}
