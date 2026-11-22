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

const RegisterSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  fullName: z.string().min(2, "Full name is required").max(100),
  bmdcNumber: z
    .string()
    .min(3, "BMDC registration number is required")
    .max(50)
    .regex(/^[A-Za-z0-9\-\/]+$/, "Invalid BMDC registration format"),
  specialty: z.string().min(2, "Specialty is required").max(100),
  qualifications: z.string().max(255).optional(),
  chamberInfo: z
    .object({
      clinic_name: z.string().optional(),
      room: z.string().optional(),
      visiting_hours: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = RegisterSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          issues: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { userId, fullName, bmdcNumber, specialty, qualifications, chamberInfo } =
      parseResult.data;
    const supabase = getAdminClient();

    // Check if already registered
    const { data: existing } = await supabase
      .from("doctor_profiles")
      .select("id, verification_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Doctor profile already registered",
        profile: existing,
      });
    }

    // Insert new doctor profile. Note: trigger guard_doctor_profile ensures verification_status starts as 'pending'.
    const { data: newProfile, error: insertError } = await supabase
      .from("doctor_profiles")
      .insert({
        user_id: userId,
        full_name: fullName,
        bmdc_number: bmdcNumber.toUpperCase().trim(),
        specialty,
        qualifications: qualifications || null,
        chamber_info: chamberInfo || {},
        verification_status: "pending",
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: newProfile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
