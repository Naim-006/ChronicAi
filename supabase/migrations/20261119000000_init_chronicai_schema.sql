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

