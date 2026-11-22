-- ============================================================
-- FILE: 20261119000000_init_chronicai_schema.sql
-- ============================================================

-- ==============================================================================
-- ChronicAI - Comprehensive Health Intelligence Database Schema
-- Supabase PostgreSQL Migration with Row Level Security (RLS) & Storage
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HEALTH PROFILES
CREATE TABLE IF NOT EXISTS public.health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    sex TEXT CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{"language": "en", "explanation_depth": "balanced", "notifications_enabled": true}'::jsonb,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. MEDICAL DOCUMENTS
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_size BIGINT NOT NULL DEFAULT 0,
    category TEXT NOT NULL CHECK (category IN ('prescription', 'lab_report', 'imaging', 'discharge_summary', 'doctor_note', 'other')),
    document_date DATE,
    facility_name TEXT,
    doctor_name TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'extracted', 'needs_review', 'verified', 'failed')),
    summary TEXT,
    tags TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. EXTRACTED RECORDS (OCR & Clinical Biomarkers)
CREATE TABLE IF NOT EXISTS public.extracted_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    raw_extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
    confirmed_data JSONB,
    confidence_score NUMERIC(4,3) DEFAULT 0.950,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'modified')),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('visit', 'diagnosis', 'medication_start', 'medication_stop', 'lab_test', 'imaging', 'surgery', 'measurement', 'note')),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    facility_or_doctor TEXT,
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. MEDICATIONS
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    generic_name TEXT,
    strength TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    route TEXT DEFAULT 'Oral',
    instructions TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    prescribing_doctor TEXT,
    related_condition TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'completed', 'discontinued', 'needs_confirmation')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. MEDICATION ADHERENCE LOGS
CREATE TABLE IF NOT EXISTS public.medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'taken' CHECK (status IN ('taken', 'skipped', 'snoozed', 'missed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. HEALTH METRICS & BIOMARKERS
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'heart_rate', 'glucose', 'hba1c', 'weight', 'temperature', 'spo2', 'other')),
    value_primary NUMERIC NOT NULL,
    value_secondary NUMERIC,
    unit TEXT NOT NULL,
    context TEXT CHECK (context IN ('fasting', 'postprandial', 'resting', 'random', 'bedtime', NULL)),
    reference_low NUMERIC,
    reference_high NUMERIC,
    is_abnormal BOOLEAN DEFAULT false,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. DOCTORS & SPECIALISTS
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    clinic_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    clinic_or_hospital TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    reason TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled', 'rescheduled')),
    consultation_notes TEXT,
    preparation_questions TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. AI COPILOT CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Clinical Discussion',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. AI COPILOT MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    is_emergency_flag BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. CLINICAL NOTIFICATIONS & ALERTS
CREATE TABLE IF NOT EXISTS public.clinical_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('critical_alert', 'verification_required', 'medication_reminder', 'appointment_reminder', 'care_insight', 'preventive_care')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
    source_trigger TEXT NOT NULL,
    link_href TEXT,
    link_label TEXT,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES (Supabase Best Practice: query-missing-indexes)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_health_profiles_user ON public.health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_user ON public.medical_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_category ON public.medical_documents(user_id, category);
CREATE INDEX IF NOT EXISTS idx_extracted_records_doc ON public.extracted_records(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_records_user ON public.extracted_records(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_date ON public.timeline_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_user_status ON public.medications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_time ON public.medication_logs(user_id, scheduled_time DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_type ON public.health_metrics(user_id, metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctors_user ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON public.appointments(user_id, appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_clinical_notifications_user ON public.clinical_notifications(user_id, is_read, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Following strict Supabase best practice: TO authenticated with USING ((select auth.uid()) = user_id)
-- ==============================================================================

ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notifications ENABLE ROW LEVEL SECURITY;

-- 1. health_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.health_profiles;
CREATE POLICY "Users can view own profile" ON public.health_profiles
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.health_profiles;
CREATE POLICY "Users can insert own profile" ON public.health_profiles
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.health_profiles;
CREATE POLICY "Users can update own profile" ON public.health_profiles
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own profile" ON public.health_profiles;
CREATE POLICY "Users can delete own profile" ON public.health_profiles
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 2. medical_documents
DROP POLICY IF EXISTS "Users can view own medical documents" ON public.medical_documents;
CREATE POLICY "Users can view own medical documents" ON public.medical_documents
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own medical documents" ON public.medical_documents;
CREATE POLICY "Users can insert own medical documents" ON public.medical_documents
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own medical documents" ON public.medical_documents;
CREATE POLICY "Users can update own medical documents" ON public.medical_documents
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own medical documents" ON public.medical_documents;
CREATE POLICY "Users can delete own medical documents" ON public.medical_documents
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 3. extracted_records
DROP POLICY IF EXISTS "Users can view own extracted records" ON public.extracted_records;
CREATE POLICY "Users can view own extracted records" ON public.extracted_records
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own extracted records" ON public.extracted_records;
CREATE POLICY "Users can insert own extracted records" ON public.extracted_records
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own extracted records" ON public.extracted_records;
CREATE POLICY "Users can update own extracted records" ON public.extracted_records
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own extracted records" ON public.extracted_records;
CREATE POLICY "Users can delete own extracted records" ON public.extracted_records
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 4. timeline_events
DROP POLICY IF EXISTS "Users can view own timeline events" ON public.timeline_events;
CREATE POLICY "Users can view own timeline events" ON public.timeline_events
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own timeline events" ON public.timeline_events;
CREATE POLICY "Users can insert own timeline events" ON public.timeline_events
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own timeline events" ON public.timeline_events;
CREATE POLICY "Users can update own timeline events" ON public.timeline_events
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own timeline events" ON public.timeline_events;
CREATE POLICY "Users can delete own timeline events" ON public.timeline_events
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 5. medications
DROP POLICY IF EXISTS "Users can view own medications" ON public.medications;
CREATE POLICY "Users can view own medications" ON public.medications
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own medications" ON public.medications;
CREATE POLICY "Users can insert own medications" ON public.medications
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own medications" ON public.medications;
CREATE POLICY "Users can update own medications" ON public.medications
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own medications" ON public.medications;
CREATE POLICY "Users can delete own medications" ON public.medications
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 6. medication_logs
DROP POLICY IF EXISTS "Users can view own medication logs" ON public.medication_logs;
CREATE POLICY "Users can view own medication logs" ON public.medication_logs
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own medication logs" ON public.medication_logs;
CREATE POLICY "Users can insert own medication logs" ON public.medication_logs
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own medication logs" ON public.medication_logs;
CREATE POLICY "Users can update own medication logs" ON public.medication_logs
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own medication logs" ON public.medication_logs;
CREATE POLICY "Users can delete own medication logs" ON public.medication_logs
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 7. health_metrics
DROP POLICY IF EXISTS "Users can view own health metrics" ON public.health_metrics;
CREATE POLICY "Users can view own health metrics" ON public.health_metrics
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own health metrics" ON public.health_metrics;
CREATE POLICY "Users can insert own health metrics" ON public.health_metrics
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own health metrics" ON public.health_metrics;
CREATE POLICY "Users can update own health metrics" ON public.health_metrics
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own health metrics" ON public.health_metrics;
CREATE POLICY "Users can delete own health metrics" ON public.health_metrics
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 8. doctors
DROP POLICY IF EXISTS "Users can view own doctors" ON public.doctors;
CREATE POLICY "Users can view own doctors" ON public.doctors
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own doctors" ON public.doctors;
CREATE POLICY "Users can insert own doctors" ON public.doctors
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own doctors" ON public.doctors;
CREATE POLICY "Users can update own doctors" ON public.doctors
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own doctors" ON public.doctors;
CREATE POLICY "Users can delete own doctors" ON public.doctors
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 9. appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" ON public.appointments
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete own appointments" ON public.appointments
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 10. ai_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.ai_conversations;
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.ai_conversations;
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own conversations" ON public.ai_conversations;
CREATE POLICY "Users can update own conversations" ON public.ai_conversations
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete own conversations" ON public.ai_conversations
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 11. ai_messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.ai_messages;
CREATE POLICY "Users can view own messages" ON public.ai_messages
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own messages" ON public.ai_messages;
CREATE POLICY "Users can insert own messages" ON public.ai_messages
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own messages" ON public.ai_messages;
CREATE POLICY "Users can update own messages" ON public.ai_messages
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own messages" ON public.ai_messages;
CREATE POLICY "Users can delete own messages" ON public.ai_messages
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 12. clinical_notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.clinical_notifications;
CREATE POLICY "Users can view own notifications" ON public.clinical_notifications
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.clinical_notifications;
CREATE POLICY "Users can insert own notifications" ON public.clinical_notifications
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.clinical_notifications;
CREATE POLICY "Users can update own notifications" ON public.clinical_notifications
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.clinical_notifications;
CREATE POLICY "Users can delete own notifications" ON public.clinical_notifications
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.health_profiles (
        user_id,
        full_name,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Patient User'),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (medical-records & avatars)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-records', 'medical-records', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/dicom', 'text/csv']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS on storage.objects
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

-- Public avatar read access
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- ==============================================================================
-- REALTIME CONFIGURATION & REPLICA IDENTITY
-- ==============================================================================
ALTER TABLE public.health_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.medications REPLICA IDENTITY FULL;
ALTER TABLE public.medication_logs REPLICA IDENTITY FULL;
ALTER TABLE public.health_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.doctors REPLICA IDENTITY FULL;
ALTER TABLE public.medical_documents REPLICA IDENTITY FULL;
ALTER TABLE public.extracted_records REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_events REPLICA IDENTITY FULL;
ALTER TABLE public.clinical_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.ai_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.ai_messages REPLICA IDENTITY FULL;

DO $$
DECLARE
    tbl text;
    tbl_list text[] := ARRAY[
        'health_profiles',
        'medications',
        'medication_logs',
        'health_metrics',
        'appointments',
        'doctors',
        'medical_documents',
        'extracted_records',
        'timeline_events',
        'clinical_notifications',
        'ai_conversations',
        'ai_messages'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbl_list LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        END IF;
    END LOOP;
END;
$$;



-- ============================================================
-- FILE: 20261120000000_clean_db_and_enable_realtime.sql
-- ============================================================

-- ==============================================================================
-- CHRONICAI DATABASE CLEANUP & REALTIME ACTIVATION MIGRATION
-- Cleans up all default seed/dummy data, drops seed functions, ensures clean
-- user onboarding, and enables Supabase Realtime across all clinical tables.
-- ==============================================================================

-- 1. PURGE ALL SEED / DUMMY CLINICAL DATA
TRUNCATE TABLE 
    public.medication_logs,
    public.medications,
    public.health_metrics,
    public.appointments,
    public.clinical_notifications,
    public.timeline_events,
    public.extracted_records,
    public.medical_documents,
    public.ai_messages,
    public.ai_conversations,
    public.doctors
CASCADE;

-- 2. RESET EXISTING HEALTH PROFILES TO CLEAN BASELINE
UPDATE public.health_profiles
SET 
    date_of_birth = NULL,
    sex = NULL,
    blood_group = NULL,
    height_cm = NULL,
    weight_kg = NULL,
    emergency_contact = '{}'::jsonb,
    allergies = '[]'::jsonb,
    chronic_conditions = '[]'::jsonb,
    preferences = '{"language": "en", "explanation_depth": "balanced", "notifications_enabled": true}'::jsonb,
    updated_at = NOW();

-- 3. DROP DEMO SEED FUNCTION
DROP FUNCTION IF EXISTS public.seed_demo_patient_data(UUID);

-- 4. UPDATE USER SIGNUP TRIGGER (CLEAN PROFILE ONLY - ZERO DEMO DATA)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.health_profiles (
        user_id,
        full_name,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Patient User'),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. SET REPLICA IDENTITY FULL FOR COMPLETE REALTIME PAYLOADS
ALTER TABLE public.health_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.medications REPLICA IDENTITY FULL;
ALTER TABLE public.medication_logs REPLICA IDENTITY FULL;
ALTER TABLE public.health_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.doctors REPLICA IDENTITY FULL;
ALTER TABLE public.medical_documents REPLICA IDENTITY FULL;
ALTER TABLE public.extracted_records REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_events REPLICA IDENTITY FULL;
ALTER TABLE public.clinical_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.ai_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.ai_messages REPLICA IDENTITY FULL;

-- 6. ENABLE SUPABASE REALTIME ON ALL CORE CLINICAL TABLES
DO $$
DECLARE
    tbl text;
    tbl_list text[] := ARRAY[
        'health_profiles',
        'medications',
        'medication_logs',
        'health_metrics',
        'appointments',
        'doctors',
        'medical_documents',
        'extracted_records',
        'timeline_events',
        'clinical_notifications',
        'ai_conversations',
        'ai_messages'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbl_list LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        END IF;
    END LOOP;
END;
$$;


-- ============================================================
-- FILE: 20261120010000_storage_setup.sql
-- ============================================================

-- ==============================================================================
-- STORAGE BUCKETS & RLS POLICIES FOR MEDICAL RECORDS & AVATARS
-- ==============================================================================

-- 0. Ensure health_profiles table has avatar_url column
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 1. Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-records', 'medical-records', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/dicom', 'text/csv']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Medical Records Private Storage Policies
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

-- 3. Public Avatar Storage Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);


-- ============================================================
-- FILE: 20261120020000_production_architecture_and_pgvector.sql
-- ============================================================

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


-- ============================================================
-- FILE: 20261120030000_guideline_ingestion_rpc.sql
-- ============================================================

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


-- ============================================================
-- FILE: 20261121010000_doctor_portal_phase1_secure.sql
-- ============================================================

-- ==============================================================================
-- ChronicAI Doctor Portal - Phase 1 (Slice 1) - SECURE, ADDITIVE MIGRATION
-- File: 20261121010000_doctor_portal_phase1_secure.sql
--
-- RULES FOLLOWED
--  * Additive only: no existing table/column/policy is altered or dropped.
--    Exceptions (security hardening, additive in effect):
--      - audit_logs: + nullable patient_id column, + RESTRICTIVE insert policy
--      - REVOKE UPDATE/DELETE on audit_logs from anon/authenticated (no policy
--        ever allowed them, so patient behavior is unchanged)
--  * Doctors NEVER read patient data by default. Access = verified doctor +
--    patient-approved, unexpired, unrevoked grant, scoped per data category.
--  * Doctor identity ALWAYS derives from auth.uid(); never from a caller argument.
--  * Writes to consent tables (requests/grants) happen ONLY through SECURITY
--    DEFINER RPCs. There is no INSERT/UPDATE/DELETE policy for authenticated.
--  * All SECURITY DEFINER functions: SET search_path, EXECUTE revoked from
--    PUBLIC/anon, granted only to authenticated (+service_role).
--
-- GRANT SCOPE CATEGORIES (text[]):
--   profile | documents | timeline | medications | adherence | metrics | consultations
--
-- DOCTOR DOCUMENT/FILE ACCESS CONTRACT (storage stays private):
--   Doctors have NO storage.objects policy. A server route must:
--     1. call rpc doctor_authorize_document_download(document_id) with the
--        DOCTOR'S OWN JWT (verifies verified-doctor + grant 'documents', and
--        writes the audit row),
--     2. only then use the service-role client to createSignedUrl(path, <=600s).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    bmdc_number TEXT NOT NULL UNIQUE,
    specialty TEXT NOT NULL,
    qualifications TEXT,
    chamber_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'suspended')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinic_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'assistant', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.patient_identifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_code TEXT NOT NULL UNIQUE,
    qr_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent request. patient_id is NULL for "decoy" rows created when a doctor
-- submits an unknown code, so valid and invalid codes look identical to the doctor.
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    code_hash TEXT,
    requested_scope TEXT[] NOT NULL DEFAULT ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations'],
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.access_requests(id) ON DELETE SET NULL,
    scope TEXT[] NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_grant_scope_nonempty CHECK (cardinality(scope) > 0),
    CONSTRAINT chk_grant_scope_valid CHECK (
        scope <@ ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations']::text[]
    ),
    CONSTRAINT chk_grant_expiry CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '366 days')
);

CREATE TABLE IF NOT EXISTS public.visit_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    serial_number INTEGER NOT NULL CHECK (serial_number > 0),
    visit_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
    triage JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_token_id UUID REFERENCES public.visit_tokens(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT,
    chief_complaints TEXT,
    clinical_findings TEXT,
    diagnosis TEXT,
    icd10 TEXT,
    advice TEXT,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT,
    diagnosis TEXT,
    general_advice TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    strength TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    route TEXT DEFAULT 'Oral',
    duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE RESTRICT,
    scheduled_date DATE NOT NULL,
    reason TEXT,
    recommended_tests TEXT[] NOT NULL DEFAULT '{}'::text[],
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cached AI Pre-Visit Brief. Written by the server (service role) only.
CREATE TABLE IF NOT EXISTS public.patient_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    citations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    red_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_stale BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (patient_id, doctor_id)
);

-- Lookup / registration attempts (rate limiting + forensics). RPC-only access.
CREATE TABLE IF NOT EXISTS public.lookup_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    outcome TEXT NOT NULL DEFAULT 'attempt',
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_logs: additive column so patients can see WHO accessed THEIR data
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 2. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user ON public.doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_user ON public.clinic_staff(user_id, clinic_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_access_requests_patient ON public.access_requests(patient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_doctor ON public.access_requests(doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_doctor_hash ON public.access_requests(doctor_id, code_hash) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_access_grants_lookup ON public.access_grants(patient_id, doctor_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_access_grants_doctor ON public.access_grants(doctor_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_tokens_queue ON public.visit_tokens(clinic_id, doctor_id, visit_date, status);
CREATE INDEX IF NOT EXISTS idx_visit_tokens_patient ON public.visit_tokens(patient_id, visit_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_visit_serial ON public.visit_tokens(clinic_id, doctor_id, visit_date, serial_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_visit_one_active_per_patient ON public.visit_tokens(doctor_id, visit_date, patient_id)
    WHERE status IN ('waiting', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON public.prescriptions(doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON public.follow_ups(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_doctor_due ON public.follow_ups(doctor_id, scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_patient_summaries_patient ON public.patient_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_lookup_attempts_actor ON public.lookup_attempts(actor_user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON public.audit_logs(patient_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. IDENTITY / ROLE HELPERS (SECURITY DEFINER, identity from auth.uid())
-- ------------------------------------------------------------------------------

-- doctor_profiles.id of the caller, ONLY if verified and active. Suspended or
-- unverified doctors get NULL -> every policy below denies them.
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT dp.id
    FROM public.doctor_profiles dp
    WHERE dp.user_id = (SELECT auth.uid())
      AND dp.verification_status = 'verified'
      AND dp.is_active
    LIMIT 1
$$;

-- Caller's active role inside a clinic (NULL if not staff there).
CREATE OR REPLACE FUNCTION public.clinic_role(p_clinic_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT cs.role
    FROM public.clinic_staff cs
    WHERE cs.clinic_id = p_clinic_id
      AND cs.user_id = (SELECT auth.uid())
      AND cs.is_active
    LIMIT 1
$$;

-- Does the CALLER (verified doctor) hold an active grant on p_patient_id for category?
-- Not an oracle: it only ever answers about the caller's own grants.
CREATE OR REPLACE FUNCTION public.has_active_doctor_grant(p_patient_id uuid, p_category text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.doctor_profiles dp
        JOIN public.access_grants g ON g.doctor_id = dp.id
        WHERE dp.user_id = (SELECT auth.uid())
          AND dp.verification_status = 'verified'
          AND dp.is_active
          AND g.patient_id = p_patient_id
          AND g.revoked_at IS NULL
          AND g.expires_at > now()
          AND p_category = ANY (g.scope)
    )
$$;

CREATE OR REPLACE FUNCTION public.has_any_active_doctor_grant(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.doctor_profiles dp
        JOIN public.access_grants g ON g.doctor_id = dp.id
        WHERE dp.user_id = (SELECT auth.uid())
          AND dp.verification_status = 'verified'
          AND dp.is_active
          AND g.patient_id = p_patient_id
          AND g.revoked_at IS NULL
          AND g.expires_at > now()
    )
$$;

-- Internal audit writer (runs as owner, bypasses the restrictive insert policy).
CREATE OR REPLACE FUNCTION public._audit(
    p_actor uuid, p_patient uuid, p_action text, p_rtype text, p_rid uuid, p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
    INSERT INTO public.audit_logs (user_id, patient_id, action, resource_type, resource_id, details)
    VALUES (p_actor, p_patient, p_action, p_rtype, p_rid, COALESCE(p_details, '{}'::jsonb))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- Per-actor rate limit: 10 attempts / minute, 200 / day. Returns false when limited.
-- Limited attempts are persisted (never raise) but do not extend the window.
CREATE OR REPLACE FUNCTION public._lookup_rate_ok(p_actor uuid, p_kind text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_min int; v_day int;
BEGIN
    SELECT count(*) INTO v_min FROM public.lookup_attempts
     WHERE actor_user_id = p_actor AND outcome <> 'rate_limited' AND attempted_at > now() - INTERVAL '1 minute';
    SELECT count(*) INTO v_day FROM public.lookup_attempts
     WHERE actor_user_id = p_actor AND outcome <> 'rate_limited' AND attempted_at > now() - INTERVAL '1 day';
    IF v_min >= 10 OR v_day >= 200 THEN
        INSERT INTO public.lookup_attempts (actor_user_id, kind, outcome) VALUES (p_actor, p_kind, 'rate_limited');
        RETURN false;
    END IF;
    INSERT INTO public.lookup_attempts (actor_user_id, kind, outcome) VALUES (p_actor, p_kind, 'attempt');
    RETURN true;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. PATIENT IDENTIFIER (patient_code / QR). 8 chars from a 31-char alphabet (~8.5e11).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._gen_patient_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    v_bytes bytea := gen_random_bytes(8);
    v_code text := '';
    i int;
BEGIN
    FOR i IN 0..7 LOOP
        v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 31) + 1, 1);
    END LOOP;
    RETURN 'CA-' || substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4);
END;
$$;

-- Patient creates (or, with p_regenerate, rotates a leaked) code for THEMSELVES.
CREATE OR REPLACE FUNCTION public.ensure_patient_identifier(p_regenerate boolean DEFAULT false)
RETURNS TABLE (patient_code text, qr_token text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_try int := 0;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;

    IF NOT p_regenerate AND EXISTS (SELECT 1 FROM public.patient_identifiers pi WHERE pi.user_id = v_uid) THEN
        RETURN QUERY SELECT pi.patient_code, pi.qr_token FROM public.patient_identifiers pi WHERE pi.user_id = v_uid;
        RETURN;
    END IF;

    LOOP
        v_try := v_try + 1;
        BEGIN
            INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
            VALUES (v_uid, public._gen_patient_code(), encode(gen_random_bytes(24), 'hex'))
            ON CONFLICT (user_id) DO UPDATE
                SET patient_code = EXCLUDED.patient_code, qr_token = EXCLUDED.qr_token, created_at = now()
                WHERE p_regenerate;
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            IF v_try >= 5 THEN RAISE; END IF;
        END;
    END LOOP;

    PERFORM public._audit(v_uid, v_uid, CASE WHEN p_regenerate THEN 'rotate_patient_code' ELSE 'create_patient_code' END,
                          'patient_identifier', NULL);
    RETURN QUERY SELECT pi.patient_code, pi.qr_token FROM public.patient_identifiers pi WHERE pi.user_id = v_uid;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. CONSENT FLOW RPCs
-- ------------------------------------------------------------------------------

-- Doctor submits a patient_code. Response is ALWAYS {"status":"submitted"} (or
-- "rate_limited"): no patient data, no signal whether the code exists. For an
-- unknown code a decoy request row (patient_id NULL) is stored so the doctor's own
-- request list looks identical for valid and invalid codes.
CREATE OR REPLACE FUNCTION public.request_access_by_code(
    p_code text,
    p_requested_scope text[] DEFAULT NULL,
    p_message text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_doc uuid := public.current_doctor_id();
    v_norm text;
    v_hash text;
    v_patient uuid;
    v_scope text[];
    v_allowed text[] := ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations'];
BEGIN
    IF v_uid IS NULL OR v_doc IS NULL THEN
        RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
    END IF;

    IF NOT public._lookup_rate_ok(v_uid, 'request_access') THEN
        RETURN jsonb_build_object('status', 'rate_limited');
    END IF;

    v_norm := upper(regexp_replace(COALESCE(p_code, ''), '\s', '', 'g'));
    v_hash := encode(digest(v_norm, 'sha256'), 'hex');
    v_scope := COALESCE(NULLIF(p_requested_scope, '{}'::text[]), v_allowed);
    IF NOT (v_scope <@ v_allowed) THEN v_scope := v_allowed; END IF;

    IF v_norm ~ '^CA-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN
        SELECT pi.user_id INTO v_patient FROM public.patient_identifiers pi WHERE pi.patient_code = v_norm;
    END IF;
    IF v_patient = v_uid THEN v_patient := NULL; END IF;  -- cannot request own record -> decoy

    -- same behaviour for real and decoy rows: dedupe on (doctor, code_hash)
    IF NOT EXISTS (
        SELECT 1 FROM public.access_requests r
        WHERE r.doctor_id = v_doc AND r.code_hash = v_hash AND r.status = 'pending' AND r.expires_at > now()
    ) THEN
        INSERT INTO public.access_requests (patient_id, doctor_id, code_hash, requested_scope, message)
        VALUES (v_patient, v_doc, v_hash, v_scope, left(p_message, 500));
        IF v_patient IS NOT NULL THEN
            PERFORM public._audit(v_uid, v_patient, 'access_request_created', 'access_request', NULL,
                                  jsonb_build_object('doctor_id', v_doc));
        END IF;
    END IF;

    RETURN jsonb_build_object('status', 'submitted');
END;
$$;

-- Doctor's own request list. Patient identity is revealed ONLY once approved.
CREATE OR REPLACE FUNCTION public.doctor_list_access_requests()
RETURNS TABLE (
    request_id uuid, status text, created_at timestamptz, expires_at timestamptz,
    responded_at timestamptz, patient_ref uuid, patient_name text, grant_id uuid,
    grant_scope text[], grant_expires_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT r.id,
           CASE WHEN r.status = 'pending' AND r.expires_at <= now() THEN 'expired' ELSE r.status END,
           r.created_at, r.expires_at, r.responded_at,
           CASE WHEN r.status = 'approved' THEN r.patient_id END,
           CASE WHEN r.status = 'approved' THEN hp.full_name END,
           g.id, g.scope, g.expires_at
    FROM public.access_requests r
    LEFT JOIN public.health_profiles hp ON hp.user_id = r.patient_id AND r.status = 'approved'
    LEFT JOIN public.access_grants g ON g.request_id = r.id AND g.revoked_at IS NULL AND g.expires_at > now()
    WHERE r.doctor_id = public.current_doctor_id()
    ORDER BY r.created_at DESC
    LIMIT 200
$$;

-- Patient approves/rejects a request addressed to them. ONLY way a grant is created.
CREATE OR REPLACE FUNCTION public.respond_access_request(
    p_request_id uuid, p_approve boolean, p_scope text[] DEFAULT NULL, p_expires_at timestamptz DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_req public.access_requests%ROWTYPE;
    v_allowed text[] := ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations'];
    v_scope text[];
    v_exp timestamptz;
    v_grant uuid;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;

    SELECT * INTO v_req FROM public.access_requests
     WHERE id = p_request_id AND patient_id = v_uid AND status = 'pending' AND expires_at > now()
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'request_not_found_or_closed' USING ERRCODE = 'P0002'; END IF;

    IF NOT p_approve THEN
        UPDATE public.access_requests SET status = 'rejected', responded_at = now() WHERE id = v_req.id;
        PERFORM public._audit(v_uid, v_uid, 'access_request_rejected', 'access_request', v_req.id,
                              jsonb_build_object('doctor_id', v_req.doctor_id));
        RETURN NULL;
    END IF;

    v_scope := COALESCE(NULLIF(p_scope, '{}'::text[]), v_req.requested_scope);
    IF NOT (v_scope <@ v_allowed) THEN RAISE EXCEPTION 'invalid_scope' USING ERRCODE = '22023'; END IF;
    v_exp := COALESCE(p_expires_at, now() + INTERVAL '30 days');
    IF v_exp <= now() + INTERVAL '1 minute' OR v_exp > now() + INTERVAL '365 days' THEN
        RAISE EXCEPTION 'invalid_expiry' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.doctor_profiles dp
                    WHERE dp.id = v_req.doctor_id AND dp.verification_status = 'verified' AND dp.is_active) THEN
        RAISE EXCEPTION 'doctor_not_verified' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.access_grants (patient_id, doctor_id, request_id, scope, expires_at)
    VALUES (v_uid, v_req.doctor_id, v_req.id, v_scope, v_exp)
    RETURNING id INTO v_grant;

    UPDATE public.access_requests SET status = 'approved', responded_at = now() WHERE id = v_req.id;
    PERFORM public._audit(v_uid, v_uid, 'access_grant_created', 'access_grant', v_grant,
                          jsonb_build_object('doctor_id', v_req.doctor_id, 'scope', v_scope, 'expires_at', v_exp));
    RETURN v_grant;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_access_grant(p_grant_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := (SELECT auth.uid()); v_n int;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
    UPDATE public.access_grants SET revoked_at = now()
     WHERE id = p_grant_id AND patient_id = v_uid AND revoked_at IS NULL;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n > 0 THEN
        PERFORM public._audit(v_uid, v_uid, 'access_grant_revoked', 'access_grant', p_grant_id);
    END IF;
    RETURN v_n > 0;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. CLINIC QUEUE RPCs (assistant never gets clinical history)
-- ------------------------------------------------------------------------------

-- Desk registers an arriving patient by patient_code. Creates the daily serial AND a
-- pending consent request for the chosen doctor. NO clinical data is exposed; the
-- doctor still needs the patient to approve (in the app) before reading anything.
CREATE OR REPLACE FUNCTION public.register_visit(
    p_clinic_id uuid, p_doctor_id uuid, p_patient_code text, p_priority text DEFAULT 'normal'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_role text := public.clinic_role(p_clinic_id);
    v_norm text;
    v_patient uuid;
    v_tz text;
    v_date date;
    v_serial int;
    v_id uuid;
BEGIN
    IF v_uid IS NULL OR v_role IS NULL THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.clinic_staff cs
        JOIN public.doctor_profiles dp ON dp.user_id = cs.user_id
        WHERE cs.clinic_id = p_clinic_id AND dp.id = p_doctor_id AND cs.role = 'doctor' AND cs.is_active
          AND dp.verification_status = 'verified' AND dp.is_active
    ) THEN
        RAISE EXCEPTION 'invalid_doctor' USING ERRCODE = '22023';
    END IF;

    IF NOT public._lookup_rate_ok(v_uid, 'register_visit') THEN
        RETURN jsonb_build_object('status', 'rate_limited');
    END IF;

    v_norm := upper(regexp_replace(COALESCE(p_patient_code, ''), '\s', '', 'g'));
    IF v_norm ~ '^CA-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN
        SELECT pi.user_id INTO v_patient FROM public.patient_identifiers pi WHERE pi.patient_code = v_norm;
    END IF;
    IF v_patient IS NULL THEN RAISE EXCEPTION 'patient_not_found' USING ERRCODE = 'P0002'; END IF;

    SELECT c.timezone INTO v_tz FROM public.clinics c WHERE c.id = p_clinic_id;
    v_date := (now() AT TIME ZONE COALESCE(v_tz, 'Asia/Dhaka'))::date;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_clinic_id::text || p_doctor_id::text || v_date::text, 0));
    SELECT COALESCE(max(vt.serial_number), 0) + 1 INTO v_serial
      FROM public.visit_tokens vt
     WHERE vt.clinic_id = p_clinic_id AND vt.doctor_id = p_doctor_id AND vt.visit_date = v_date;

    BEGIN
        INSERT INTO public.visit_tokens (clinic_id, doctor_id, patient_id, serial_number, visit_date, priority, created_by)
        VALUES (p_clinic_id, p_doctor_id, v_patient, v_serial, v_date, COALESCE(p_priority, 'normal'), v_uid)
        RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'already_in_queue' USING ERRCODE = '23505';
    END;

    IF NOT EXISTS (SELECT 1 FROM public.access_requests r
                    WHERE r.patient_id = v_patient AND r.doctor_id = p_doctor_id
                      AND r.status = 'pending' AND r.expires_at > now()) THEN
        INSERT INTO public.access_requests (patient_id, doctor_id, code_hash, message)
        VALUES (v_patient, p_doctor_id, encode(digest(v_norm, 'sha256'), 'hex'), 'Clinic visit registration');
    END IF;

    PERFORM public._audit(v_uid, v_patient, 'visit_registered', 'visit_token', v_id,
                          jsonb_build_object('clinic_id', p_clinic_id, 'doctor_id', p_doctor_id));
    RETURN jsonb_build_object('status', 'registered', 'visit_token_id', v_id,
                              'serial_number', v_serial, 'visit_date', v_date);
END;
$$;

-- Queue view: assistants/admins see their clinic's queue; a doctor sees only their own.
-- Returns patient name (needed at the desk) but NO clinical data.
CREATE OR REPLACE FUNCTION public.get_clinic_queue(p_clinic_id uuid, p_date date DEFAULT NULL)
RETURNS TABLE (
    id uuid, serial_number int, status text, priority text, doctor_id uuid,
    patient_id uuid, patient_name text, triage jsonb, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role text := public.clinic_role(p_clinic_id);
    v_doc uuid := public.current_doctor_id();
    v_tz text;
    v_date date;
BEGIN
    IF v_role IS NULL THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
    SELECT c.timezone INTO v_tz FROM public.clinics c WHERE c.id = p_clinic_id;
    v_date := COALESCE(p_date, (now() AT TIME ZONE COALESCE(v_tz, 'Asia/Dhaka'))::date);

    RETURN QUERY
    SELECT vt.id, vt.serial_number, vt.status, vt.priority, vt.doctor_id, vt.patient_id,
           hp.full_name, vt.triage, vt.created_at
    FROM public.visit_tokens vt
    LEFT JOIN public.health_profiles hp ON hp.user_id = vt.patient_id
    WHERE vt.clinic_id = p_clinic_id AND vt.visit_date = v_date
      AND (v_role IN ('assistant', 'admin') OR (v_doc IS NOT NULL AND vt.doctor_id = v_doc))
    ORDER BY (vt.priority = 'emergency') DESC, (vt.priority = 'urgent') DESC, vt.serial_number;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. DOCTOR READ HELPERS (audited, column-limited)
-- ------------------------------------------------------------------------------

-- Restricted profile snapshot: NO emergency_contact, preferences, avatar_url.
CREATE OR REPLACE FUNCTION public.doctor_get_patient_snapshot(p_patient_id uuid)
RETURNS TABLE (
    full_name text, date_of_birth date, sex text, blood_group text,
    height_cm numeric, weight_kg numeric, allergies jsonb, chronic_conditions jsonb
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.has_active_doctor_grant(p_patient_id, 'profile') THEN
        RAISE EXCEPTION 'no_active_grant' USING ERRCODE = '42501';
    END IF;
    PERFORM public._audit((SELECT auth.uid()), p_patient_id, 'read', 'health_profile', NULL,
                          jsonb_build_object('via', 'doctor_get_patient_snapshot'));
    RETURN QUERY
    SELECT hp.full_name, hp.date_of_birth, hp.sex, hp.blood_group, hp.height_cm, hp.weight_kg,
           hp.allergies, hp.chronic_conditions
    FROM public.health_profiles hp WHERE hp.user_id = p_patient_id;
END;
$$;

-- Server routes call this for every Brief generation / export so each doctor read is audited.
CREATE OR REPLACE FUNCTION public.doctor_log_phi_access(
    p_patient_id uuid, p_resource_type text, p_resource_id uuid DEFAULT NULL, p_action text DEFAULT 'read'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.has_any_active_doctor_grant(p_patient_id) THEN
        RAISE EXCEPTION 'no_active_grant' USING ERRCODE = '42501';
    END IF;
    RETURN public._audit((SELECT auth.uid()), p_patient_id, left(p_action, 40), left(p_resource_type, 60), p_resource_id);
END;
$$;

-- Step 1 of the document download contract (see file header).
CREATE OR REPLACE FUNCTION public.doctor_authorize_document_download(p_document_id uuid)
RETURNS TABLE (storage_bucket text, file_path text, patient_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_doc public.medical_documents%ROWTYPE;
BEGIN
    SELECT * INTO v_doc FROM public.medical_documents d WHERE d.id = p_document_id;
    IF NOT FOUND OR NOT public.has_active_doctor_grant(v_doc.user_id, 'documents') THEN
        RAISE EXCEPTION 'no_active_grant' USING ERRCODE = '42501';
    END IF;
    PERFORM public._audit((SELECT auth.uid()), v_doc.user_id, 'download', 'medical_document', v_doc.id);
    RETURN QUERY SELECT COALESCE(v_doc.storage_bucket, 'medical-records'), v_doc.file_path, v_doc.user_id;
END;
$$;

-- Publish an e-prescription into the PATIENT's medications as 'needs_confirmation'
-- (patient confirms in their own app: human-in-the-loop) + notification.
CREATE OR REPLACE FUNCTION public.publish_prescription(p_prescription_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_doc uuid := public.current_doctor_id();
    v_rx public.prescriptions%ROWTYPE;
    v_name text;
    v_n int;
BEGIN
    IF v_doc IS NULL THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;

    SELECT * INTO v_rx FROM public.prescriptions
     WHERE id = p_prescription_id AND doctor_id = v_doc AND published_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'prescription_not_found_or_published' USING ERRCODE = 'P0002'; END IF;
    IF NOT public.has_active_doctor_grant(v_rx.patient_id, 'consultations') THEN
        RAISE EXCEPTION 'no_active_grant' USING ERRCODE = '42501';
    END IF;

    SELECT full_name INTO v_name FROM public.doctor_profiles WHERE id = v_doc;

    INSERT INTO public.medications (user_id, name, generic_name, strength, dosage, frequency, route, instructions,
                                    start_date, end_date, prescribing_doctor, related_condition, status)
    SELECT v_rx.patient_id, i.medication_name, i.generic_name, i.strength, i.dosage, i.frequency,
           COALESCE(i.route, 'Oral'), i.instructions, CURRENT_DATE,
           CASE WHEN i.duration_days IS NOT NULL THEN CURRENT_DATE + i.duration_days END,
           v_name, v_rx.diagnosis, 'needs_confirmation'
    FROM public.prescription_items i WHERE i.prescription_id = v_rx.id;
    GET DIAGNOSTICS v_n = ROW_COUNT;

    INSERT INTO public.clinical_notifications (user_id, type, title, message, severity, source_trigger, link_href, link_label)
    VALUES (v_rx.patient_id, 'care_insight', 'New prescription from ' || COALESCE(v_name, 'your doctor'),
            v_n || ' medication(s) are waiting for your confirmation.', 'info', 'doctor_prescription',
            '/medications', 'Review medications');

    UPDATE public.prescriptions SET published_at = now() WHERE id = v_rx.id;
    PERFORM public._audit((SELECT auth.uid()), v_rx.patient_id, 'prescription_published', 'prescription', v_rx.id,
                          jsonb_build_object('items', v_n));
    RETURN v_n;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. TRIGGERS
-- ------------------------------------------------------------------------------

-- 8a. Guard doctor_profiles: a user may NEVER self-verify / re-activate / swap BMDC silently.
CREATE OR REPLACE FUNCTION public.guard_doctor_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF TG_OP = 'INSERT' THEN
            NEW.verification_status := 'pending';
            NEW.verified_at := NULL;
            NEW.is_active := true;
        ELSE
            NEW.verification_status := OLD.verification_status;
            NEW.verified_at := OLD.verified_at;
            NEW.is_active := OLD.is_active;
            NEW.user_id := OLD.user_id;
            IF NEW.bmdc_number IS DISTINCT FROM OLD.bmdc_number THEN
                NEW.verification_status := 'pending';  -- changing registration number = re-verify
                NEW.verified_at := NULL;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guard_doctor_profile ON public.doctor_profiles;
CREATE TRIGGER trg_guard_doctor_profile BEFORE INSERT OR UPDATE ON public.doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_profile();

-- 8b. Brief cache invalidation. SECURITY DEFINER: the writer is the PATIENT, who has
-- no RLS right to touch patient_summaries; without DEFINER the UPDATE would silently
-- affect 0 rows.
CREATE OR REPLACE FUNCTION public.mark_summary_stale_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.patient_summaries SET is_stale = true
     WHERE patient_id = COALESCE(NEW.user_id, OLD.user_id) AND NOT is_stale;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_summary_stale_patient()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.patient_summaries SET is_stale = true
     WHERE patient_id = COALESCE(NEW.patient_id, OLD.patient_id) AND NOT is_stale;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['health_profiles','medical_documents','medications','medication_logs','health_metrics','timeline_events']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_stale_summary ON public.%I', t);
        EXECUTE format('CREATE TRIGGER trg_stale_summary AFTER INSERT OR UPDATE OR DELETE ON public.%I
                        FOR EACH ROW EXECUTE FUNCTION public.mark_summary_stale_user()', t);
    END LOOP;
    FOREACH t IN ARRAY ARRAY['consultations','prescriptions','follow_ups']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_stale_summary ON public.%I', t);
        EXECUTE format('CREATE TRIGGER trg_stale_summary AFTER INSERT OR UPDATE OR DELETE ON public.%I
                        FOR EACH ROW EXECUTE FUNCTION public.mark_summary_stale_patient()', t);
    END LOOP;
END $$;

-- 8c. Revoke => drop that doctor's cached Brief for the patient immediately.
CREATE OR REPLACE FUNCTION public.purge_summary_on_revoke()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.patient_summaries WHERE patient_id = NEW.patient_id AND doctor_id = NEW.doctor_id;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_purge_summary_on_revoke ON public.access_grants;
CREATE TRIGGER trg_purge_summary_on_revoke AFTER UPDATE OF revoked_at ON public.access_grants
    FOR EACH ROW WHEN (OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL)
    EXECUTE FUNCTION public.purge_summary_on_revoke();

-- 8d. consultations.updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_touch_consultations ON public.consultations;
CREATE TRIGGER trg_touch_consultations BEFORE UPDATE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.doctor_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_staff        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_summaries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookup_attempts     ENABLE ROW LEVEL SECURITY;

-- doctor_profiles ---------------------------------------------------------------
DROP POLICY IF EXISTS "dp_select" ON public.doctor_profiles;
CREATE POLICY "dp_select" ON public.doctor_profiles FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.access_requests r WHERE r.doctor_id = doctor_profiles.id AND r.patient_id = (SELECT auth.uid()))
        OR EXISTS (SELECT 1 FROM public.access_grants g   WHERE g.doctor_id = doctor_profiles.id AND g.patient_id = (SELECT auth.uid()))
    );
DROP POLICY IF EXISTS "dp_insert" ON public.doctor_profiles;
CREATE POLICY "dp_insert" ON public.doctor_profiles FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()) AND verification_status = 'pending');
DROP POLICY IF EXISTS "dp_update" ON public.doctor_profiles;
CREATE POLICY "dp_update" ON public.doctor_profiles FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- clinics / clinic_staff (read-only for users; managed by service role) ---------
DROP POLICY IF EXISTS "clinics_select" ON public.clinics;
CREATE POLICY "clinics_select" ON public.clinics FOR SELECT TO authenticated
    USING (public.clinic_role(id) IS NOT NULL);
DROP POLICY IF EXISTS "clinic_staff_select" ON public.clinic_staff;
CREATE POLICY "clinic_staff_select" ON public.clinic_staff FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.clinic_role(clinic_id) = 'admin');

-- patient_identifiers: the OWNER only. Doctors/assistants have NO access. ------
DROP POLICY IF EXISTS "pi_select_own" ON public.patient_identifiers;
CREATE POLICY "pi_select_own" ON public.patient_identifiers FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- access_requests / access_grants: read-only; writes only via RPC ---------------
DROP POLICY IF EXISTS "ar_select_patient" ON public.access_requests;
CREATE POLICY "ar_select_patient" ON public.access_requests FOR SELECT TO authenticated
    USING (patient_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "ag_select_patient" ON public.access_grants;
CREATE POLICY "ag_select_patient" ON public.access_grants FOR SELECT TO authenticated
    USING (patient_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "ag_select_doctor" ON public.access_grants;
CREATE POLICY "ag_select_doctor" ON public.access_grants FOR SELECT TO authenticated
    USING (doctor_id = public.current_doctor_id());

-- visit_tokens ------------------------------------------------------------------
DROP POLICY IF EXISTS "vt_select" ON public.visit_tokens;
CREATE POLICY "vt_select" ON public.visit_tokens FOR SELECT TO authenticated
    USING (
        patient_id = (SELECT auth.uid())
        OR doctor_id = public.current_doctor_id()
        OR public.clinic_role(clinic_id) IN ('assistant', 'admin')
    );
DROP POLICY IF EXISTS "vt_update" ON public.visit_tokens;
CREATE POLICY "vt_update" ON public.visit_tokens FOR UPDATE TO authenticated
    USING (doctor_id = public.current_doctor_id() OR public.clinic_role(clinic_id) IN ('assistant', 'admin'))
    WITH CHECK (doctor_id = public.current_doctor_id() OR public.clinic_role(clinic_id) IN ('assistant', 'admin'));

-- consultations / prescriptions / follow_ups -------------------------------------
-- patient: own rows. doctor: rows they authored OR rows covered by a 'consultations' grant.
DROP POLICY IF EXISTS "consult_select" ON public.consultations;
CREATE POLICY "consult_select" ON public.consultations FOR SELECT TO authenticated
    USING (patient_id = (SELECT auth.uid()) OR doctor_id = public.current_doctor_id()
           OR public.has_active_doctor_grant(patient_id, 'consultations'));
DROP POLICY IF EXISTS "consult_insert" ON public.consultations;
CREATE POLICY "consult_insert" ON public.consultations FOR INSERT TO authenticated
    WITH CHECK (doctor_id = public.current_doctor_id() AND public.has_active_doctor_grant(patient_id, 'consultations'));
DROP POLICY IF EXISTS "consult_update" ON public.consultations;
CREATE POLICY "consult_update" ON public.consultations FOR UPDATE TO authenticated
    USING (doctor_id = public.current_doctor_id() AND public.has_active_doctor_grant(patient_id, 'consultations'))
    WITH CHECK (doctor_id = public.current_doctor_id() AND public.has_active_doctor_grant(patient_id, 'consultations'));

DROP POLICY IF EXISTS "rx_select" ON public.prescriptions;
CREATE POLICY "rx_select" ON public.prescriptions FOR SELECT TO authenticated
    USING (patient_id = (SELECT auth.uid()) OR doctor_id = public.current_doctor_id()
           OR public.has_active_doctor_grant(patient_id, 'consultations'));
DROP POLICY IF EXISTS "rx_insert" ON public.prescriptions;
CREATE POLICY "rx_insert" ON public.prescriptions FOR INSERT TO authenticated
    WITH CHECK (doctor_id = public.current_doctor_id() AND published_at IS NULL
                AND public.has_active_doctor_grant(patient_id, 'consultations'));
DROP POLICY IF EXISTS "rx_update" ON public.prescriptions;
CREATE POLICY "rx_update" ON public.prescriptions FOR UPDATE TO authenticated
    USING (doctor_id = public.current_doctor_id() AND published_at IS NULL
           AND public.has_active_doctor_grant(patient_id, 'consultations'))
    WITH CHECK (doctor_id = public.current_doctor_id() AND published_at IS NULL);

DROP POLICY IF EXISTS "rxi_select" ON public.prescription_items;
CREATE POLICY "rxi_select" ON public.prescription_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_items.prescription_id));
DROP POLICY IF EXISTS "rxi_write" ON public.prescription_items;
CREATE POLICY "rxi_write" ON public.prescription_items FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.prescriptions p
                    WHERE p.id = prescription_items.prescription_id AND p.doctor_id = public.current_doctor_id()
                      AND p.published_at IS NULL))
    WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions p
                    WHERE p.id = prescription_items.prescription_id AND p.doctor_id = public.current_doctor_id()
                      AND p.published_at IS NULL));

DROP POLICY IF EXISTS "fu_select" ON public.follow_ups;
CREATE POLICY "fu_select" ON public.follow_ups FOR SELECT TO authenticated
    USING (patient_id = (SELECT auth.uid()) OR doctor_id = public.current_doctor_id()
           OR public.has_active_doctor_grant(patient_id, 'consultations'));
DROP POLICY IF EXISTS "fu_insert" ON public.follow_ups;
CREATE POLICY "fu_insert" ON public.follow_ups FOR INSERT TO authenticated
    WITH CHECK (doctor_id = public.current_doctor_id() AND public.has_active_doctor_grant(patient_id, 'consultations'));
DROP POLICY IF EXISTS "fu_update" ON public.follow_ups;
CREATE POLICY "fu_update" ON public.follow_ups FOR UPDATE TO authenticated
    USING (doctor_id = public.current_doctor_id() AND public.has_active_doctor_grant(patient_id, 'consultations'))
    WITH CHECK (doctor_id = public.current_doctor_id());

-- patient_summaries: doctor reads ONLY their own cache AND only while a grant is live.
-- Writes: service role only (no write policy).
DROP POLICY IF EXISTS "ps_select_doctor" ON public.patient_summaries;
CREATE POLICY "ps_select_doctor" ON public.patient_summaries FOR SELECT TO authenticated
    USING (doctor_id = public.current_doctor_id() AND public.has_any_active_doctor_grant(patient_id));

-- lookup_attempts: no policies at all => only SECURITY DEFINER functions / service role.

-- Additive doctor SELECT policies on EXISTING patient tables (grant + scope gated).
-- Deliberately NOT created for: health_profiles (use doctor_get_patient_snapshot),
-- ai_conversations, ai_messages, document_embeddings, doctors, appointments,
-- clinical_notifications, patient_identifiers, storage.objects.
DROP POLICY IF EXISTS "doctor_grant_read_documents" ON public.medical_documents;
CREATE POLICY "doctor_grant_read_documents" ON public.medical_documents FOR SELECT TO authenticated
    USING (public.has_active_doctor_grant(user_id, 'documents'));
DROP POLICY IF EXISTS "doctor_grant_read_extracted" ON public.extracted_records;
CREATE POLICY "doctor_grant_read_extracted" ON public.extracted_records FOR SELECT TO authenticated
    USING (public.has_active_doctor_grant(user_id, 'documents'));
DROP POLICY IF EXISTS "doctor_grant_read_timeline" ON public.timeline_events;
CREATE POLICY "doctor_grant_read_timeline" ON public.timeline_events FOR SELECT TO authenticated
    USING (public.has_active_doctor_grant(user_id, 'timeline'));
DROP POLICY IF EXISTS "doctor_grant_read_medications" ON public.medications;
CREATE POLICY "doctor_grant_read_medications" ON public.medications FOR SELECT TO authenticated
    USING (public.has_active_doctor_grant(user_id, 'medications'));
DROP POLICY IF EXISTS "doctor_grant_read_med_logs" ON public.medication_logs;
CREATE POLICY "doctor_grant_read_med_logs" ON public.medication_logs FOR SELECT TO authenticated
    USING (public.has_active_doctor_grant(user_id, 'adherence'));
DROP POLICY IF EXISTS "doctor_grant_read_metrics" ON public.health_metrics;
CREATE POLICY "doctor_grant_read_metrics" ON public.health_metrics FOR SELECT TO authenticated
    USING (public.has_active_doctor_grant(user_id, 'metrics'));

-- audit_logs: patients see who touched THEIR data; nobody may forge another patient's trail.
DROP POLICY IF EXISTS "audit_patient_select" ON public.audit_logs;
CREATE POLICY "audit_patient_select" ON public.audit_logs FOR SELECT TO authenticated
    USING (patient_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "audit_no_forged_patient_id" ON public.audit_logs;
CREATE POLICY "audit_no_forged_patient_id" ON public.audit_logs AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (patient_id IS NULL OR patient_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 10. PRIVILEGES (defense in depth on top of RLS)
-- ------------------------------------------------------------------------------
REVOKE ALL ON public.doctor_profiles, public.clinics, public.clinic_staff, public.patient_identifiers,
              public.access_requests, public.access_grants, public.visit_tokens, public.consultations,
              public.prescriptions, public.prescription_items, public.follow_ups, public.patient_summaries,
              public.lookup_attempts FROM anon;

-- Consent / identity / cache / infra tables: authenticated may only SELECT (RLS-filtered).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.clinics, public.clinic_staff, public.patient_identifiers,
              public.access_requests, public.access_grants, public.patient_summaries FROM authenticated;
REVOKE ALL ON public.lookup_attempts FROM authenticated;
REVOKE DELETE, TRUNCATE ON public.doctor_profiles, public.consultations, public.prescriptions, public.follow_ups FROM authenticated;

-- Queue: only status/priority/triage/called_at may be changed, and rows are created via register_visit().
REVOKE INSERT, DELETE, TRUNCATE ON public.visit_tokens FROM authenticated;
REVOKE UPDATE ON public.visit_tokens FROM authenticated;
GRANT UPDATE (status, priority, triage, called_at) ON public.visit_tokens TO authenticated;

-- audit_logs is append-only for clients.
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- Function execute rights: nothing for PUBLIC/anon.
DO $$
DECLARE f text;
BEGIN
    FOREACH f IN ARRAY ARRAY[
        'current_doctor_id()', 'clinic_role(uuid)', 'has_active_doctor_grant(uuid,text)',
        'has_any_active_doctor_grant(uuid)', 'ensure_patient_identifier(boolean)',
        'request_access_by_code(text,text[],text)', 'doctor_list_access_requests()',
        'respond_access_request(uuid,boolean,text[],timestamptz)', 'revoke_access_grant(uuid)',
        'register_visit(uuid,uuid,text,text)', 'get_clinic_queue(uuid,date)',
        'doctor_get_patient_snapshot(uuid)', 'doctor_log_phi_access(uuid,text,uuid,text)',
        'doctor_authorize_document_download(uuid)', 'publish_prescription(uuid)'
    ] LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
    END LOOP;
    -- internal helpers + trigger functions: not callable by API roles at all
    FOREACH f IN ARRAY ARRAY[
        '_audit(uuid,uuid,text,text,uuid,jsonb)', '_lookup_rate_ok(uuid,text)', '_gen_patient_code()',
        'guard_doctor_profile()', 'mark_summary_stale_user()', 'mark_summary_stale_patient()',
        'purge_summary_on_revoke()', 'touch_updated_at()'
    ] LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 11. REALTIME (queue). Realtime still evaluates RLS per subscriber.
-- ------------------------------------------------------------------------------
ALTER TABLE public.visit_tokens REPLICA IDENTITY FULL;
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.visit_tokens;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ------------------------------------------------------------------------------
-- 12. BACKFILL patient codes for existing patients (idempotent, one-time)
-- ------------------------------------------------------------------------------
INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
SELECT hp.user_id, public._gen_patient_code(), encode(gen_random_bytes(24), 'hex')
FROM public.health_profiles hp
ON CONFLICT (user_id) DO NOTHING;

