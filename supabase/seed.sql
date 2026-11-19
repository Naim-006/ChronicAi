-- ==============================================================================
-- ChronicAI - Demo Seed Data Script (Run after user signs up, or for testing)
-- Replace 'USER_ID_HERE' with an actual auth.users uuid if executing directly.
-- ==============================================================================

-- Example function to seed default clinical data for a user
CREATE OR REPLACE FUNCTION public.seed_demo_patient_data(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update health profile
    UPDATE public.health_profiles
    SET 
        full_name = 'Elena Vance',
        date_of_birth = '1962-08-14',
        sex = 'female',
        blood_group = 'O+',
        height_cm = 165.0,
        weight_kg = 72.4,
        emergency_contact = '{"name": "Robert Vance", "relationship": "Spouse", "phone": "+1 (555) 234-5678"}'::jsonb,
        allergies = '[
            {"id": "all-1", "substance": "Penicillin", "reaction": "Severe cutaneous rash, facial edema", "severity": "severe", "diagnosed_date": "1998-04-12"},
            {"id": "all-2", "substance": "Sulfa Antibiotics", "reaction": "Mild hives and nausea", "severity": "moderate", "diagnosed_date": "2010-09-21"}
        ]'::jsonb,
        chronic_conditions = '[
            {"id": "cond-1", "name": "Type 2 Diabetes Mellitus", "icd10": "E11.9", "status": "active", "diagnosed_date": "2018-05-10", "notes": "Target HbA1c < 7.0%. Monitored quarterly."},
            {"id": "cond-2", "name": "Essential Hypertension", "icd10": "I10", "status": "active", "diagnosed_date": "2016-11-04", "notes": "Well-managed with ACE inhibitor therapy. Target BP < 130/80 mmHg."},
            {"id": "cond-3", "name": "Chronic Kidney Disease Stage 2", "icd10": "N18.2", "status": "managed", "diagnosed_date": "2021-03-18", "notes": "Mildly reduced eGFR (68 mL/min/1.73m2). Microalbuminuria screened biannually."}
        ]'::jsonb,
        preferences = '{"language": "en", "explanation_depth": "balanced", "notifications_enabled": true}'::jsonb
    WHERE user_id = target_user_id;

    -- Seed Doctor
    INSERT INTO public.doctors (id, user_id, name, specialty, clinic_name, phone, email, notes)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', target_user_id, 'Dr. Catherine Wei, MD', 'Endocrinology & Internal Medicine', 'Metro Health Specialty Clinics', '+1 (555) 345-6789', 'cwei@metrohealth.org', 'Lead chronic care physician specializing in diabetic microvascular disease prevention.')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Medications
    INSERT INTO public.medications (id, user_id, name, generic_name, strength, dosage, frequency, route, instructions, start_date, prescribing_doctor, related_condition, status)
    VALUES
        ('22222222-2222-2222-2222-222222222221', target_user_id, 'Metformin ER', 'Metformin Hydrochloride', '1000mg', '1 tablet', 'Twice daily with meals', 'Oral', 'Take with breakfast and dinner. Do not crush.', '2018-05-15', 'Dr. Catherine Wei, MD', 'Type 2 Diabetes', 'active'),
        ('22222222-2222-2222-2222-222222222222', target_user_id, 'Lisinopril', 'Lisinopril', '20mg', '1 tablet', 'Once daily in the morning', 'Oral', 'Monitor blood pressure weekly. Renoprotective indication.', '2016-11-10', 'Dr. Catherine Wei, MD', 'Essential Hypertension', 'active'),
        ('22222222-2222-2222-2222-222222222223', target_user_id, 'Atorvastatin', 'Atorvastatin Calcium', '20mg', '1 tablet', 'Once daily at bedtime', 'Oral', 'For ASCVD cardiovascular risk reduction.', '2019-02-01', 'Dr. Catherine Wei, MD', 'Cardiovascular Prevention', 'active'),
        ('22222222-2222-2222-2222-222222222224', target_user_id, 'Jardiance', 'Empagliflozin', '10mg', '1 tablet', 'Once daily in morning', 'Oral', 'SGLT2 inhibitor for dual cardio-renal and glycemic benefit.', '2022-08-14', 'Dr. Catherine Wei, MD', 'Type 2 Diabetes & CKD', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Health Metrics
    INSERT INTO public.health_metrics (user_id, metric_type, value_primary, value_secondary, unit, context, reference_low, reference_high, is_abnormal, recorded_at, notes)
    VALUES
        (target_user_id, 'glucose', 118, NULL, 'mg/dL', 'fasting', 70, 130, false, NOW() - INTERVAL '1 day', 'Fasting fingerstick reading on target.'),
        (target_user_id, 'blood_pressure', 120, 78, 'mmHg', 'resting', 90, 130, false, NOW() - INTERVAL '1 day', 'Resting seated blood pressure.'),
        (target_user_id, 'hba1c', 6.8, NULL, '%', 'random', 4.0, 7.0, false, NOW() - INTERVAL '14 days', 'Official Quest Diagnostic lab panel result.');

    -- Seed Appointments
    INSERT INTO public.appointments (id, user_id, doctor_id, doctor_name, specialty, clinic_or_hospital, appointment_date, appointment_time, reason, status, preparation_questions)
    VALUES
        ('33333333-3333-3333-3333-333333333331', target_user_id, '11111111-1111-1111-1111-111111111111', 'Dr. Catherine Wei, MD', 'Endocrinology', 'Metro Center - Suite 400', CURRENT_DATE + INTERVAL '19 days', '10:30 AM', 'Quarterly Diabetes & Renal Assessment', 'upcoming', ARRAY['Has morning fasting glucose remained under 125 mg/dL?', 'Any lightheadedness upon standing with Lisinopril?', 'Are foot sensory checks unremarkable?'])
    ON CONFLICT (id) DO NOTHING;

    -- Seed Notification
    INSERT INTO public.clinical_notifications (user_id, type, title, message, severity, source_trigger, link_href, link_label)
    VALUES
        (target_user_id, 'care_insight', 'Glycemic Target Maintained', 'Your latest HbA1c of 6.8% is within optimal range. Cardiovascular risk score reduced by 2.1%.', 'success', 'Lab Analytics Engine', '/metrics', 'View Metrics');
END;
$$;
