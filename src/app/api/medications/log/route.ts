import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzxzdwwnivvcfvmzhbia.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, medicationId, scheduledTime, notes } = body;

    if (!userId || !medicationId) {
      return NextResponse.json(
        { success: false, message: "Missing userId or medicationId" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const now = new Date();
    // 24-hour cutoff window for today's logs to handle timezone differences
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    if (action === "untake") {
      // Delete today's taken/adherence logs for this medication
      const { error } = await supabase
        .from("medication_logs")
        .delete()
        .eq("user_id", userId)
        .eq("medication_id", medicationId)
        .or(`created_at.gte.${todayIso},recorded_time.gte.${todayIso},created_at.gte.${cutoff24h}`);

      if (error) {
        console.error("Error untaking medication log:", error);
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "untake",
        message: "Medication untaken successfully",
      });
    }

    // Default action: "take"
    // Delete any existing/conflicting logs for this medication today to guarantee single authoritative state
    await supabase
      .from("medication_logs")
      .delete()
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .or(`created_at.gte.${todayIso},recorded_time.gte.${todayIso},created_at.gte.${cutoff24h}`);

    // Insert fresh authoritative taken log
    const { data: inserted, error: insertError } = await supabase
      .from("medication_logs")
      .insert({
        user_id: userId,
        medication_id: medicationId,
        scheduled_time: scheduledTime || now.toISOString(),
        recorded_time: now.toISOString(),
        status: "taken",
        notes: notes || undefined,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "take",
      log: inserted,
    });
  } catch (err: any) {
    console.error("Medication log API error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
