import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";
import { documentConfirmSchema } from "@/lib/validations/medical";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = documentConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid confirmation data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { document_id, confirmed_labs = [], confirmed_medications = [] } = parsed.data;

    // Commit confirmed lab results into health metrics
    for (const lab of confirmed_labs) {
      await clinicalStore.addMetric({
        metric_type: lab.test_name.toLowerCase().includes("glucose")
          ? "glucose"
          : lab.test_name.toLowerCase().includes("a1c")
          ? "hba1c"
          : "other",
        value_primary: lab.value,
        unit: lab.unit,
        is_abnormal: lab.is_abnormal,
        recorded_at: new Date().toISOString(),
        document_id,
        notes: `Extracted and confirmed from Document ${document_id}.`,
      });
    }

    // Add confirmed timeline milestone
    await clinicalStore.addTimelineEvent({
      document_id,
      event_type: "lab_test",
      title: `Verified Clinical Labs: Document ${document_id}`,
      description: `Confirmed ${confirmed_labs.length} diagnostic values and ${confirmed_medications.length} prescriptions.`,
      event_date: new Date().toISOString().split("T")[0],
      is_verified: true,
    });

    return NextResponse.json({
      status: "confirmed",
      committed_labs: confirmed_labs.length,
      committed_medications: confirmed_medications.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to confirm extracted document", message: error?.message },
      { status: 500 }
    );
  }
}
