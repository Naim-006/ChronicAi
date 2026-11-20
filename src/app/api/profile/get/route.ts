import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzxzdwwnivvcfvmzhbia.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "MISSING_USER_ID", message: "Missing userId parameter." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("health_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    const rawPrefs = data.preferences || {};
    const formattedProfile = {
      id: data.id,
      user_id: data.user_id,
      full_name: data.full_name || "Patient",
      avatar_url: data.avatar_url || rawPrefs.avatar_url || undefined,
      date_of_birth: data.date_of_birth || undefined,
      sex: data.sex || undefined,
      blood_group: data.blood_group || undefined,
      height_cm: data.height_cm ? Number(data.height_cm) : undefined,
      weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
      emergency_contact: data.emergency_contact || undefined,
      allergies: data.allergies || [],
      chronic_conditions: data.chronic_conditions || [],
      preferences: rawPrefs,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      profile: formattedProfile,
    });
  } catch (err: any) {
    console.error("Profile GET error:", err);
    return NextResponse.json(
      { success: false, error: "FAILED", message: err.message },
      { status: 500 }
    );
  }
}
