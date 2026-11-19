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
