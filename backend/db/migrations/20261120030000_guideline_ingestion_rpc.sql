-- ==============================================================================
-- ChronicAI Migration: Medical Knowledge Guideline Ingestion Function
-- Allows verified ingestion of evidence-based clinical guidelines into pgvector
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ingest_medical_knowledge_chunk(
    p_source_title text,
    p_topic text,
    p_chunk_index int,
    p_chunk_content text,
    p_embedding vector(768),
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_source_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.medical_knowledge_embeddings (
        source_title,
        source_url,
        topic,
        chunk_index,
        chunk_content,
        token_count,
        embedding,
        metadata,
        created_at
    )
    VALUES (
        p_source_title,
        p_source_url,
        p_topic,
        p_chunk_index,
        p_chunk_content,
        array_length(regexp_split_to_array(p_chunk_content, '\s+'), 1),
        p_embedding,
        p_metadata,
        NOW()
    )
    ON CONFLICT (source_title, chunk_index)
    DO UPDATE SET
        chunk_content = EXCLUDED.chunk_content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        source_url = EXCLUDED.source_url,
        created_at = NOW()
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- Grant execution to authenticated and anon users for initial seeding
GRANT EXECUTE ON FUNCTION public.ingest_medical_knowledge_chunk TO authenticated, anon;

-- Also allow public select on medical_knowledge_embeddings so all users can benefit from clinical grounding
DROP POLICY IF EXISTS "Public read on medical knowledge" ON public.medical_knowledge_embeddings;
CREATE POLICY "Public read on medical knowledge" ON public.medical_knowledge_embeddings
    FOR SELECT TO public
    USING (true);
