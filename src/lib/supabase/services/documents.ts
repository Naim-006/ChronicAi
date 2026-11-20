import { createClient, isSupabaseConfigured } from "../client";
import { MedicalDocument, ExtractedRecord } from "@/types/medical";

export async function getDocuments(userId: string): Promise<MedicalDocument[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("medical_documents")
    .select("*")
    .eq("user_id", userId)
    .order("document_date", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    user_id: d.user_id,
    file_name: d.file_name,
    file_path: d.file_path,
    file_type: d.file_type,
    file_size: Number(d.file_size),
    category: d.category,
    document_date: d.document_date || undefined,
    facility_name: d.facility_name || undefined,
    doctor_name: d.doctor_name || undefined,
    status: d.status,
    summary: d.summary || undefined,
    tags: d.tags || undefined,
    created_at: d.created_at,
  }));
}

export async function createDocumentRecord(
  doc: Omit<MedicalDocument, "id" | "created_at">
): Promise<MedicalDocument> {
  const newId = `doc-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...doc, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("medical_documents")
    .insert({
      user_id: doc.user_id,
      file_name: doc.file_name,
      file_path: doc.file_path,
      file_type: doc.file_type,
      file_size: doc.file_size,
      category: doc.category,
      document_date: doc.document_date,
      facility_name: doc.facility_name,
      doctor_name: doc.doctor_name,
      status: doc.status,
      summary: doc.summary,
      tags: doc.tags,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...doc, id: newId, created_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    file_name: data.file_name,
    file_path: data.file_path,
    file_type: data.file_type,
    file_size: Number(data.file_size),
    category: data.category,
    document_date: data.document_date || undefined,
    facility_name: data.facility_name || undefined,
    doctor_name: data.doctor_name || undefined,
    status: data.status,
    summary: data.summary || undefined,
    tags: data.tags || undefined,
    created_at: data.created_at,
  };
}

export async function createExtractedRecord(
  rec: Omit<ExtractedRecord, "id" | "created_at">
): Promise<ExtractedRecord> {
  const newId = `ext-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...rec, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("extracted_records")
    .insert({
      document_id: rec.document_id,
      user_id: rec.user_id,
      raw_extracted: rec.raw_extracted as any,
      confirmed_data: (rec.confirmed_data as any) || null,
      confidence_score: rec.confidence_score,
      status: rec.status,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...rec, id: newId, created_at: now };
  }

  return {
    id: data.id,
    document_id: data.document_id,
    user_id: data.user_id,
    raw_extracted: data.raw_extracted as any,
    confirmed_data: (data.confirmed_data as any) || undefined,
    confidence_score: Number(data.confidence_score),
    status: data.status,
    reviewed_at: data.reviewed_at || undefined,
    created_at: data.created_at,
  };
}

export async function updateDocumentRecord(
  documentId: string,
  updates: Partial<MedicalDocument>,
  userId?: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/documents/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        userId,
        ...updates,
      }),
    });
    const result = await res.json();
    return Boolean(result.success);
  } catch (err) {
    console.warn("API update document failed, trying direct Supabase:", err);
    if (!isSupabaseConfigured()) return false;
    const supabase = createClient();
    const { error } = await supabase
      .from("medical_documents")
      .update(updates)
      .eq("id", documentId);
    return !error;
  }
}

export async function deleteDocumentRecord(
  documentId: string,
  userId?: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/documents/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        userId,
      }),
    });
    const result = await res.json();
    return Boolean(result.success);
  } catch (err) {
    console.warn("API delete document failed, trying direct Supabase:", err);
    if (!isSupabaseConfigured()) return false;
    const supabase = createClient();
    await supabase.from("extracted_records").delete().eq("document_id", documentId);
    await supabase.from("document_embeddings").delete().eq("document_id", documentId);
    await supabase.from("health_metrics").delete().eq("document_id", documentId);
    const { error } = await supabase
      .from("medical_documents")
      .delete()
      .eq("id", documentId);
    return !error;
  }
}
