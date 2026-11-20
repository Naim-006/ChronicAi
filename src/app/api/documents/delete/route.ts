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
    const { documentId, id, userId } = body;
    const targetId = documentId || id;

    if (!targetId) {
      return NextResponse.json({ success: false, error: "Missing documentId or id" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch document record to get file_path if stored in bucket
    const { data: docData } = await supabase
      .from("medical_documents")
      .select("id, file_path, user_id")
      .eq("id", targetId)
      .maybeSingle();

    if (userId && docData && docData.user_id && docData.user_id !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // 2. Cascade delete associated child records
    await Promise.allSettled([
      // Clean up extracted records
      supabase.from("extracted_records").delete().eq("document_id", targetId),
      // Clean up document embeddings
      supabase.from("document_embeddings").delete().eq("document_id", targetId),
      // Clean up health metrics generated from this document
      supabase.from("health_metrics").delete().eq("document_id", targetId),
      // Clean up timeline events if referenced
      supabase.from("timeline_events").delete().eq("document_id", targetId),
      // Remove file from storage bucket if file_path exists
      docData?.file_path
        ? supabase.storage.from("medical-records").remove([docData.file_path])
        : Promise.resolve(),
    ]);

    // 3. Delete the medical_documents record
    const { error: delError } = await supabase
      .from("medical_documents")
      .delete()
      .eq("id", targetId);

    if (delError) {
      console.error("Error deleting document record:", delError);
      return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (err: any) {
    console.error("Document delete error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
