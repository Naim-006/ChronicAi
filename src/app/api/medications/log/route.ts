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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    if (action === "untake") {
      // Delete today's taken/adherence logs for this medication
      const { error } = await supabase
        .from("medication_logs")
        .delete()
        .eq("user_id", userId)
        .eq("medication_id", medicationId)
        .gte("created_at", todayIso);

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

    // Default action: "take" -> check if there is already a log today
    const { data: existingLogs } = await supabase
      .from("medication_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .gte("created_at", todayIso);

    if (existingLogs && existingLogs.length > 0) {
      const logId = existingLogs[0].id;
      const { data: updated, error: updateError } = await supabase
        .from("medication_logs")
        .update({
          status: "taken",
          recorded_time: new Date().toISOString(),
          notes: notes || undefined,
        })
        .eq("id", logId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, message: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "take",
        log: updated,
      });
    }

    // Insert new taken log
    const { data: inserted, error: insertError } = await supabase
      .from("medication_logs")
      .insert({
        user_id: userId,
        medication_id: medicationId,
        scheduled_time: scheduledTime || new Date().toISOString(),
        recorded_time: new Date().toISOString(),
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
