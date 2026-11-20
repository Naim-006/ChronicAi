import { createClient, isSupabaseConfigured } from "../client";

export interface MatchedDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface MatchedKnowledgeChunk {
  id: string;
  source_title: string;
  topic: string;
  chunk_index: number;
  chunk_content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Searches the patient's private document chunks using vector cosine similarity.
 */
export async function matchPatientDocuments(
  queryEmbedding: number[],
  matchThreshold = 0.65,
  matchCount = 5,
  filterDocumentId?: string
): Promise<MatchedDocumentChunk[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("match_patient_documents", {
    query_embedding: JSON.stringify(queryEmbedding) as any,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_document_id: filterDocumentId,
  });

  if (error || !data) {
    console.warn("match_patient_documents RPC error:", error?.message);
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    document_id: d.document_id,
    chunk_index: d.chunk_index,
    chunk_content: d.chunk_content,
    metadata: d.metadata || {},
    similarity: Number(d.similarity),
  }));
}

/**
 * Searches the global curated medical knowledge guidelines base using vector cosine similarity.
 */
export async function matchMedicalKnowledge(
  queryEmbedding: number[],
  matchThreshold = 0.6,
  matchCount = 5,
  filterTopic?: string
): Promise<MatchedKnowledgeChunk[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("match_medical_knowledge", {
    query_embedding: JSON.stringify(queryEmbedding) as any,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_topic: filterTopic,
  });

  if (error || !data) {
    console.warn("match_medical_knowledge RPC error:", error?.message);
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    source_title: d.source_title,
    topic: d.topic,
    chunk_index: d.chunk_index,
    chunk_content: d.chunk_content,
    metadata: d.metadata || {},
    similarity: Number(d.similarity),
  }));
}
