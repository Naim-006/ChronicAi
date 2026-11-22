import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const QuerySchema = z.object({
  userId: z.string().uuid("Invalid userId"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = QuerySchema.safeParse({
      userId: searchParams.get("userId"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_USER_ID", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = parseResult.data;
    const supabase = getAdminClient();

    // Fetch doctor profile
    const { data: profile, error: profileError } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    // Fetch clinic staff
    const { data: staff, error: staffError } = await supabase
      .from("clinic_staff")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (staffError) {
      return NextResponse.json({ success: false, error: staffError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: profile || null,
      clinics: staff || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
