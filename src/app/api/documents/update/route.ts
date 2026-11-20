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
      documentId,
      userId,
      file_name,
      category,
      document_date,
      facility_name,
      doctor_name,
      summary,
      tags,
      status,
    } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, error: "Missing documentId" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const updatePayload: Record<string, any> = {};
    if (file_name !== undefined) updatePayload.file_name = file_name.trim();
    if (category !== undefined) updatePayload.category = category;
    if (document_date !== undefined) updatePayload.document_date = document_date;
    if (facility_name !== undefined) updatePayload.facility_name = facility_name?.trim() || null;
    if (doctor_name !== undefined) updatePayload.doctor_name = doctor_name?.trim() || null;
    if (summary !== undefined) updatePayload.summary = summary?.trim() || null;
    if (tags !== undefined) updatePayload.tags = tags;
    if (status !== undefined) updatePayload.status = status;

    let query = supabase.from("medical_documents").update(updatePayload).eq("id", documentId);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.error("Document update DB error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: data });
  } catch (err: any) {
    console.error("Document update error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update document" },
      { status: 500 }
    );
  }
}
