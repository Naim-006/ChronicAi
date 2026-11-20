import { NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";

export async function GET() {
  try {
    const events = await clinicalStore.getTimelineEvents();
    return NextResponse.json({
      events,
      total: events.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve timeline events", message: error?.message },
      { status: 500 }
    );
  }
}
