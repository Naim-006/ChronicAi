-- ==============================================================================
-- Doctor Portal RLS / consent security test suite
-- Every assertion runs as the `authenticated` (or `anon`) ROLE with a JWT `sub`,
-- exactly like PostgREST does, NOT as superuser (superuser bypasses RLS).
--
-- RUN (throwaway database ONLY - this script TRUNCATEs auth.users):
--   PGOPTIONS="-c app.allow_destructive_test=on" psql -d <testdb> -v ON_ERROR_STOP=1 \
--       -f backend/db/tests/test_rls_doctor_portal_secure.sql
-- Prereq: all migrations applied (incl. 20261121010000_doctor_portal_phase1_secure.sql).
-- Needs Supabase-style roles anon/authenticated/service_role and auth.uid().
-- ==============================================================================
\set ON_ERROR_STOP on
\o /dev/null

DO $$ BEGIN
  IF coalesce(current_setting('app.allow_destructive_test', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'Refusing to run: set PGOPTIONS="-c app.allow_destructive_test=on" and use a THROWAWAY database.';
  END IF;
END $$;

-- ---------- harness -------------------------------------------------------------
DROP SCHEMA IF EXISTS t CASCADE;
CREATE SCHEMA t;
CREATE TABLE t.results (n serial PRIMARY KEY, name text, passed boolean, detail text);
GRANT USAGE ON SCHEMA t TO authenticated, anon;

CREATE FUNCTION t.rec(p_name text, p_ok boolean, p_detail text) RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$ INSERT INTO t.results(name, passed, detail) VALUES (p_name, p_ok, p_detail) $$;

CREATE FUNCTION t.login(p uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, false);
  SET ROLE authenticated;
END $$;

CREATE FUNCTION t.login_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', false);
  SET ROLE anon;
END $$;

CREATE FUNCTION t.logout() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', false);
END $$;

-- rows of a table owned by uid that the CURRENT role can see
CREATE FUNCTION t.vis(p_tbl text, p_col text, p_uid uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s WHERE %I = %L', p_tbl, p_col, p_uid) INTO n;
  RETURN n;
END $$;

CREATE FUNCTION t.cnt(p_sql text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE 'SELECT count(*) FROM (' || p_sql || ') s' INTO n;
  RETURN n;
END $$;

CREATE FUNCTION t.eq(p_name text, p_actual anyelement, p_expected anyelement) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM t.rec(p_name, p_actual IS NOT DISTINCT FROM p_expected,
                'actual=' || coalesce(p_actual::text, 'NULL') || ' expected=' || coalesce(p_expected::text, 'NULL'));
END $$;

CREATE FUNCTION t.gt0(p_name text, p_actual bigint) RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM t.rec(p_name, p_actual > 0, 'actual=' || p_actual); END $$;

-- statement must RAISE an error (permission denied / RLS violation / exception)
CREATE FUNCTION t.err(p_name text, p_stmt text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_stmt;
    PERFORM t.rec(p_name, false, 'NO ERROR - attack succeeded');
  EXCEPTION WHEN OTHERS THEN
    PERFORM t.rec(p_name, true, sqlstate || ' ' || left(sqlerrm, 90));
  END;
END $$;

-- statement must run but affect exactly N rows (RLS silently filters UPDATE/DELETE)
CREATE FUNCTION t.rows(p_name text, p_stmt text, p_expected int) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  EXECUTE p_stmt;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.rec(p_name, n = p_expected, 'rows=' || n || ' expected=' || p_expected);
EXCEPTION WHEN OTHERS THEN
  PERFORM t.rec(p_name, false, 'ERROR ' || sqlstate || ' ' || left(sqlerrm, 90));
END $$;

-- statement must succeed
CREATE FUNCTION t.ok(p_name text, p_stmt text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_stmt;
  PERFORM t.rec(p_name, true, 'ok');
EXCEPTION WHEN OTHERS THEN
  PERFORM t.rec(p_name, false, 'ERROR ' || sqlstate || ' ' || left(sqlerrm, 90));
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA t TO authenticated;

-- ---------- fixtures (as superuser) ----------------------------------------------
TRUNCATE auth.users, public.clinics, storage.objects CASCADE;

-- patients A,B ; doctors D1(verified) D2(pending) D3(verified, suspended later) D4(verified, clinic Y);
-- assistants AS1 (clinic X) AS2 (clinic Y)
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('a0000000-0000-0000-0000-000000000001', 'pa@example.invalid', '{"full_name":"Patient A"}'),
 ('a0000000-0000-0000-0000-000000000002', 'pb@example.invalid', '{"full_name":"Patient B"}'),
 ('d0000000-0000-0000-0000-000000000001', 'd1@example.invalid', '{"full_name":"Doctor One"}'),
 ('d0000000-0000-0000-0000-000000000002', 'd2@example.invalid', '{"full_name":"Doctor Two"}'),
 ('d0000000-0000-0000-0000-000000000003', 'd3@example.invalid', '{"full_name":"Doctor Three"}'),
 ('d0000000-0000-0000-0000-000000000004', 'd4@example.invalid', '{"full_name":"Doctor Four"}'),
 ('e0000000-0000-0000-0000-000000000001', 'as1@example.invalid', '{"full_name":"Assistant X"}'),
 ('e0000000-0000-0000-0000-000000000002', 'as2@example.invalid', '{"full_name":"Assistant Y"}');

INSERT INTO public.doctor_profiles(id, user_id, full_name, bmdc_number, specialty, verification_status, verified_at) VALUES
 ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Doctor One',   'T-0001', 'Cardiology', 'verified', now()),
 ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Doctor Three', 'T-0003', 'Nephrology', 'verified', now()),
 ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Doctor Four',  'T-0004', 'Dermatology', 'verified', now());
-- D2 self-registers through the API role below (must land as 'pending')

INSERT INTO public.clinics(id, name, code) VALUES
 ('c0000000-0000-0000-0000-00000000000a', 'Clinic X', 'CLX'),
 ('c0000000-0000-0000-0000-00000000000b', 'Clinic Y', 'CLY');
INSERT INTO public.clinic_staff(clinic_id, user_id, role) VALUES
 ('c0000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-000000000001', 'doctor'),
 ('c0000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-000000000003', 'doctor'),
 ('c0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-000000000001', 'assistant'),
 ('c0000000-0000-0000-0000-00000000000b', 'd0000000-0000-0000-0000-000000000004', 'doctor'),
 ('c0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-000000000002', 'assistant');

-- clinical data for both patients
DO $$
DECLARE u uuid; d uuid; m uuid; c uuid;
BEGIN
  FOREACH u IN ARRAY ARRAY['a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid] LOOP
    UPDATE public.health_profiles SET allergies = '[{"substance":"Penicillin"}]', emergency_contact = '{"name":"Secret Contact","phone":"01700000000"}',
           preferences = '{"language":"bn"}' WHERE user_id = u;
    INSERT INTO public.medical_documents(user_id, file_name, file_path, category) VALUES (u, 'lab.pdf', u || '/lab.pdf', 'lab_report') RETURNING id INTO d;
    INSERT INTO storage.objects(bucket_id, name, owner) VALUES ('medical-records', u || '/lab.pdf', u);
    INSERT INTO public.extracted_records(document_id, user_id) VALUES (d, u);
    INSERT INTO public.timeline_events(user_id, event_type, title, event_date) VALUES (u, 'visit', 'Visit', CURRENT_DATE);
    INSERT INTO public.medications(user_id, name, dosage, frequency) VALUES (u, 'Metformin', '500mg', 'BD') RETURNING id INTO m;
    INSERT INTO public.medication_logs(medication_id, user_id, status) VALUES (m, u, 'taken');
    INSERT INTO public.health_metrics(user_id, metric_type, value_primary, unit) VALUES (u, 'glucose', 7.1, 'mmol/L');
    INSERT INTO public.ai_conversations(user_id) VALUES (u) RETURNING id INTO c;
    INSERT INTO public.ai_messages(conversation_id, user_id, role, content) VALUES (c, u, 'user', 'private chat');
    INSERT INTO public.document_embeddings(document_id, user_id, chunk_index, chunk_content, embedding) VALUES (d, u, 0, 'chunk', ARRAY[0.1]::float8[]);
    INSERT INTO public.appointments(user_id, doctor_name, specialty, clinic_or_hospital, appointment_date, appointment_time, reason)
      VALUES (u, 'Dr X', 'Cardio', 'City', CURRENT_DATE, '10:00', 'checkup');
    INSERT INTO public.doctors(user_id, name, specialty) VALUES (u, 'Personal Dr', 'GP');
    INSERT INTO public.clinical_notifications(user_id, type, title, message, source_trigger) VALUES (u, 'care_insight', 't', 'm', 'seed');
  END LOOP;
END $$;
-- the two patients' codes (patients generate their own via the RPC, as in the app)
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT * FROM public.ensure_patient_identifier();
SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT * FROM public.ensure_patient_identifier();
SELECT t.logout();

-- ============================================================================
-- T0  NEGATIVE CONTROL: prove RLS is really being evaluated by this harness
-- ============================================================================
SELECT t.gt0('T0 control: superuser sees patient A docs (RLS bypassed)', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T0 control: current_user is authenticated, not superuser', current_user::text, 'authenticated');
SELECT t.eq('T0 control: same query as authenticated doctor, NO grant -> 0', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);

-- ============================================================================
-- T1  NO GRANT -> 0 rows on every patient-owned table (doctor D1, verified)
-- ============================================================================
SELECT t.eq('T1 no grant: ' || x.tbl, t.vis('public.' || x.tbl, x.col, 'a0000000-0000-0000-0000-000000000001'), 0::bigint)
FROM (VALUES ('health_profiles','user_id'), ('medical_documents','user_id'), ('extracted_records','user_id'),
             ('timeline_events','user_id'), ('medications','user_id'), ('medication_logs','user_id'),
             ('health_metrics','user_id'), ('ai_conversations','user_id'), ('ai_messages','user_id'),
             ('document_embeddings','user_id'), ('appointments','user_id'), ('doctors','user_id'),
             ('clinical_notifications','user_id'), ('patient_identifiers','user_id'),
             ('consultations','patient_id'), ('prescriptions','patient_id'), ('follow_ups','patient_id'),
             ('access_grants','patient_id'), ('access_requests','patient_id')) AS x(tbl, col);
SELECT t.eq('T1 no grant: storage.objects of patient A', t.cnt($q$SELECT 1 FROM storage.objects WHERE name LIKE 'a0000000-0000-0000-0000-000000000001/%'$q$), 0::bigint);

-- ============================================================================
-- T2  CONSENT FLOW via RPC (D1 -> request; patient A approves a SCOPED grant)
-- ============================================================================
-- valid code vs garbage code: identical response
SELECT t.logout();
SELECT t.login('a0000000-0000-0000-0000-000000000001');
CREATE TEMP TABLE code_a AS SELECT patient_code FROM public.patient_identifiers WHERE user_id = 'a0000000-0000-0000-0000-000000000001';
GRANT SELECT ON code_a TO authenticated;
SELECT t.login('a0000000-0000-0000-0000-000000000002');
CREATE TEMP TABLE code_b AS SELECT patient_code FROM public.patient_identifiers WHERE user_id = 'a0000000-0000-0000-0000-000000000002';
GRANT SELECT ON code_b TO authenticated;

SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T2 request w/ VALID code -> generic response', (SELECT public.request_access_by_code((SELECT patient_code FROM code_a))::text), '{"status": "submitted"}');
SELECT t.eq('T2 request w/ INVALID code -> identical response', (SELECT public.request_access_by_code('CA-ZZZZ-ZZZZ')::text), '{"status": "submitted"}');
SELECT t.eq('T2 request w/ malformed code -> identical response', (SELECT public.request_access_by_code('hello')::text), '{"status": "submitted"}');
SELECT t.eq('T2 doctor request list: valid+invalid+malformed all look identical (pending)', t.cnt($q$SELECT 1 FROM public.doctor_list_access_requests() WHERE status='pending' AND patient_ref IS NULL AND patient_name IS NULL$q$), 3::bigint);
SELECT t.eq('T2 still no data before approval: documents', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T2 doctor cannot SELECT access_requests table directly', t.cnt('SELECT 1 FROM public.access_requests'), 0::bigint);

SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.eq('T2 patient A sees exactly 1 pending request (decoys invisible)', t.cnt($q$SELECT 1 FROM public.access_requests WHERE status='pending'$q$), 1::bigint);
SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT t.eq('T2 patient B sees 0 requests (not addressed to B)', t.cnt('SELECT 1 FROM public.access_requests'), 0::bigint);
SELECT t.err('T2 patient B cannot approve A''s request', $q$SELECT public.respond_access_request((SELECT id FROM (SELECT id FROM public.access_requests) x LIMIT 1), true)$q$);

SELECT t.logout();
CREATE TEMP TABLE req1 AS SELECT id FROM public.access_requests WHERE patient_id = 'a0000000-0000-0000-0000-000000000001' AND status = 'pending';
GRANT SELECT ON req1 TO authenticated;

SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.err('T2 DOCTOR cannot approve a request (RPC requires being the patient)', $q$SELECT public.respond_access_request((SELECT id FROM req1), true)$q$);

SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.err('T2 invalid scope rejected', $q$SELECT public.respond_access_request((SELECT id FROM req1), true, ARRAY['everything'], now() + interval '7 days')$q$);
SELECT t.err('T2 expiry > 365d rejected', $q$SELECT public.respond_access_request((SELECT id FROM req1), true, ARRAY['documents'], now() + interval '400 days')$q$);
SELECT t.err('T2 expiry in the past rejected', $q$SELECT public.respond_access_request((SELECT id FROM req1), true, ARRAY['documents'], now() - interval '1 day')$q$);
SELECT t.ok('T2 patient A approves scope {documents,timeline,medications,metrics} for 7d',
            $q$SELECT public.respond_access_request((SELECT id FROM req1), true, ARRAY['documents','timeline','medications','metrics'], now() + interval '7 days')$q$);
SELECT t.err('T2 same request cannot be approved twice', $q$SELECT public.respond_access_request((SELECT id FROM req1), true)$q$);

-- ============================================================================
-- T3  ACTIVE GRANT: only in-scope categories; nothing else
-- ============================================================================
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.gt0('T3 in scope  documents',        t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.gt0('T3 in scope  extracted_records (documents)', t.vis('public.extracted_records','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.gt0('T3 in scope  timeline',         t.vis('public.timeline_events','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.gt0('T3 in scope  medications',      t.vis('public.medications','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.gt0('T3 in scope  metrics',          t.vis('public.health_metrics','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.eq('T3 OUT of scope adherence (medication_logs) -> 0', t.vis('public.medication_logs','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 health_profiles raw table stays closed even with grant', t.vis('public.health_profiles','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.err('T3 snapshot RPC denied without profile scope', $q$SELECT * FROM public.doctor_get_patient_snapshot('a0000000-0000-0000-0000-000000000001')$q$);
SELECT t.eq('T3 ai_conversations -> 0 even with grant', t.vis('public.ai_conversations','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 ai_messages -> 0 even with grant', t.vis('public.ai_messages','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 document_embeddings -> 0 even with grant', t.vis('public.document_embeddings','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 appointments -> 0', t.vis('public.appointments','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 patient''s personal doctors list -> 0', t.vis('public.doctors','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 clinical_notifications -> 0', t.vis('public.clinical_notifications','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 patient_identifiers (codes) -> 0', t.cnt('SELECT 1 FROM public.patient_identifiers'), 0::bigint);
SELECT t.eq('T3 storage.objects: no direct file access even with grant', t.cnt($q$SELECT 1 FROM storage.objects WHERE name LIKE 'a0000000-0000-0000-0000-000000000001/%'$q$), 0::bigint);
SELECT t.eq('T3 Doctor A cannot read Patient B (no grant) documents', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000002'), 0::bigint);
SELECT t.eq('T3 Doctor A cannot read Patient B metrics', t.vis('public.health_metrics','user_id','a0000000-0000-0000-0000-000000000002'), 0::bigint);

-- document download contract
SELECT t.ok('T3 doctor_authorize_document_download OK for granted patient''s doc',
            $q$SELECT * FROM public.doctor_authorize_document_download((SELECT id FROM public.medical_documents WHERE user_id='a0000000-0000-0000-0000-000000000001' LIMIT 1))$q$);
SELECT t.logout();
CREATE TEMP TABLE docb AS SELECT id FROM public.medical_documents WHERE user_id = 'a0000000-0000-0000-0000-000000000002' LIMIT 1;
GRANT SELECT ON docb TO authenticated;
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.err('T3 download denied for ungranted patient B doc', $q$SELECT * FROM public.doctor_authorize_document_download((SELECT id FROM docb))$q$);

-- another doctor cannot use D1's grant
SELECT t.login('d0000000-0000-0000-0000-000000000004');
SELECT t.eq('T3 Doctor 4 cannot use Doctor 1''s grant: documents', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T3 Doctor 4 cannot see Doctor 1''s grants', t.cnt('SELECT 1 FROM public.access_grants'), 0::bigint);

-- ============================================================================
-- T4  ATTACKS by a verified doctor (all must FAIL)
-- ============================================================================
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.err('T4 insert own grant', $q$INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001',ARRAY['documents'], now()+interval '1 day')$q$);
SELECT t.err('T4 extend own grant (UPDATE expires_at)', $q$UPDATE public.access_grants SET expires_at = now() + interval '300 days'$q$);
SELECT t.err('T4 widen own grant scope (UPDATE scope)', $q$UPDATE public.access_grants SET scope = ARRAY['profile','documents','timeline','medications','adherence','metrics','consultations']$q$);
SELECT t.err('T4 un-revoke / edit grant (UPDATE revoked_at)', $q$UPDATE public.access_grants SET revoked_at = NULL$q$);
SELECT t.err('T4 delete grant', $q$DELETE FROM public.access_grants$q$);
SELECT t.err('T4 insert access_request directly (skip RPC)', $q$INSERT INTO public.access_requests(patient_id, doctor_id) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001')$q$);
SELECT t.err('T4 approve own request (UPDATE status)', $q$UPDATE public.access_requests SET status='approved'$q$);
SELECT t.err('T4 write patient_summaries directly', $q$INSERT INTO public.patient_summaries(patient_id, doctor_id) VALUES ('a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001')$q$);
SELECT t.err('T4 insert patient_identifiers (forge code)', $q$INSERT INTO public.patient_identifiers(user_id, patient_code, qr_token) VALUES ('d0000000-0000-0000-0000-000000000001','CA-AAAA-AAAA','x')$q$);
SELECT t.err('T4 read lookup_attempts', $q$SELECT 1 FROM public.lookup_attempts$q$);
SELECT t.err('T4 call internal _audit()', $q$SELECT public._audit('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','x','x',NULL)$q$);
SELECT t.err('T4 call internal _lookup_rate_ok()', $q$SELECT public._lookup_rate_ok('d0000000-0000-0000-0000-000000000001','x')$q$);
SELECT t.err('T4 write medications of patient A (read-only grant)', $q$INSERT INTO public.medications(user_id,name,dosage,frequency) VALUES ('a0000000-0000-0000-0000-000000000001','Evil','1g','QD')$q$);
SELECT t.rows('T4 UPDATE patient A medications -> 0 rows', $q$UPDATE public.medications SET name='Hacked' WHERE user_id='a0000000-0000-0000-0000-000000000001'$q$, 0);
SELECT t.rows('T4 DELETE patient A documents -> 0 rows', $q$DELETE FROM public.medical_documents WHERE user_id='a0000000-0000-0000-0000-000000000001'$q$, 0);
SELECT t.err('T4 insert consultation WITHOUT consultations scope', $q$INSERT INTO public.consultations(patient_id, doctor_id, diagnosis) VALUES ('a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','x')$q$);

-- audit_logs integrity
SELECT t.err('T4 forge audit row against patient B', $q$INSERT INTO public.audit_logs(user_id, patient_id, action, resource_type) VALUES ('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','read','x')$q$);
SELECT t.err('T4 UPDATE audit_logs', $q$UPDATE public.audit_logs SET action = 'nothing'$q$);
SELECT t.err('T4 DELETE audit_logs', $q$DELETE FROM public.audit_logs$q$);
SELECT t.err('T4 TRUNCATE audit_logs', $q$TRUNCATE public.audit_logs$q$);

-- doctor cannot read someone else's request by id
SELECT t.logout();
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.ok('T4 D1 sends request for patient B (for later attack)', $q$SELECT public.request_access_by_code((SELECT patient_code FROM code_b))$q$);
SELECT t.logout();
CREATE TEMP TABLE req_b AS SELECT id FROM public.access_requests WHERE patient_id = 'a0000000-0000-0000-0000-000000000002';
GRANT SELECT ON req_b TO authenticated;
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.err('T4 D1 cannot approve patient B''s request via RPC', $q$SELECT public.respond_access_request((SELECT id FROM req_b), true)$q$);

-- ============================================================================
-- T5  DOCTOR PROFILE: no self-verification
-- ============================================================================
SELECT t.login('d0000000-0000-0000-0000-000000000002');
-- BEFORE INSERT trigger normalizes the claimed status to 'pending' before the WITH CHECK runs,
-- so the attack "succeeds" only in the harmless sense that the row lands as PENDING.
SELECT t.ok('T5 D2 self-registers claiming verification_status=verified', $q$INSERT INTO public.doctor_profiles(user_id, full_name, bmdc_number, specialty, verification_status, is_active) VALUES ('d0000000-0000-0000-0000-000000000002','Doctor Two','T-0002','GP','verified', true)$q$);
SELECT t.eq('T5 ...but the stored row is PENDING (claim ignored)', (SELECT verification_status FROM public.doctor_profiles WHERE user_id='d0000000-0000-0000-0000-000000000002'), 'pending');
SELECT t.err('T5 D2 cannot register a profile for ANOTHER user', $q$INSERT INTO public.doctor_profiles(user_id, full_name, bmdc_number, specialty) VALUES ('d0000000-0000-0000-0000-000000000001','Evil','T-9999','GP')$q$);
SELECT t.rows('T5 D2 tries UPDATE verification_status=verified (row updates but trigger resets)', $q$UPDATE public.doctor_profiles SET verification_status='verified', is_active=true WHERE user_id='d0000000-0000-0000-0000-000000000002'$q$, 1);
SELECT t.eq('T5 D2 is STILL pending', (SELECT verification_status FROM public.doctor_profiles WHERE user_id='d0000000-0000-0000-0000-000000000002'), 'pending');
SELECT t.err('T5 pending doctor cannot request access', $q$SELECT public.request_access_by_code('CA-AAAA-AAAA')$q$);
SELECT t.logout();
SELECT t.eq('T5 (superuser view) D2 stored as pending', (SELECT verification_status FROM public.doctor_profiles WHERE user_id='d0000000-0000-0000-0000-000000000002'), 'pending');

-- ============================================================================
-- T6  UNVERIFIED / SUSPENDED doctors get nothing even WITH a grant row
--     (grant rows inserted as superuser to simulate a stale grant)
-- ============================================================================
INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at)
SELECT 'a0000000-0000-0000-0000-000000000001', id, ARRAY['documents','metrics'], now() + interval '5 days'
FROM public.doctor_profiles WHERE user_id IN ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
SELECT t.login('d0000000-0000-0000-0000-000000000002');
SELECT t.eq('T6 unverified (pending) doctor + grant -> 0 documents', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.login('d0000000-0000-0000-0000-000000000003');
SELECT t.gt0('T6 verified doctor 3 + grant -> sees documents (before suspension)', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.logout();
UPDATE public.doctor_profiles SET verification_status = 'suspended' WHERE user_id = 'd0000000-0000-0000-0000-000000000003';
SELECT t.login('d0000000-0000-0000-0000-000000000003');
SELECT t.eq('T6 suspended doctor loses access IMMEDIATELY', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.logout();
UPDATE public.doctor_profiles SET verification_status = 'verified', is_active = false WHERE user_id = 'd0000000-0000-0000-0000-000000000003';
SELECT t.login('d0000000-0000-0000-0000-000000000003');
SELECT t.eq('T6 deactivated (is_active=false) doctor -> 0', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.logout();

-- ============================================================================
-- T7  EXPIRY and MALFORMED SCOPE
-- ============================================================================
INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at, created_at)
VALUES ('a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', ARRAY['documents','metrics'], now() - interval '1 hour', now() - interval '2 days');
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T7 EXPIRED grant -> 0 rows (patient B documents)', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000002'), 0::bigint);
SELECT t.logout();
SELECT t.err('T7 empty scope rejected by constraint', $q$INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001','{}', now()+interval '1 day')$q$);
SELECT t.err('T7 unknown scope value rejected', $q$INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001',ARRAY['documents','*'], now()+interval '1 day')$q$);
SELECT t.err('T7 scope "all" is NOT a magic value', $q$INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001',ARRAY['all'], now()+interval '1 day')$q$);
SELECT t.err('T7 grant > 366 days rejected', $q$INSERT INTO public.access_grants(patient_id, doctor_id, scope, expires_at) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001',ARRAY['documents'], now()+interval '500 days')$q$);

-- ============================================================================
-- T8  REVOCATION + brief cache purge
-- ============================================================================
INSERT INTO public.patient_summaries(patient_id, doctor_id, summary_json)
VALUES ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '{"brief":"cached"}');
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T8 doctor reads own cached brief while grant live', t.cnt('SELECT 1 FROM public.patient_summaries'), 1::bigint);
SELECT t.logout();
CREATE TEMP TABLE g1 AS SELECT id FROM public.access_grants WHERE patient_id='a0000000-0000-0000-0000-000000000001' AND doctor_id='f0000000-0000-0000-0000-000000000001';
GRANT SELECT ON g1 TO authenticated;
SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT t.eq('T8 patient B cannot revoke patient A''s grant (returns false)', (SELECT public.revoke_access_grant((SELECT id FROM g1))), false);
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.gt0('T8 ...and A''s grant is still live for D1', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'));
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.eq('T8 patient A sees own live grants', t.cnt('SELECT 1 FROM public.access_grants WHERE revoked_at IS NULL'), 3::bigint);
SELECT t.eq('T8 patient A revokes D1 grant', (SELECT public.revoke_access_grant((SELECT id FROM g1))), true);
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T8 AFTER REVOKE: documents -> 0 immediately', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T8 AFTER REVOKE: metrics -> 0', t.vis('public.health_metrics','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T8 AFTER REVOKE: timeline -> 0', t.vis('public.timeline_events','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T8 AFTER REVOKE: cached brief gone', t.cnt('SELECT 1 FROM public.patient_summaries'), 0::bigint);
SELECT t.err('T8 AFTER REVOKE: file download denied', $q$SELECT * FROM public.doctor_authorize_document_download((SELECT id FROM public.medical_documents WHERE user_id='a0000000-0000-0000-0000-000000000001' LIMIT 1))$q$);
SELECT t.err('T8 AFTER REVOKE: log_phi_access denied', $q$SELECT public.doctor_log_phi_access('a0000000-0000-0000-0000-000000000001','health_profile')$q$);
SELECT t.logout();

-- ============================================================================
-- T9  PROFILE SNAPSHOT (column-limited) + CONSULTATION / PRESCRIPTION flow
-- ============================================================================
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.ok('T9 D1 requests access again', $q$SELECT public.request_access_by_code((SELECT patient_code FROM code_a))$q$);
SELECT t.logout();
CREATE TEMP TABLE req2 AS SELECT id FROM public.access_requests WHERE patient_id='a0000000-0000-0000-0000-000000000001' AND status='pending';
GRANT SELECT ON req2 TO authenticated;
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.ok('T9 patient A approves {profile,consultations,medications}', $q$SELECT public.respond_access_request((SELECT id FROM req2), true, ARRAY['profile','consultations','medications'], now() + interval '2 days')$q$);
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T9 snapshot returns the patient row', t.cnt($q$SELECT 1 FROM public.doctor_get_patient_snapshot('a0000000-0000-0000-0000-000000000001')$q$), 1::bigint);
SELECT t.eq('T9 snapshot exposes NO emergency_contact / preferences / avatar column',
            (SELECT count(*) FROM pg_proc p, unnest(p.proargnames) a WHERE p.proname='doctor_get_patient_snapshot' AND a IN ('emergency_contact','preferences','avatar_url')), 0::bigint);
SELECT t.err('T9 snapshot denied for patient B (no grant)', $q$SELECT * FROM public.doctor_get_patient_snapshot('a0000000-0000-0000-0000-000000000002')$q$);
SELECT t.eq('T9 raw health_profiles still closed (emergency_contact unreachable)', t.vis('public.health_profiles','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);

SELECT t.ok('T9 D1 inserts consultation for A', $q$INSERT INTO public.consultations(id, patient_id, doctor_id, chief_complaints, diagnosis) VALUES ('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','chest pain','HTN')$q$);
SELECT t.ok('T9 D1 inserts prescription', $q$INSERT INTO public.prescriptions(id, consultation_id, patient_id, doctor_id, diagnosis) VALUES ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','HTN')$q$);
SELECT t.ok('T9 D1 inserts prescription item', $q$INSERT INTO public.prescription_items(prescription_id, medication_name, dosage, frequency, duration_days) VALUES ('b1000000-0000-0000-0000-000000000001','Amlodipine','5mg','OD',30)$q$);
SELECT t.ok('T9 D1 inserts follow-up', $q$INSERT INTO public.follow_ups(consultation_id, patient_id, doctor_id, scheduled_date, reason) VALUES ('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001', CURRENT_DATE + 14, 'BP review')$q$);
SELECT t.err('T9 D1 cannot write a consultation as another doctor', $q$INSERT INTO public.consultations(patient_id, doctor_id) VALUES ('a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000004')$q$);
SELECT t.err('T9 D1 cannot write consultation for ungranted patient B', $q$INSERT INTO public.consultations(patient_id, doctor_id) VALUES ('a0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000001')$q$);
SELECT t.login('d0000000-0000-0000-0000-000000000004');
SELECT t.eq('T9 other doctor cannot see D1''s consultation', t.vis('public.consultations','patient_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.err('T9 other doctor cannot publish D1''s prescription', $q$SELECT public.publish_prescription('b1000000-0000-0000-0000-000000000001')$q$);
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.eq('T9 patient A sees the consultation', t.vis('public.consultations','patient_id','a0000000-0000-0000-0000-000000000001'), 1::bigint);
SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT t.eq('T9 patient B cannot see A''s consultation', t.vis('public.consultations','patient_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T9 patient B cannot see A''s prescription items', t.cnt('SELECT 1 FROM public.prescription_items'), 0::bigint);

SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T9 publish_prescription creates 1 medication for patient', (SELECT public.publish_prescription('b1000000-0000-0000-0000-000000000001')), 1);
SELECT t.err('T9 cannot publish twice', $q$SELECT public.publish_prescription('b1000000-0000-0000-0000-000000000001')$q$);
SELECT t.rows('T9 published prescription is immutable (UPDATE -> 0 rows)', $q$UPDATE public.prescriptions SET diagnosis='changed' WHERE id='b1000000-0000-0000-0000-000000000001'$q$, 0);
SELECT t.rows('T9 published items immutable (DELETE -> 0 rows)', $q$DELETE FROM public.prescription_items WHERE prescription_id='b1000000-0000-0000-0000-000000000001'$q$, 0);
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.eq('T9 patient sees Amlodipine as needs_confirmation (HITL)', t.cnt($q$SELECT 1 FROM public.medications WHERE name='Amlodipine' AND status='needs_confirmation' AND prescribing_doctor='Doctor One'$q$), 1::bigint);
SELECT t.eq('T9 patient got a notification', t.cnt($q$SELECT 1 FROM public.clinical_notifications WHERE source_trigger='doctor_prescription'$q$), 1::bigint);

-- ============================================================================
-- T10  STALE-SUMMARY TRIGGERS fire when the PATIENT (authenticated) writes
-- ============================================================================
SELECT t.logout();
DELETE FROM public.patient_summaries;
CREATE OR REPLACE FUNCTION pg_temp.reset_summary() RETURNS void LANGUAGE sql AS $$
  INSERT INTO public.patient_summaries(patient_id, doctor_id, summary_json, is_stale)
  VALUES ('a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','{}', false)
  ON CONFLICT (patient_id, doctor_id) DO UPDATE SET is_stale = false $$;
SELECT pg_temp.reset_summary();
SELECT t.login('a0000000-0000-0000-0000-000000000001');
INSERT INTO public.health_metrics(user_id, metric_type, value_primary, unit) VALUES ('a0000000-0000-0000-0000-000000000001','hba1c',6.1,'%');
SELECT t.logout();
SELECT t.eq('T10 health_metrics insert by PATIENT flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT pg_temp.reset_summary();
SELECT t.login('a0000000-0000-0000-0000-000000000001');
INSERT INTO public.medication_logs(medication_id, user_id, status) SELECT id, user_id, 'skipped' FROM public.medications WHERE user_id='a0000000-0000-0000-0000-000000000001' LIMIT 1;
SELECT t.logout();
SELECT t.eq('T10 medication_logs insert by patient flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT pg_temp.reset_summary();
SELECT t.login('a0000000-0000-0000-0000-000000000001');
INSERT INTO public.medical_documents(user_id, file_name, file_path, category) VALUES ('a0000000-0000-0000-0000-000000000001','new.pdf','a0000000-0000-0000-0000-000000000001/new.pdf','lab_report');
SELECT t.logout();
SELECT t.eq('T10 medical_documents insert by patient flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT pg_temp.reset_summary();
SELECT t.login('a0000000-0000-0000-0000-000000000001');
UPDATE public.health_profiles SET allergies = '[{"substance":"Sulfa"}]' WHERE user_id='a0000000-0000-0000-0000-000000000001';
SELECT t.logout();
SELECT t.eq('T10 allergy change by patient flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT pg_temp.reset_summary();
SELECT t.login('a0000000-0000-0000-0000-000000000001');
UPDATE public.medications SET status='active' WHERE user_id='a0000000-0000-0000-0000-000000000001' AND name='Amlodipine';
SELECT t.logout();
SELECT t.eq('T10 patient confirming a medication flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT pg_temp.reset_summary();
INSERT INTO public.timeline_events(user_id, event_type, title, event_date) VALUES ('a0000000-0000-0000-0000-000000000001','note','n',CURRENT_DATE);
SELECT t.eq('T10 timeline_events insert flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT pg_temp.reset_summary();
SELECT t.login('d0000000-0000-0000-0000-000000000001');
INSERT INTO public.consultations(patient_id, doctor_id) VALUES ('a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001');
SELECT t.logout();
SELECT t.eq('T10 consultation insert by doctor flips is_stale', (SELECT is_stale FROM public.patient_summaries), true);
SELECT t.eq('T10 trigger did NOT touch another patient''s cache', (SELECT count(*) FROM public.patient_summaries WHERE patient_id='a0000000-0000-0000-0000-000000000002'), 0::bigint);

-- ============================================================================
-- T11  RATE LIMIT + RESPONSE UNIFORMITY (11th lookup is limited)
-- ============================================================================
DELETE FROM public.lookup_attempts;
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T11 calls 1-10 submitted, 11-12 rate_limited',
  (SELECT string_agg(public.request_access_by_code('CA-RATE-' || lpad(i::text, 4, '0'))->>'status', ',' ORDER BY i) FROM generate_series(1, 12) i),
  'submitted,submitted,submitted,submitted,submitted,submitted,submitted,submitted,submitted,submitted,rate_limited,rate_limited');
SELECT t.logout();
SELECT t.eq('T11 rate-limited attempts persisted for forensics', (SELECT count(*) FROM public.lookup_attempts WHERE outcome='rate_limited'), 2::bigint);
SELECT t.eq('T11 decoy rows created for invalid codes (patient_id NULL)', (SELECT count(*) FROM public.access_requests WHERE patient_id IS NULL AND doctor_id='f0000000-0000-0000-0000-000000000001' AND code_hash IS NOT NULL) >= 10, true);

-- ============================================================================
-- T12  ASSISTANTS / CLINIC ISOLATION / QUEUE
-- ============================================================================
DELETE FROM public.lookup_attempts;
SELECT t.login('e0000000-0000-0000-0000-000000000001');
SELECT t.eq('T12 assistant X: patient A documents -> 0', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T12 assistant X: patient A medications -> 0', t.vis('public.medications','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T12 assistant X: patient A metrics -> 0', t.vis('public.health_metrics','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T12 assistant X: patient A health_profiles -> 0', t.vis('public.health_profiles','user_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);
SELECT t.eq('T12 assistant X: consultations -> 0', t.cnt('SELECT 1 FROM public.consultations'), 0::bigint);
SELECT t.eq('T12 assistant X: prescriptions -> 0', t.cnt('SELECT 1 FROM public.prescriptions'), 0::bigint);
SELECT t.eq('T12 assistant X: patient_identifiers -> 0', t.cnt('SELECT 1 FROM public.patient_identifiers'), 0::bigint);
SELECT t.err('T12 assistant cannot call doctor snapshot', $q$SELECT * FROM public.doctor_get_patient_snapshot('a0000000-0000-0000-0000-000000000001')$q$);
SELECT t.err('T12 assistant cannot request clinical access', $q$SELECT public.request_access_by_code('CA-AAAA-AAAA')$q$);
SELECT t.err('T12 assistant cannot insert a visit token directly', $q$INSERT INTO public.visit_tokens(clinic_id,doctor_id,patient_id,serial_number,visit_date) VALUES ('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',99,CURRENT_DATE)$q$);

SELECT t.eq('T12 register patient A (serial 1)', (SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001',(SELECT patient_code FROM code_a),'normal')->>'serial_number'), '1');
SELECT t.eq('T12 register patient B urgent (serial 2)', (SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001',(SELECT patient_code FROM code_b),'urgent')->>'serial_number'), '2');
SELECT t.err('T12 same patient cannot be queued twice', $q$SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001',(SELECT patient_code FROM code_a))$q$);
SELECT t.err('T12 unknown patient code rejected', $q$SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001','CA-NOPE-NOPE')$q$);
SELECT t.err('T12 cannot register with a doctor from another clinic', $q$SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000004',(SELECT patient_code FROM code_a))$q$);
SELECT t.err('T12 cannot register with a suspended/inactive doctor', $q$SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000003',(SELECT patient_code FROM code_a))$q$);
SELECT t.eq('T12 queue lists 2 tokens, urgent first', (SELECT string_agg(serial_number::text, ',' ORDER BY ord) FROM (SELECT serial_number, row_number() OVER () ord FROM public.get_clinic_queue('c0000000-0000-0000-0000-00000000000a')) q), '2,1');
SELECT t.eq('T12 queue returns names for the desk', (SELECT count(*) FROM public.get_clinic_queue('c0000000-0000-0000-0000-00000000000a') WHERE patient_name IS NOT NULL), 2::bigint);
SELECT t.rows('T12 assistant can update token status', $q$UPDATE public.visit_tokens SET status='in_progress', called_at=now() WHERE serial_number=1$q$, 1);
SELECT t.err('T12 assistant cannot re-point a token to another patient (column privilege)', $q$UPDATE public.visit_tokens SET patient_id='a0000000-0000-0000-0000-000000000002' WHERE serial_number=1$q$);
SELECT t.err('T12 assistant cannot move a token to another doctor/clinic', $q$UPDATE public.visit_tokens SET doctor_id='f0000000-0000-0000-0000-000000000004'$q$);
SELECT t.err('T12 assistant cannot delete tokens', $q$DELETE FROM public.visit_tokens$q$);
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T12 registering patient B at the desk gave D1 NO data (consent still pending)', t.vis('public.medical_documents','user_id','a0000000-0000-0000-0000-000000000002'), 0::bigint);
SELECT t.eq('T12 ...nor B''s metrics', t.vis('public.health_metrics','user_id','a0000000-0000-0000-0000-000000000002'), 0::bigint);

SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT t.eq('T12 patient B sees own pending visit consent request from the clinic', t.cnt($q$SELECT 1 FROM public.access_requests WHERE status='pending'$q$) >= 1, true);
SELECT t.eq('T12 patient B sees own visit token', t.cnt('SELECT 1 FROM public.visit_tokens'), 1::bigint);

SELECT t.login('e0000000-0000-0000-0000-000000000002');
SELECT t.eq('T12 assistant Y cannot see clinic X queue via table', t.cnt('SELECT 1 FROM public.visit_tokens'), 0::bigint);
SELECT t.err('T12 assistant Y cannot call get_clinic_queue(X)', $q$SELECT * FROM public.get_clinic_queue('c0000000-0000-0000-0000-00000000000a')$q$);
SELECT t.err('T12 assistant Y cannot register into clinic X', $q$SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001',(SELECT patient_code FROM code_a))$q$);
SELECT t.rows('T12 assistant Y cannot update clinic X tokens (0 rows)', $q$UPDATE public.visit_tokens SET status='cancelled'$q$, 0);
SELECT t.eq('T12 assistant Y cannot see clinic X row in clinics', t.cnt($q$SELECT 1 FROM public.clinics WHERE code='CLX'$q$), 0::bigint);

SELECT t.login('d0000000-0000-0000-0000-000000000004');
SELECT t.eq('T12 doctor 4 (clinic Y) sees 0 clinic X tokens', t.cnt('SELECT 1 FROM public.visit_tokens'), 0::bigint);
SELECT t.err('T12 doctor 4 cannot read clinic X queue', $q$SELECT * FROM public.get_clinic_queue('c0000000-0000-0000-0000-00000000000a')$q$);
SELECT t.login('d0000000-0000-0000-0000-000000000001');
SELECT t.eq('T12 doctor 1 sees only own 2 tokens', t.cnt('SELECT 1 FROM public.get_clinic_queue(''c0000000-0000-0000-0000-00000000000a'')'), 2::bigint);
SELECT t.logout();
SELECT t.err('T12 unique serial per doctor/day enforced', $q$INSERT INTO public.visit_tokens(clinic_id,doctor_id,patient_id,serial_number,visit_date) VALUES ('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000004',1,CURRENT_DATE)$q$);

-- ============================================================================
-- T13  AUDIT TRAIL visible to the PATIENT, isolated per patient
-- ============================================================================
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.gt0('T13 patient A sees who accessed / was granted (audit rows)', t.cnt('SELECT 1 FROM public.audit_logs WHERE patient_id = auth.uid()'));
SELECT t.gt0('T13 audit contains the doctor read events', t.cnt($q$SELECT 1 FROM public.audit_logs WHERE action IN ('read','download','prescription_published') AND user_id='d0000000-0000-0000-0000-000000000001'$q$));
SELECT t.eq('T13 patient A sees NO audit rows about patient B', t.vis('public.audit_logs','patient_id','a0000000-0000-0000-0000-000000000002'), 0::bigint);
SELECT t.err('T13 patient cannot forge an audit row about another patient', $q$INSERT INTO public.audit_logs(user_id, patient_id, action, resource_type) VALUES (auth.uid(),'a0000000-0000-0000-0000-000000000002','read','x')$q$);
SELECT t.ok('T13 patient CAN still write own audit row (existing behavior)', $q$INSERT INTO public.audit_logs(user_id, action, resource_type) VALUES (auth.uid(),'export_phi','health_profile')$q$);
SELECT t.err('T13 patient cannot UPDATE audit_logs', $q$UPDATE public.audit_logs SET action='x'$q$);
SELECT t.err('T13 patient cannot DELETE audit_logs', $q$DELETE FROM public.audit_logs$q$);
SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT t.eq('T13 patient B cannot see patient A''s audit trail', t.vis('public.audit_logs','patient_id','a0000000-0000-0000-0000-000000000001'), 0::bigint);

-- ============================================================================
-- T14  patient_code: private, rotatable
-- ============================================================================
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.eq('T14 patient sees only own identifier row', t.cnt('SELECT 1 FROM public.patient_identifiers'), 1::bigint);
SELECT t.err('T14 patient cannot edit own code directly (use RPC)', $q$UPDATE public.patient_identifiers SET patient_code='CA-HACK-HACK'$q$);
SELECT t.ok('T14 patient can rotate a leaked code', $q$SELECT * FROM public.ensure_patient_identifier(true)$q$);
SELECT t.eq('T14 old code no longer resolves', (SELECT count(*) FROM public.patient_identifiers WHERE patient_code = (SELECT patient_code FROM code_a)), 0::bigint);

-- ============================================================================
-- T15  ANON role has no access to anything new
-- ============================================================================
SELECT t.login_anon();
SELECT t.err('T15 anon cannot read access_grants', $q$SELECT 1 FROM public.access_grants$q$);
SELECT t.err('T15 anon cannot read patient_identifiers', $q$SELECT 1 FROM public.patient_identifiers$q$);
SELECT t.err('T15 anon cannot read doctor_profiles', $q$SELECT 1 FROM public.doctor_profiles$q$);
SELECT t.err('T15 anon cannot call request_access_by_code', $q$SELECT public.request_access_by_code('CA-AAAA-AAAA')$q$);
SELECT t.err('T15 anon cannot call register_visit', $q$SELECT public.register_visit('c0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001','CA-AAAA-AAAA')$q$);
SELECT t.err('T15 anon cannot call has_active_doctor_grant', $q$SELECT public.has_active_doctor_grant('a0000000-0000-0000-0000-000000000001','documents')$q$);
SELECT t.logout();

-- ============================================================================
-- T16  REGRESSION: existing PATIENT behavior unchanged on all pre-existing tables
-- ============================================================================
SELECT t.login('a0000000-0000-0000-0000-000000000001');
SELECT t.eq('T16 patient A still reads own ' || x.tbl, t.vis('public.' || x.tbl, 'user_id', 'a0000000-0000-0000-0000-000000000001') > 0, true)
FROM (VALUES ('health_profiles'),('medical_documents'),('extracted_records'),('timeline_events'),('medications'),('medication_logs'),
             ('health_metrics'),('doctors'),('appointments'),('ai_conversations'),('ai_messages'),('clinical_notifications'),('document_embeddings')) AS x(tbl);
SELECT t.eq('T16 patient A cannot read patient B ' || x.tbl, t.vis('public.' || x.tbl, 'user_id', 'a0000000-0000-0000-0000-000000000002'), 0::bigint)
FROM (VALUES ('health_profiles'),('medical_documents'),('extracted_records'),('timeline_events'),('medications'),('medication_logs'),
             ('health_metrics'),('doctors'),('appointments'),('ai_conversations'),('ai_messages'),('clinical_notifications'),('document_embeddings')) AS x(tbl);
SELECT t.eq('T16 patient reads own storage objects', t.cnt($q$SELECT 1 FROM storage.objects WHERE (storage.foldername(name))[1] = auth.uid()::text$q$) > 0, true);
SELECT t.ok('T16 patient INSERT own medication', $q$INSERT INTO public.medications(user_id,name,dosage,frequency) VALUES (auth.uid(),'Aspirin','75mg','OD')$q$);
SELECT t.rows('T16 patient UPDATE own medication', $q$UPDATE public.medications SET status='completed' WHERE name='Aspirin'$q$, 1);
SELECT t.rows('T16 patient DELETE own medication', $q$DELETE FROM public.medications WHERE name='Aspirin'$q$, 1);
SELECT t.err('T16 patient cannot INSERT a row owned by B', $q$INSERT INTO public.health_metrics(user_id,metric_type,value_primary,unit) VALUES ('a0000000-0000-0000-0000-000000000002','glucose',1,'x')$q$);
SELECT t.rows('T16 patient cannot UPDATE B''s rows (0)', $q$UPDATE public.health_metrics SET value_primary=0 WHERE user_id='a0000000-0000-0000-0000-000000000002'$q$, 0);
SELECT t.rows('T16 patient cannot DELETE B''s rows (0)', $q$DELETE FROM public.medical_documents WHERE user_id='a0000000-0000-0000-0000-000000000002'$q$, 0);
SELECT t.ok('T16 patient can still call existing log_audit_event()', $q$SELECT public.log_audit_event('read','medical_document',NULL,'{}')$q$);
SELECT t.logout();
-- a user who is ONLY a patient (no doctor profile) gets nothing from doctor helpers
SELECT t.login('a0000000-0000-0000-0000-000000000002');
SELECT t.eq('T16 plain patient: current_doctor_id() is NULL', (SELECT public.current_doctor_id()), NULL::uuid);
SELECT t.eq('T16 plain patient: has_active_doctor_grant() false', (SELECT public.has_active_doctor_grant('a0000000-0000-0000-0000-000000000001','documents')), false);
SELECT t.logout();

-- ============================================================================
-- RESULTS
-- ============================================================================
\o
SELECT n, CASE WHEN passed THEN 'PASS' ELSE '**FAIL**' END AS result, name, detail FROM t.results ORDER BY n;
SELECT count(*) FILTER (WHERE passed) AS passed, count(*) FILTER (WHERE NOT passed) AS failed, count(*) AS total FROM t.results;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM t.results WHERE NOT passed) THEN
    RAISE EXCEPTION 'SECURITY TESTS FAILED: % failing assertion(s)', (SELECT count(*) FROM t.results WHERE NOT passed);
  END IF;
END $$;
