-- ==============================================================================
-- ChronicAI Production Database Architecture & pgvector RAG Pipeline
-- Migration: 20261120020000_production_architecture_and_pgvector.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==============================================================================
-- 2. ENHANCE CORE CLINICAL TABLES & CONSTRAINTS
-- ==============================================================================

-- Health Profiles enhancements
ALTER TABLE public.health_profiles 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_profiles_height_positive'
    ) THEN
        ALTER TABLE public.health_profiles
            ADD CONSTRAINT chk_health_profiles_height_positive 
            CHECK (height_cm IS NULL OR height_cm > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_profiles_weight_positive'
    ) THEN
        ALTER TABLE public.health_profiles
            ADD CONSTRAINT chk_health_profiles_weight_positive 
            CHECK (weight_kg IS NULL OR weight_kg > 0);
    END IF;
END $$;

-- Medical Documents enhancements
ALTER TABLE public.medical_documents
    ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT 'medical-records',
    ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'pending' 
        CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
    ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Extracted Records enhancements
ALTER TABLE public.extracted_records
    ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
    ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT 'gemini-2.5-flash';

-- Health Metrics: Expand metric_type check constraint safely to accommodate full diagnostic panels
ALTER TABLE public.health_metrics DROP CONSTRAINT IF EXISTS health_metrics_metric_type_check;
ALTER TABLE public.health_metrics
    ADD CONSTRAINT health_metrics_metric_type_check 
    CHECK (metric_type IN (
        'blood_pressure', 
        'heart_rate', 
        'glucose', 
        'hba1c', 
        'weight', 
        'temperature', 
        'spo2', 
        'lipid_panel', 
        'renal_panel', 
        'hepatic_panel', 
        'electrolyte', 
        'cbc', 
        'other'
    ));

-- ==============================================================================
-- 3. AUDIT LOGGING (HIPAA & Clinical Compliance)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g. 'read', 'create', 'update', 'delete', 'export_phi', 'scan_document'
    resource_type TEXT NOT NULL, -- e.g. 'medical_document', 'health_metric', 'medication', 'health_profile'
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 4. VECTOR DATABASE ARCHITECTURE (pgvector for RAG & Semantic Retrieval)
-- ==============================================================================

-- A. Patient-Specific Document Chunks & Embeddings (Patient RAG Pipeline)
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(768) NOT NULL, -- 768-dim matching Google Gemini text-embedding-004
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. {"page": 1, "section": "Renal Function", "facility": "City Health"}
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_doc_chunk UNIQUE(document_id, chunk_index)
);

-- B. Curated Medical Knowledge Base Embeddings (Global Clinical Guidelines)
CREATE TABLE IF NOT EXISTS public.medical_knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_title TEXT NOT NULL, -- e.g. 'ADA 2026 Standards of Care in Diabetes'
    source_url TEXT,
    topic TEXT NOT NULL, -- e.g. 'type_2_diabetes', 'hypertension', 'ckd', 'drug_interaction'
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(768) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. {"organization": "ADA", "year": 2026, "evidence_grade": "A"}
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_knowledge_chunk UNIQUE(source_title, chunk_index)
);

-- ==============================================================================
-- 5. PERFORMANCE INDEXES (Foreign Keys, JSONB, & HNSW Vector Ops)
-- ==============================================================================

-- Foreign key indexes (Supabase Best Practice: schema-foreign-key-indexes)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doc_embeddings_user ON public.document_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_doc ON public.document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_medical_knowledge_topic ON public.medical_knowledge_embeddings(topic);

-- GIN Indexes for fast JSONB querying (Supabase Best Practice: advanced-jsonb-indexing)
CREATE INDEX IF NOT EXISTS idx_health_profiles_allergies_gin ON public.health_profiles USING gin (allergies);
CREATE INDEX IF NOT EXISTS idx_health_profiles_conditions_gin ON public.health_profiles USING gin (chronic_conditions);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_metadata_gin ON public.document_embeddings USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_medical_knowledge_metadata_gin ON public.medical_knowledge_embeddings USING gin (metadata);

-- HNSW Vector Indexes for Fast Cosine Similarity Retrieval
-- HNSW provides sub-millisecond approximate nearest neighbor search with high recall
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw 
ON public.document_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_medical_knowledge_hnsw 
ON public.medical_knowledge_embeddings USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- 6. VECTOR SEARCH RPC FUNCTIONS (Semantic Search & RAG)
-- ==============================================================================

-- Match patient's private document chunks with patient isolation & optional document filter
CREATE OR REPLACE FUNCTION public.match_patient_documents(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.65,
    match_count int DEFAULT 5,
    filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_index int,
    chunk_content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        de.chunk_index,
        de.chunk_content,
        de.metadata,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM public.document_embeddings de
    WHERE 
        de.user_id = (SELECT auth.uid())
        AND (filter_document_id IS NULL OR de.document_id = filter_document_id)
        AND (1 - (de.embedding <=> query_embedding)) >= match_threshold
    ORDER BY de.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- Match curated global medical knowledge chunks
CREATE OR REPLACE FUNCTION public.match_medical_knowledge(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.60,
    match_count int DEFAULT 5,
    filter_topic text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    source_title text,
    topic text,
    chunk_index int,
    chunk_content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mke.id,
        mke.source_title,
        mke.topic,
        mke.chunk_index,
        mke.chunk_content,
        mke.metadata,
        1 - (mke.embedding <=> query_embedding) AS similarity
    FROM public.medical_knowledge_embeddings mke
    WHERE 
        (filter_topic IS NULL OR mke.topic = filter_topic)
        AND (1 - (mke.embedding <=> query_embedding)) >= match_threshold
    ORDER BY mke.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- Secure Audit Event Logger Helper
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action text,
    p_resource_type text,
    p_resource_id uuid DEFAULT NULL,
    p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_log_id uuid;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
    ) VALUES (
        (SELECT auth.uid()),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        NOW()
    )
    RETURNING id INTO new_log_id;

    RETURN new_log_id;
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce strict single-tenant ownership and least-privilege model
-- ==============================================================================

-- A. Document Embeddings (Patient Isolation)
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own document embeddings" ON public.document_embeddings;
CREATE POLICY "Users can view own document embeddings" ON public.document_embeddings
    FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own document embeddings" ON public.document_embeddings;
CREATE POLICY "Users can insert own document embeddings" ON public.document_embeddings
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own document embeddings" ON public.document_embeddings;
CREATE POLICY "Users can update own document embeddings" ON public.document_embeddings
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = user_id) 
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own document embeddings" ON public.document_embeddings;
CREATE POLICY "Users can delete own document embeddings" ON public.document_embeddings
    FOR DELETE TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

-- B. Medical Knowledge Base (Read-only for patients, write restricted to service role)
ALTER TABLE public.medical_knowledge_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can query medical knowledge" ON public.medical_knowledge_embeddings;
CREATE POLICY "Authenticated users can query medical knowledge" ON public.medical_knowledge_embeddings
    FOR SELECT TO authenticated 
    USING (true);

-- C. Audit Logs (Patients can read own audit logs; inserts allowed for self)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- ==============================================================================
-- 8. STORAGE BUCKET VERIFICATION & HARDENING
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'medical-records', 
        'medical-records', 
        false, 
        52428800, -- 50MB
        ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/dicom', 'text/csv']
    ),
    (
        'avatars', 
        'avatars', 
        true, 
        5242880, -- 5MB
        ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    )
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure storage policies exist
DROP POLICY IF EXISTS "Users can upload own medical records" ON storage.objects;
CREATE POLICY "Users can upload own medical records"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can view own medical records" ON storage.objects;
CREATE POLICY "Users can view own medical records"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can update own medical records" ON storage.objects;
CREATE POLICY "Users can update own medical records"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete own medical records" ON storage.objects;
CREATE POLICY "Users can delete own medical records"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- ==============================================================================
-- 9. SUPABASE REALTIME CONFIGURATION
-- ==============================================================================
ALTER TABLE public.document_embeddings REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.document_embeddings;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
END $$;
