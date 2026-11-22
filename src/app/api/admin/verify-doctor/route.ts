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

const VerifySchema = z.object({
  doctorId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(["verified", "pending", "suspended"]).default("verified"),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const configuredSecret = process.env.ADMIN_SECRET_KEY || "dev-admin-secret";

    // Basic admin authentication protection
    if (!authHeader || authHeader !== configuredSecret) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED_ADMIN_ACTION" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = VerifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_PARAMETERS", issues: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { doctorId, userId, status } = parseResult.data;
    if (!doctorId && !userId) {
      return NextResponse.json(
        { success: false, error: "Must provide either doctorId or userId" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let query = supabase.from("doctor_profiles").update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (doctorId) {
      query = query.eq("id", doctorId);
    } else if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select().single();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Doctor status updated to ${status}`,
      profile: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
