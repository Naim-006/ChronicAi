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
    const { id, userId, updates } = body;

    if (!id || !userId || !updates) {
      return NextResponse.json(
        { success: false, message: "Missing id, userId, or updates payload" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const allowedFields = [
      "name",
      "generic_name",
      "strength",
      "dosage",
      "frequency",
      "route",
      "instructions",
      "start_date",
      "end_date",
      "prescribing_doctor",
      "related_condition",
      "status",
    ];

    const sanitizedUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from("medications")
      .update(sanitizedUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update medication via admin route:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      medication: data,
    });
  } catch (err: any) {
    console.error("Medication update route error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
