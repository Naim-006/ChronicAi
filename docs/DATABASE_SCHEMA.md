# Database Schema & Data Models — Universal Personal Medical AI

## 1. Core Principles
- **Mandatory Row Level Security (RLS)**: Every single table incorporates a `user_id uuid NOT NULL REFERENCES auth.users(id)` and an RLS policy ensuring users can only read and write their own data.
- **Traceability & Provenance**: Every extracted clinical fact references its originating `document_id`.
- **Soft Deletion**: Records support a `deleted_at` timestamp for audit compliance and recovery.

---

## 2. Table Specifications

### 2.1 `profiles`
User demographic profile and baseline medical metadata.
```sql
CREATE TABLE public.profiles (
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
  preferences JSONB DEFAULT '{"language": "en", "explanation_depth": "balanced"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 `documents`
Original medical documents uploaded to encrypted storage.
```sql
CREATE TABLE public.documents (
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
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 `extracted_records`
Structured data parsed from documents awaiting or granted user confirmation.
```sql
CREATE TABLE public.extracted_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_extracted JSONB NOT NULL,
  confirmed_data JSONB,
  confidence_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'modified')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.4 `timeline_events`
Chronological medical journey events.
```sql
CREATE TABLE public.timeline_events (
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
```

### 2.5 `medications` & `medication_logs`
Active prescriptions, dosing schedules, and daily adherence records.
```sql
CREATE TABLE public.medications (
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

CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  recorded_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'snoozed', 'missed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.6 `health_metrics`
Biometric measurements with clinical intervals.
```sql
CREATE TABLE public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'heart_rate', 'glucose', 'hba1c', 'weight', 'temperature', 'spo2', 'other')),
  value_primary NUMERIC NOT NULL,
  value_secondary NUMERIC, -- e.g. diastolic for BP
  unit TEXT NOT NULL,
  context TEXT CHECK (context IN ('fasting', 'postprandial', 'resting', 'random', 'bedtime')),
  reference_low NUMERIC,
  reference_high NUMERIC,
  is_abnormal BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.7 `doctors` & `appointments`
Provider directory and personal consultation schedules.
```sql
CREATE TABLE public.doctors (
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

CREATE TABLE public.appointments (
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
```

### 2.8 `ai_conversations` & `ai_messages`
Context-grounded assistant sessions with explicit source citations.
```sql
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  safety_flags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
