// ==============================================================================
// ChronicAI Doctor Portal - TypeScript Domain Models & Contract Types
// File: src/types/doctor-portal.ts
// ==============================================================================

import { Json } from "@/lib/supabase/database.types";

export type DoctorVerificationStatus = "pending" | "verified" | "suspended";

export type ClinicStaffRole = "doctor" | "assistant" | "admin";

export type GrantScopeCategory =
  | "profile"
  | "documents"
  | "timeline"
  | "medications"
  | "adherence"
  | "metrics"
  | "consultations";

export type AccessRequestStatus = "pending" | "approved" | "rejected" | "expired";

export type VisitTokenStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export type VisitPriority = "normal" | "urgent" | "emergency";

export type FollowUpStatus = "scheduled" | "completed" | "missed" | "cancelled";

export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  bmdc_number: string;
  specialty: string;
  qualifications: string | null;
  chamber_info: {
    room?: string;
    clinic_name?: string;
    visiting_hours?: string;
    days?: string[];
    phone?: string;
    address?: string;
  } | Json;
  verification_status: DoctorVerificationStatus;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  created_at: string;
}

export interface ClinicStaff {
  id: string;
  clinic_id: string;
  user_id: string;
  role: ClinicStaffRole;
  is_active: boolean;
  created_at: string;
}

export interface PatientIdentifier {
  id: string;
  user_id: string;
  patient_code: string;
  qr_token: string;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  patient_id: string | null;
  doctor_id: string;
  code_hash: string | null;
  requested_scope: GrantScopeCategory[];
  message: string | null;
  status: AccessRequestStatus;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface AccessGrant {
  id: string;
  patient_id: string;
  doctor_id: string;
  request_id: string | null;
  scope: GrantScopeCategory[];
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface TriageVitals {
  bp?: string;
  pulse?: number;
  temp?: string;
  spo2?: number;
  weight_kg?: number;
  chief_complaint?: string;
  [key: string]: any;
}

export interface VisitToken {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  serial_number: number;
  visit_date: string;
  status: VisitTokenStatus;
  priority: VisitPriority;
  triage: TriageVitals | Json;
  created_by: string | null;
  created_at: string;
  called_at: string | null;
}

export interface QueueItem {
  id: string;
  serial_number: number;
  status: VisitTokenStatus;
  priority: VisitPriority;
  doctor_id: string;
  patient_id: string;
  patient_name: string | null;
  triage: TriageVitals;
  created_at: string;
}

export interface Consultation {
  id: string;
  visit_token_id: string | null;
  patient_id: string;
  doctor_id: string;
  chief_complaints: string | null;
  clinical_findings: string | null;
  diagnosis: string | null;
  icd10: string | null;
  advice: string | null;
  clinical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  diagnosis: string | null;
  general_advice: string | null;
  published_at: string | null;
  created_at: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  generic_name: string | null;
  strength: string | null;
  dosage: string;
  frequency: string;
  route: string | null;
  duration_days: number | null;
  instructions: string | null;
  created_at: string;
}

export interface FollowUp {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  scheduled_date: string;
  reason: string | null;
  recommended_tests: string[];
  status: FollowUpStatus;
  created_at: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  date: string;
  page?: number;
  snippet: string;
  type?: "document" | "metric" | "prescription" | "consultation";
}

export interface RedFlag {
  id: string;
  severity: "critical" | "warning";
  category: "lab" | "vital" | "adherence" | "follow_up" | "allergy";
  title: string;
  detail: string;
  citation?: Citation;
}

export interface PreVisitBriefSummary {
  ai_bullets: string[];
  points_to_review: string[];
  citations: Citation[];
}

export interface PatientSummaryCache {
  id: string;
  patient_id: string;
  doctor_id: string;
  summary_json: PreVisitBriefSummary | Json;
  citations_json: Citation[] | Json;
  red_flags: RedFlag[] | Json;
  generated_at: string;
  is_stale: boolean;
}

export interface PatientSnapshot {
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  allergies: Json;
  chronic_conditions: Json;
}
