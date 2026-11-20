-- ============================================================
-- ChronicAI — Initial Database Migration
-- PostgreSQL 16 + Supabase Schema with Row-Level Security
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_group TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  chronic_conditions JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{"language": "en", "explanation_depth": "balanced", "notifications_enabled": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_profile_user UNIQUE (user_id)
);

-- 2. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prescription', 'lab_report', 'imaging', 'discharge_summary', 'doctor_note', 'other')),
  document_date DATE,
  facility_name TEXT,
  doctor_name TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'extracted', 'needs_review', 'verified', 'failed')),
  summary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. EXTRACTED RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.extracted_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_extracted JSONB NOT NULL,
  confirmed_data JSONB,
  confidence_score NUMERIC DEFAULT 0.95,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'modified')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('visit', 'diagnosis', 'medication_start', 'medication_stop', 'lab_test', 'imaging', 'surgery', 'measurement', 'note')),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MEDICATIONS & ADHERENCE LOGS
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  strength TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT DEFAULT 'oral',
  instructions TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued', 'needs_confirmation')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  recorded_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'snoozed', 'missed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. HEALTH METRICS TABLE
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'heart_rate', 'glucose', 'hba1c', 'weight', 'temperature', 'spo2', 'other')),
  value_primary NUMERIC NOT NULL,
  value_secondary NUMERIC,
  unit TEXT NOT NULL,
  context TEXT CHECK (context IN ('fasting', 'postprandial', 'resting', 'random', 'bedtime')),
  reference_low NUMERIC,
  reference_high NUMERIC,
  is_abnormal BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DOCTORS & APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  clinic_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled', 'rescheduled')),
  consultation_notes TEXT,
  instructions TEXT,
  preparation_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  safety_flags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_user_date ON public.timeline_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_user_type_date ON public.health_metrics(user_id, metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_meds_user_status ON public.medications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_med_logs_user_date ON public.medication_logs(user_id, scheduled_time DESC);
CREATE INDEX IF NOT EXISTS idx_appts_user_date ON public.appointments(user_id, appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);

-- ROW LEVEL SECURITY POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS policy generator
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'documents', 'extracted_records', 'timeline_events', 
    'medications', 'medication_logs', 'health_metrics', 'doctors', 
    'appointments', 'ai_conversations', 'ai_messages'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_user_policy ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_user_policy ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;
