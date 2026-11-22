import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

function getPrivilegedClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const QuerySchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  forceRefresh: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = QuerySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_PARAMETERS", issues: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { patientId, forceRefresh } = parseResult.data;

    // Get auth token from request header to identify doctor
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const supabase = getPrivilegedClient();

    // Verify user identity
    let callerUserId: string | null = null;
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      callerUserId = userData?.user?.id || null;
    }

    // Fallback: check session or mock header in staging
    if (!callerUserId) {
      callerUserId = req.headers.get("x-user-id") || null;
    }

    if (!callerUserId) {
      return NextResponse.json(
        { success: false, error: "NOT_AUTHENTICATED" },
        { status: 401 }
      );
    }

    // 1. Check if caller is verified doctor
    const { data: doctor, error: docError } = await supabase
      .from("doctor_profiles")
      .select("id, full_name, specialty, verification_status, is_active")
      .eq("user_id", callerUserId)
      .maybeSingle();

    if (docError || !doctor || doctor.verification_status !== "verified" || !doctor.is_active) {
      return NextResponse.json(
        { success: false, error: "DOCTOR_NOT_VERIFIED", message: "Only verified doctors may access pre-visit briefs." },
        { status: 403 }
      );
    }

    // 2. Check active access grant for this patient
    const { data: activeGrant, error: grantError } = await supabase
      .from("access_grants")
      .select("id, scope, expires_at")
      .eq("doctor_id", doctor.id)
      .eq("patient_id", patientId)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (grantError || !activeGrant) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_ACTIVE_GRANT",
          message: "Patient has not granted active consent or grant has expired/been revoked.",
        },
        { status: 403 }
      );
    }

    const grantedScopes: string[] = activeGrant.scope || [];

    // 3. Check cached Pre-Visit Brief in patient_summaries
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("patient_summaries")
        .select("*")
        .eq("patient_id", patientId)
        .eq("doctor_id", doctor.id)
        .eq("is_stale", false)
        .maybeSingle();

      if (cached && cached.summary_json && Object.keys(cached.summary_json).length > 0) {
        // Log access audit
        await supabase.rpc("doctor_log_phi_access", {
          p_patient_id: patientId,
          p_resource_type: "patient_summary",
          p_resource_id: cached.id,
          p_action: "read_cached_brief",
        });

        return NextResponse.json({
          success: true,
          cached: true,
          generatedAt: cached.generated_at,
          data: cached.summary_json,
          citations: cached.citations_json,
          redFlags: cached.red_flags,
        });
      }
    }

    // 4. Gather authorized patient data according to granted scopes
    const queries: Promise<any>[] = [];

    // Profile query
    queries.push(
      grantedScopes.includes("profile")
        ? Promise.resolve(supabase.rpc("doctor_get_patient_snapshot", { p_patient_id: patientId }))
        : Promise.resolve({ data: null })
    );

    // Medications query
    queries.push(
      grantedScopes.includes("medications")
        ? Promise.resolve(supabase.from("medications").select("*").eq("user_id", patientId).order("created_at", { ascending: false }))
        : Promise.resolve({ data: [] })
    );

    // Medication logs query (Adherence)
    queries.push(
      grantedScopes.includes("adherence")
        ? Promise.resolve(supabase.from("medication_logs").select("*").eq("user_id", patientId).gte("scheduled_time", new Date(Date.now() - 30 * 86400000).toISOString()).order("scheduled_time", { ascending: false }))
        : Promise.resolve({ data: [] })
    );

    // Metrics query
    queries.push(
      grantedScopes.includes("metrics")
        ? Promise.resolve(supabase.from("health_metrics").select("*").eq("user_id", patientId).order("recorded_at", { ascending: false }).limit(30))
        : Promise.resolve({ data: [] })
    );

    // Documents query
    queries.push(
      grantedScopes.includes("documents")
        ? Promise.resolve(supabase.from("medical_documents").select("id, file_name, category, document_date, facility_name, doctor_name, summary").eq("user_id", patientId).order("document_date", { ascending: false }).limit(10))
        : Promise.resolve({ data: [] })
    );

    // Consultations query
    queries.push(
      grantedScopes.includes("consultations")
        ? Promise.resolve(supabase.from("consultations").select("id, created_at, chief_complaints, diagnosis, advice, clinical_notes").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(5))
        : Promise.resolve({ data: [] })
    );

    const [snapRes, medsRes, logsRes, metricsRes, docsRes, consultsRes] =
      await Promise.all(queries);

    const rawSnapshot = snapRes?.data?.[0] || snapRes?.data || null;
    const medications = medsRes?.data || [];
    const medLogs = logsRes?.data || [];
    const metrics = metricsRes?.data || [];
    const documents = docsRes?.data || [];
    const consults = consultsRes?.data || [];

    // Calculate Adherence stats
    const totalDoses = medLogs.length;
    const takenDoses = medLogs.filter((l: any) => l.status === "taken").length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // Detect clinical Red Flags
    const redFlags: Array<{ severity: "critical" | "warning"; message: string; citation: string }> = [];

    // Check BP
    const latestBpSys = metrics.find((m: any) => m.metric_type === "blood_pressure_sys");
    const latestBpDia = metrics.find((m: any) => m.metric_type === "blood_pressure_dia");
    if (latestBpSys && latestBpSys.value_primary >= 140) {
      redFlags.push({
        severity: latestBpSys.value_primary >= 160 ? "critical" : "warning",
        message: `Elevated systolic blood pressure: ${latestBpSys.value_primary} mmHg (target <130)`,
        citation: `Metric: Blood Pressure (${new Date(latestBpSys.recorded_at).toLocaleDateString()})`,
      });
    }

    // Check Glucose
    const latestGlucose = metrics.find((m: any) => m.metric_type === "glucose_fasting" || m.metric_type === "glucose");
    if (latestGlucose && latestGlucose.value_primary >= 140) {
      redFlags.push({
        severity: "warning",
        message: `High fasting glucose: ${latestGlucose.value_primary} mg/dL (target 80-130)`,
        citation: `Metric: Glucose (${new Date(latestGlucose.recorded_at).toLocaleDateString()})`,
      });
    }

    // Check Adherence
    if (totalDoses >= 5 && adherenceRate < 70) {
      redFlags.push({
        severity: "warning",
        message: `Low medication adherence: ${adherenceRate}% in past 30 days`,
        citation: "Adherence Log Summary",
      });
    }

    // Check Allergies
    const allergiesList = rawSnapshot?.allergies || [];
    if (allergiesList.length > 0) {
      const severeAllergies = allergiesList.filter((a: any) => a.severity === "severe");
      if (severeAllergies.length > 0) {
        redFlags.push({
          severity: "critical",
          message: `Known severe drug/substance allergy: ${severeAllergies.map((a: any) => a.substance).join(", ")}`,
          citation: "Patient Profile: Allergies",
        });
      }
    }

    // Compile Source Citations list
    const citations: Array<{
      id: string;
      title: string;
      category: string;
      date: string;
      snippet: string;
    }> = [];

    documents.forEach((d: any) => {
      citations.push({
        id: d.id,
        title: d.file_name || "Medical Report",
        category: d.category || "Document",
        date: d.document_date || "Recent",
        snippet: d.summary || `Clinical document from ${d.facility_name || "diagnostic center"}`,
      });
    });

    metrics.slice(0, 5).forEach((m: any) => {
      citations.push({
        id: m.id,
        title: `${m.metric_type.replace(/_/g, " ").toUpperCase()}: ${m.value_primary} ${m.unit || ""}`,
        category: "Vital Metric",
        date: new Date(m.recorded_at).toLocaleDateString(),
        snippet: m.notes || `Measured value ${m.value_primary} ${m.unit || ""}`,
      });
    });

    // 5. Generate AI Brief with Gemini (or deterministic clinical synthesizer)
    let aiSummary = "";
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are the Clinical Pre-Visit Brief synthesizer for ChronicAI.
You are generating a 30-second executive clinical brief for Dr. ${doctor.full_name} (${doctor.specialty}).
CRITICAL MANDATES:
1. SUMMARIZE ONLY. You must NEVER formulate a new diagnosis and NEVER suggest changing drugs, doses, or treatment. All decisions belong solely to the attending doctor.
2. CITATION DISCIPLINE: Every bullet point MUST cite its evidence from the provided records using brackets e.g. [Doc: CBC Report] or [Metric: Blood Pressure].
3. STRUCTURE:
   - Patient Snapshot: Age, sex, active chronic conditions, known drug allergies.
   - Recent Health Trajectory: Key changes in vitals, BP/glucose trends, last visits.
   - Current Regimen & Compliance: Active drugs and 30-day adherence rate.
   - Clinical Highlights: Key questions or parameters to review with the patient today.
Be concise, bulleted, and strictly professional.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${systemPrompt}\n\nPATIENT RECORDS:\n${JSON.stringify(
                        {
                          snapshot: rawSnapshot,
                          activeMedications: medications,
                          adherenceRate: `${adherenceRate}% (${takenDoses}/${totalDoses} doses logged)`,
                          recentMetrics: metrics.slice(0, 10),
                          documents: documents,
                          pastConsultations: consults,
                        },
                        null,
                        2
                      )}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiSummary =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      } catch (gemErr) {
        console.warn("Gemini Brief synthesis failed, using deterministic fallback:", gemErr);
      }
    }

    // Deterministic clinical synthesis fallback if Gemini unavailable
    if (!aiSummary) {
      const conds = (rawSnapshot?.chronic_conditions || [])
        .map((c: any) => (typeof c === "string" ? c : c.name))
        .join(", ") || "No recorded chronic conditions";

      const activeMedsSummary = medications.length > 0
        ? medications.map((m: any) => `${m.name} (${m.dosage}, ${m.frequency})`).join("; ")
        : "No active medications logged";

      aiSummary = `### Patient Snapshot
- **Demographics:** ${rawSnapshot?.full_name || "Patient"}, ${rawSnapshot?.date_of_birth ? new Date().getFullYear() - new Date(rawSnapshot.date_of_birth).getFullYear() + " yrs" : "Adult"} (${rawSnapshot?.sex || "Unspecified"}). Blood group: ${rawSnapshot?.blood_group || "Unknown"}.
- **Chronic Conditions:** ${conds}.
- **Known Allergies:** ${allergiesList.length > 0 ? allergiesList.map((a: any) => `${a.substance} (${a.severity})`).join(", ") : "NKDA (No known drug allergies)"}.

### Current Regimen & Compliance
- **Active Regimen:** ${activeMedsSummary} [Medications List].
- **30-Day Adherence:** ${adherenceRate}% of scheduled doses logged as taken (${takenDoses}/${totalDoses} recorded) [Adherence Tracker].

### Recent Vitals & Trajectory
- **Blood Pressure:** ${latestBpSys ? `${latestBpSys.value_primary}/${latestBpDia?.value_primary || "--"} mmHg` : "No recent BP logged"} [Vitals].
- **Fasting Glucose:** ${latestGlucose ? `${latestGlucose.value_primary} mg/dL` : "No recent glucose logged"} [Vitals].
- **Document History:** ${documents.length} verified clinical records available [Vault].`;
    }

    const briefPayload = {
      patientSnapshot: {
        fullName: rawSnapshot?.full_name || "Patient",
        dateOfBirth: rawSnapshot?.date_of_birth || null,
        sex: rawSnapshot?.sex || null,
        bloodGroup: rawSnapshot?.blood_group || null,
        heightCm: rawSnapshot?.height_cm || null,
        weightKg: rawSnapshot?.weight_kg || null,
        chronicConditions: rawSnapshot?.chronic_conditions || [],
        allergies: rawSnapshot?.allergies || [],
      },
      adherence: {
        rate: adherenceRate,
        takenDoses,
        totalDoses,
      },
      metricsSnapshot: metrics.slice(0, 15).map((m: any) => ({
        id: m.id,
        type: m.metric_type,
        value: m.value_primary,
        unit: m.unit,
        isAbnormal: m.is_abnormal,
        recordedAt: m.recorded_at,
      })),
      activeMedications: medications.map((m: any) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions,
      })),
      recentDocuments: documents,
      summaryMarkdown: aiSummary,
      redFlags,
      citations,
    };

    // 6. Cache into patient_summaries (Upsert)
    const { data: upserted } = await supabase
      .from("patient_summaries")
      .upsert(
        {
          patient_id: patientId,
          doctor_id: doctor.id,
          summary_json: briefPayload as any,
          citations_json: citations as any,
          red_flags: redFlags as any,
          is_stale: false,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "patient_id,doctor_id" }
      )
      .select("id, generated_at")
      .single();

    // 7. Audit PHI access
    await supabase.rpc("doctor_log_phi_access", {
      p_patient_id: patientId,
      p_resource_type: "patient_summary",
      p_resource_id: upserted?.id || null,
      p_action: "generate_pre_visit_brief",
    });

    return NextResponse.json({
      success: true,
      cached: false,
      generatedAt: upserted?.generated_at || new Date().toISOString(),
      data: briefPayload,
      citations,
      redFlags,
    });
  } catch (err: any) {
    console.error("Error in /api/doctor/brief:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
