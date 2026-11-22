-- ==============================================================================
-- ChronicAI Doctor Portal - Staging Seed Script
-- File: backend/db/seed_staging_doctor_portal.sql
--
-- Safety Guard: REFUSES to run unless `app.allow_seed = 'on'`.
-- Usage:
--   PGOPTIONS="-c app.allow_seed=on" psql -d <staging_db> -f backend/db/seed_staging_doctor_portal.sql
--
-- Contents:
--   * 1 Clinic: "Dhaka Central Specialized Clinic" (Code: DHK-SPEC-01)
--   * 2 Verified Doctors:
--       - Dr. Tariqul Islam (BMDC: A-65432, Cardiology)
--       - Dr. Farhana Chowdhury (BMDC: A-81234, Endocrinology & Diabetology)
--   * 1 Assistant:
--       - Shamim Reza (Assistant desk staff at DHK-SPEC-01)
--   * 5 Synthetic Patients (Realistic, clearly fake data):
--       1. "Synthetic Patient Anisur Rahman" (CA-ANIS-9102, HTN + CKD Stage 2)
--       2. "Synthetic Patient Bilkis Banu" (CA-BILK-3341, T2D + Neuropathy)
--       3. "Synthetic Patient Chanchal Das" (CA-CHAN-8715, Bronchial Asthma)
--       4. "Synthetic Patient Dilruba Yasmin" (CA-DILR-4429, Dyslipidemia + CAD)
--       5. "Synthetic Patient Enamul Huq" (CA-ENAM-5510, Severe HTN + Metabolic Syndrome)
--   * Active Access Grants, Queue Visit Tokens, and Baseline Metrics
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    -- Clinic UUID
    v_clinic_id UUID := 'c0000000-0000-4000-8000-000000000001'::UUID;

    -- Doctors & Staff UUIDs (auth.users)
    v_doc1_uid UUID := 'd0000000-0000-4000-8000-000000000001'::UUID;
    v_doc2_uid UUID := 'd0000000-0000-4000-8000-000000000002'::UUID;
    v_asst_uid UUID := 'e0000000-0000-4000-8000-000000000001'::UUID;

    -- Doctor profile UUIDs
    v_doc1_pid UUID := 'f0000000-0000-4000-8000-000000000001'::UUID;
    v_doc2_pid UUID := 'f0000000-0000-4000-8000-000000000002'::UUID;

    -- 5 Synthetic Patients (auth.users)
    v_p1_uid UUID := 'a0000000-0000-4000-8000-000000000001'::UUID;
    v_p2_uid UUID := 'a0000000-0000-4000-8000-000000000002'::UUID;
    v_p3_uid UUID := 'a0000000-0000-4000-8000-000000000003'::UUID;
    v_p4_uid UUID := 'a0000000-0000-4000-8000-000000000004'::UUID;
    v_p5_uid UUID := 'a0000000-0000-4000-8000-000000000005'::UUID;
BEGIN
    RAISE NOTICE 'Starting staging seed for ChronicAI Doctor Portal...';

    -- 1. Insert auth.users
    INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
      (v_doc1_uid, 'dr.tariqul.fake@chronicai.test', '{"full_name":"Dr. Tariqul Islam"}'),
      (v_doc2_uid, 'dr.farhana.fake@chronicai.test', '{"full_name":"Dr. Farhana Chowdhury"}'),
      (v_asst_uid, 'shamim.asst.fake@chronicai.test', '{"full_name":"Shamim Reza"}'),
      (v_p1_uid, 'anisur.fake@chronicai.test', '{"full_name":"Synthetic Patient Anisur Rahman"}'),
      (v_p2_uid, 'bilkis.fake@chronicai.test', '{"full_name":"Synthetic Patient Bilkis Banu"}'),
      (v_p3_uid, 'chanchal.fake@chronicai.test', '{"full_name":"Synthetic Patient Chanchal Das"}'),
      (v_p4_uid, 'dilruba.fake@chronicai.test', '{"full_name":"Synthetic Patient Dilruba Yasmin"}'),
      (v_p5_uid, 'enamul.fake@chronicai.test', '{"full_name":"Synthetic Patient Enamul Huq"}')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Clinic (1 clinic)
    INSERT INTO public.clinics (id, name, code, address, phone, timezone)
    VALUES (
      v_clinic_id,
      'Dhaka Central Specialized Clinic',
      'DHK-SPEC-01',
      'Road 7, Dhanmondi R/A, Dhaka',
      '+8801700999001',
      'Asia/Dhaka'
    ) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- 3. Verified Doctors (2 doctors)
    INSERT INTO public.doctor_profiles (
      id, user_id, full_name, bmdc_number, specialty, qualifications,
      chamber_info, verification_status, is_active, verified_at
    ) VALUES
      (
        v_doc1_pid,
        v_doc1_uid,
        'Dr. Tariqul Islam',
        'A-65432',
        'Cardiology',
        'MBBS, FCPS (Medicine), MD (Cardiology)',
        '{"room": "Room 302", "visiting_hours": "5:00 PM - 9:00 PM", "days": ["Saturday", "Monday", "Wednesday"]}'::jsonb,
        'verified',
        true,
        now()
      ),
      (
        v_doc2_pid,
        v_doc2_uid,
        'Dr. Farhana Chowdhury',
        'A-81234',
        'Endocrinology & Diabetology',
        'MBBS, DEM (BIRDEM), MRCP (UK)',
        '{"room": "Room 305", "visiting_hours": "6:00 PM - 10:00 PM", "days": ["Sunday", "Tuesday", "Thursday"]}'::jsonb,
        'verified',
        true,
        now()
      )
    ON CONFLICT (user_id) DO UPDATE SET
      verification_status = 'verified',
      is_active = true,
      verified_at = now();

    -- 4. Clinic Staff Mappings
    INSERT INTO public.clinic_staff (clinic_id, user_id, role, is_active) VALUES
      (v_clinic_id, v_doc1_uid, 'doctor', true),
      (v_clinic_id, v_doc2_uid, 'doctor', true),
      (v_clinic_id, v_asst_uid, 'assistant', true)
    ON CONFLICT (clinic_id, user_id) DO UPDATE SET is_active = true;

    -- 5. Synthetic Patients: Health Profiles & Permanent Identifiers
    -- Patient 1: Anisur (Hypertension + Stage 2 CKD)
    INSERT INTO public.health_profiles (
      user_id, full_name, date_of_birth, sex, blood_group, height_cm, weight_kg,
      allergies, chronic_conditions, preferences
    ) VALUES (
      v_p1_uid,
      'Synthetic Patient Anisur Rahman',
      '1972-04-12',
      'male',
      'B+',
      172,
      76,
      '[{"substance": "Penicillin", "reaction": "Urticaria / Angioedema", "severity": "severe"}]'::jsonb,
      '[{"name": "Essential Hypertension", "status": "active"}, {"name": "Chronic Kidney Disease Stage 2", "status": "active"}]'::jsonb,
      '{"language": "en", "explanation_depth": "balanced"}'::jsonb
    ) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
    VALUES (v_p1_uid, 'CA-ANIS-9102', 'fake_qr_anisur_9102')
    ON CONFLICT (user_id) DO UPDATE SET patient_code = 'CA-ANIS-9102';

    -- Patient 2: Bilkis (Type 2 Diabetes + Diabetic Neuropathy)
    INSERT INTO public.health_profiles (
      user_id, full_name, date_of_birth, sex, blood_group, height_cm, weight_kg,
      allergies, chronic_conditions, preferences
    ) VALUES (
      v_p2_uid,
      'Synthetic Patient Bilkis Banu',
      '1965-09-24',
      'female',
      'O+',
      158,
      82,
      '[{"substance": "Sulfa drugs", "reaction": "Skin rash & wheezing", "severity": "severe"}]'::jsonb,
      '[{"name": "Type 2 Diabetes Mellitus", "status": "active"}, {"name": "Diabetic Peripheral Neuropathy", "status": "active"}]'::jsonb,
      '{"language": "bn", "explanation_depth": "simple"}'::jsonb
    ) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
    VALUES (v_p2_uid, 'CA-BILK-3341', 'fake_qr_bilkis_3341')
    ON CONFLICT (user_id) DO UPDATE SET patient_code = 'CA-BILK-3341';

    -- Patient 3: Chanchal (Asthma)
    INSERT INTO public.health_profiles (
      user_id, full_name, date_of_birth, sex, blood_group, height_cm, weight_kg,
      allergies, chronic_conditions, preferences
    ) VALUES (
      v_p3_uid,
      'Synthetic Patient Chanchal Das',
      '1988-12-03',
      'male',
      'A+',
      178,
      71,
      '[{"substance": "Aspirin", "reaction": "Bronchospasm", "severity": "severe"}]'::jsonb,
      '[{"name": "Bronchial Asthma", "status": "active"}]'::jsonb,
      '{"language": "en", "explanation_depth": "balanced"}'::jsonb
    ) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
    VALUES (v_p3_uid, 'CA-CHAN-8715', 'fake_qr_chanchal_8715')
    ON CONFLICT (user_id) DO UPDATE SET patient_code = 'CA-CHAN-8715';

    -- Patient 4: Dilruba (Dyslipidemia + CAD)
    INSERT INTO public.health_profiles (
      user_id, full_name, date_of_birth, sex, blood_group, height_cm, weight_kg,
      allergies, chronic_conditions, preferences
    ) VALUES (
      v_p4_uid,
      'Synthetic Patient Dilruba Yasmin',
      '1979-07-19',
      'female',
      'AB+',
      160,
      68,
      '[]'::jsonb,
      '[{"name": "Hypercholesterolemia", "status": "active"}, {"name": "Coronary Artery Disease", "status": "managed"}]'::jsonb,
      '{"language": "en", "explanation_depth": "detailed"}'::jsonb
    ) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
    VALUES (v_p4_uid, 'CA-DILR-4429', 'fake_qr_dilruba_4429')
    ON CONFLICT (user_id) DO UPDATE SET patient_code = 'CA-DILR-4429';

    -- Patient 5: Enamul (Severe HTN + Obesity)
    INSERT INTO public.health_profiles (
      user_id, full_name, date_of_birth, sex, blood_group, height_cm, weight_kg,
      allergies, chronic_conditions, preferences
    ) VALUES (
      v_p5_uid,
      'Synthetic Patient Enamul Huq',
      '1970-01-15',
      'male',
      'O-',
      169,
      94,
      '[]'::jsonb,
      '[{"name": "Refractory Hypertension", "status": "active"}, {"name": "Metabolic Syndrome", "status": "active"}]'::jsonb,
      '{"language": "bn", "explanation_depth": "balanced"}'::jsonb
    ) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.patient_identifiers (user_id, patient_code, qr_token)
    VALUES (v_p5_uid, 'CA-ENAM-5510', 'fake_qr_enamul_5510')
    ON CONFLICT (user_id) DO UPDATE SET patient_code = 'CA-ENAM-5510';

    -- 6. Clinical Data for Pre-Visit Brief Testing
    -- Patient 1 records
    INSERT INTO public.medications (user_id, name, generic_name, strength, dosage, frequency, status, prescribing_doctor) VALUES
      (v_p1_uid, 'Olmesartan', 'Olmesartan medoxomil', '20mg', '1 tablet', '1-0-0', 'active', 'Dr. Tariqul Islam'),
      (v_p1_uid, 'Amlodipine', 'Amlodipine besylate', '5mg', '1 tablet', '0-0-1', 'active', 'Dr. Tariqul Islam');
    INSERT INTO public.health_metrics (user_id, metric_type, value_primary, value_secondary, unit, is_abnormal, notes, recorded_at) VALUES
      (v_p1_uid, 'blood_pressure', 148, 94, 'mmHg', true, 'Office BP check', now() - interval '2 days'),
      (v_p1_uid, 'other', 1.45, NULL, 'mg/dL', true, 'Serum Creatinine (Ref: 0.7 - 1.2)', now() - interval '5 days');

    -- Patient 2 records
    INSERT INTO public.medications (user_id, name, generic_name, strength, dosage, frequency, status, prescribing_doctor) VALUES
      (v_p2_uid, 'Metformin XR', 'Metformin HCl', '1000mg', '1 tablet', '1-0-1', 'active', 'Dr. Farhana Chowdhury'),
      (v_p2_uid, 'Empagliflozin', 'Empagliflozin', '10mg', '1 tablet', '1-0-0', 'active', 'Dr. Farhana Chowdhury'),
      (v_p2_uid, 'Pregabalin', 'Pregabalin', '50mg', '1 capsule', '0-0-1', 'active', 'Dr. Farhana Chowdhury');
    INSERT INTO public.health_metrics (user_id, metric_type, value_primary, unit, is_abnormal, notes, recorded_at) VALUES
      (v_p2_uid, 'hba1c', 8.6, '%', true, 'HbA1c Lab test', now() - interval '3 days'),
      (v_p2_uid, 'glucose', 178, 'mg/dL', true, 'Fasting Blood Sugar', now() - interval '1 day');

    -- Patient 3 records
    INSERT INTO public.medications (user_id, name, generic_name, strength, dosage, frequency, status, prescribing_doctor) VALUES
      (v_p3_uid, 'Salmeterol/Fluticasone Inhaler', 'Salmeterol + Fluticasone', '25/250 mcg', '2 puffs', '1-0-1', 'active', 'Dr. Tariqul Islam');

    -- Patient 4 records
    INSERT INTO public.medications (user_id, name, generic_name, strength, dosage, frequency, status, prescribing_doctor) VALUES
      (v_p4_uid, 'Rosuvastatin', 'Rosuvastatin', '20mg', '1 tablet', '0-0-1', 'active', 'Dr. Tariqul Islam'),
      (v_p4_uid, 'Clopidogrel', 'Clopidogrel', '75mg', '1 tablet', '0-1-0', 'active', 'Dr. Tariqul Islam');

    -- Patient 5 records
    INSERT INTO public.medications (user_id, name, generic_name, strength, dosage, frequency, status, prescribing_doctor) VALUES
      (v_p5_uid, 'Bisoprolol', 'Bisoprolol fumarate', '5mg', '1 tablet', '1-0-0', 'active', 'Dr. Tariqul Islam'),
      (v_p5_uid, 'Telmisartan', 'Telmisartan', '40mg', '1 tablet', '1-0-0', 'active', 'Dr. Tariqul Islam');

    -- 7. Active Grants
    -- Patient 1 & Patient 2 grant Dr. Tariqul Islam access
    INSERT INTO public.access_grants (patient_id, doctor_id, scope, expires_at) VALUES
      (v_p1_uid, v_doc1_pid, ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations'], now() + interval '30 days'),
      (v_p2_uid, v_doc1_pid, ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations'], now() + interval '14 days')
    ON CONFLICT DO NOTHING;

    -- Patient 2 grants Dr. Farhana Chowdhury access
    INSERT INTO public.access_grants (patient_id, doctor_id, scope, expires_at) VALUES
      (v_p2_uid, v_doc2_pid, ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations'], now() + interval '60 days')
    ON CONFLICT DO NOTHING;

    -- 8. Today's Queue Visit Tokens for Dr. Tariqul Islam (Clinic 1)
    INSERT INTO public.visit_tokens (
      clinic_id, doctor_id, patient_id, serial_number, visit_date, status, priority, triage
    ) VALUES
      (
        v_clinic_id, v_doc1_pid, v_p1_uid, 1, CURRENT_DATE, 'waiting', 'urgent',
        '{"bp":"148/94", "pulse":82, "spo2":98, "temp":"98.4 F", "weight_kg":76, "chief_complaint":"Occasional palpitations & headache"}'::jsonb
      ),
      (
        v_clinic_id, v_doc1_pid, v_p2_uid, 2, CURRENT_DATE, 'waiting', 'normal',
        '{"bp":"134/82", "pulse":76, "spo2":99, "temp":"98.2 F", "weight_kg":82, "chief_complaint":"Routine diabetic check & review"}'::jsonb
      )
    ON CONFLICT (clinic_id, doctor_id, visit_date, serial_number) DO NOTHING;

    RAISE NOTICE 'Staging seed completed successfully with 1 clinic, 2 verified doctors, 1 assistant, and 5 synthetic patients.';
END $$;

COMMIT;
