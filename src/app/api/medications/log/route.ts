import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";
import { medicationLogSchema } from "@/lib/validations/medical";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = medicationLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid adherence log", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { medication_id, scheduled_time, status, recorded_time, notes } = parsed.data;

    const log = await clinicalStore.logMedication({
      medication_id,
      scheduled_time,
      status,
      recorded_time: recorded_time || new Date().toISOString(),
      notes,
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to record medication adherence", message: error?.message },
      { status: 500 }
    );
  }
}
