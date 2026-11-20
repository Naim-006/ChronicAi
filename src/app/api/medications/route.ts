import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const medications = await clinicalStore.getMedications(status);

    return NextResponse.json({
      medications,
      total_active: medications.filter((m) => m.status === "active").length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve medications", message: error?.message },
      { status: 500 }
    );
  }
}
