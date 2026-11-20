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
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", message: "Missing userId or updates." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Build sanitised payload
    const payload: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
    if (updates.date_of_birth !== undefined) payload.date_of_birth = updates.date_of_birth || null;
    if (updates.sex !== undefined) payload.sex = updates.sex || null;
    if (updates.blood_group !== undefined) payload.blood_group = updates.blood_group || null;
    if (updates.height_cm !== undefined) payload.height_cm = updates.height_cm === null || updates.height_cm === "" ? null : Number(updates.height_cm);
    if (updates.weight_kg !== undefined) payload.weight_kg = updates.weight_kg === null || updates.weight_kg === "" ? null : Number(updates.weight_kg);
    if (updates.emergency_contact !== undefined) payload.emergency_contact = updates.emergency_contact || {};
    if (updates.allergies !== undefined) payload.allergies = updates.allergies || [];
    if (updates.chronic_conditions !== undefined) payload.chronic_conditions = updates.chronic_conditions || [];
    if (updates.preferences !== undefined) payload.preferences = updates.preferences;

    // Check if row already exists
    const checkRes = await supabase
      .from("health_profiles")
      .select("id, preferences, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    let updatedRow: any = null;

    if (checkRes.data) {
      // Update existing record
      const updateRes = await supabase
        .from("health_profiles")
        .update(payload)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateRes.error) {
        throw updateRes.error;
      }
      updatedRow = updateRes.data;
    } else {
      // Insert new record
      const insertRes = await supabase
        .from("health_profiles")
        .insert({
          ...payload,
          full_name: payload.full_name || "Patient",
        })
        .select()
        .single();

      if (insertRes.error) {
        throw insertRes.error;
      }
      updatedRow = insertRes.data;
    }

    // Format clean profile response
    const rawPrefs = updatedRow.preferences || {};
    const formattedProfile = {
      id: updatedRow.id,
      user_id: updatedRow.user_id,
      full_name: updatedRow.full_name,
      avatar_url: updatedRow.avatar_url || rawPrefs.avatar_url || undefined,
      date_of_birth: updatedRow.date_of_birth || undefined,
      sex: updatedRow.sex || undefined,
      blood_group: updatedRow.blood_group || undefined,
      height_cm: updatedRow.height_cm ? Number(updatedRow.height_cm) : undefined,
      weight_kg: updatedRow.weight_kg ? Number(updatedRow.weight_kg) : undefined,
      emergency_contact: updatedRow.emergency_contact || undefined,
      allergies: updatedRow.allergies || [],
      chronic_conditions: updatedRow.chronic_conditions || [],
      preferences: rawPrefs,
      created_at: updatedRow.created_at,
      updated_at: updatedRow.updated_at,
    };

    return NextResponse.json({
      success: true,
      profile: formattedProfile,
    });
  } catch (err: any) {
    console.error("Profile update API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "PROFILE_UPDATE_FAILED",
        message: err.message || "Failed to update health profile.",
      },
      { status: 500 }
    );
  }
}
