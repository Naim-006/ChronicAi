# Security, Privacy & Compliance Guidelines — Universal Personal Medical AI

## 1. Zero-Trust Healthcare Data Isolation
- **Row Level Security (RLS)** is enforced at the database level on every table. All database queries made from client sessions use authenticated Supabase JWTs where `auth.uid() = user_id`.
- Even if an API endpoint has an authorization flaw, the database engine enforces tenant boundaries.

---

## 2. Cryptographic Storage & Access
- All raw medical documents (prescriptions, lab PDFs, scan images) are stored in private Supabase Storage buckets.
- Files are encrypted at rest using AES-256.
- Direct public access to the storage bucket is completely disabled.
- File viewing is mediated through short-lived signed URLs with an expiration lifetime of **15 minutes**.

---

## 3. PHI Sanitization & Logging Policy
- **No PHI in Server Logs**: Application loggers strip names, email addresses, and specific medical diagnoses before writing to stdout or telemetry systems.
- **Client Secrets Protection**: The `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-only workers and is never bundled in frontend code.
- **Audit Logging**: Any creation, modification, deletion, or sharing of medical records writes an immutable audit log entry containing the user ID, action, timestamp, IP address, and resource ID.

---

## 4. Compliance Considerations (HIPAA & GDPR)
While running in local development or standard cloud tiers, the application architecture is designed around HIPAA Security Rule requirements:
- **Integrity Controls**: All records maintain immutable creation timestamps and versioned change histories.
- **Data Export & Portability**: Users can export their complete health data (JSON + original PDFs) at any time.
- **Right to Erasure**: Deletion cascades from `profiles` to remove all associated documents, logs, and embeddings permanently.
