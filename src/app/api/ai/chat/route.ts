import { NextRequest, NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validations/medical";
import { aiEngine } from "@/lib/ai/engine";
import { clinicalStore } from "@/lib/clinical-store";
import { ClinicalContext } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, history = [], include_clinical_context } = parsed.data;

    let clinicalContext: ClinicalContext | undefined = undefined;

    if (include_clinical_context) {
      const [profile, medications, metrics, documents] = await Promise.all([
        clinicalStore.getProfile(),
        clinicalStore.getMedications("active"),
        clinicalStore.getMetrics("all"),
        clinicalStore.getDocuments(),
      ]);

      clinicalContext = {
        patient_name: profile.full_name,
        blood_group: profile.blood_group,
        allergies: profile.allergies.map((a) => `${a.substance} (${a.reaction})`),
        chronic_conditions: profile.chronic_conditions.map((c) => c.name),
        active_medications: medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
        })),
        recent_vitals: metrics.slice(0, 5).map((m) => ({
          type: m.metric_type,
          value: m.value_secondary
            ? `${m.value_primary}/${m.value_secondary} ${m.unit}`
            : `${m.value_primary} ${m.unit}`,
          date: m.recorded_at,
          is_abnormal: m.is_abnormal,
        })),
        recent_documents: documents.slice(0, 5).map((d) => ({
          id: d.id,
          title: d.file_name,
          date: d.document_date || d.created_at,
          category: d.category,
        })),
      };
    }

    const messages = [
      ...history,
      { role: "user" as const, content: message },
    ];

    const result = await aiEngine.ask(messages, clinicalContext);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[API/AI/Chat] Unhandled error:", error);
    return NextResponse.json(
      { error: "Clinical Assistant failed to process request", message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
