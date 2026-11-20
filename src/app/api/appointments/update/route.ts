import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzxzdwwnivvcfvmzhbia.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      appointmentId,
      id,
      userId,
      doctor_name,
      specialty,
      clinic_or_hospital,
      appointment_date,
      appointment_time,
      reason,
      location,
      status,
      consultation_notes,
      preparation_questions,
    } = body;

    const targetId = appointmentId || id;
    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Missing appointmentId or id" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const updatePayload: Record<string, any> = {};
    if (doctor_name !== undefined) updatePayload.doctor_name = doctor_name.trim();
    if (specialty !== undefined) updatePayload.specialty = specialty.trim();
    if (clinic_or_hospital !== undefined) updatePayload.clinic_or_hospital = clinic_or_hospital.trim();
    if (appointment_date !== undefined) updatePayload.appointment_date = appointment_date;
    if (appointment_time !== undefined) updatePayload.appointment_time = appointment_time;
    if (reason !== undefined) updatePayload.reason = reason.trim();
    if (location !== undefined) updatePayload.location = location ? location.trim() : null;
    if (status !== undefined) updatePayload.status = status;
    if (consultation_notes !== undefined) updatePayload.consultation_notes = consultation_notes;
    if (preparation_questions !== undefined) updatePayload.preparation_questions = preparation_questions;

    let query = supabase.from("appointments").update(updatePayload).eq("id", targetId);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
