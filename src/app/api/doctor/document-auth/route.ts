import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getPrivilegedClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const QuerySchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = QuerySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_PARAMETERS", issues: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { documentId } = parseResult.data;

    // Caller token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const supabase = getPrivilegedClient();
    let callerUserId: string | null = null;
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      callerUserId = userData?.user?.id || null;
    }
    if (!callerUserId) {
      callerUserId = req.headers.get("x-user-id") || null;
    }
    if (!callerUserId) {
      return NextResponse.json({ success: false, error: "NOT_AUTHENTICATED" }, { status: 401 });
    }

    // Call RPC doctor_authorize_document_download
    const { data, error } = await supabase.rpc("doctor_authorize_document_download", {
      p_document_id: documentId,
    });

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED_OR_NOT_FOUND",
          message: error?.message || "No active grant with documents scope for this file.",
        },
        { status: 403 }
      );
    }

    const { storage_bucket, file_path, patient_id } = data[0];

    // Generate short-lived signed URL (60 seconds)
    const { data: signedData, error: signErr } = await supabase.storage
      .from(storage_bucket || "medical-records")
      .createSignedUrl(file_path, 60);

    if (signErr || !signedData?.signedUrl) {
      return NextResponse.json(
        { success: false, error: "STORAGE_SIGNING_FAILED", message: signErr?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: signedData.signedUrl,
      bucket: storage_bucket,
      filePath: file_path,
      patientId: patient_id,
      expiresInSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
