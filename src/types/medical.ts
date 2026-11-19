// Core Medical Domain Types

export type Sex = "male" | "female" | "other" | "prefer_not_to_say";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
  diagnosed_date?: string;
}

export interface Condition {
  id: string;
  name: string;
  icd10?: string;
  status: "active" | "managed" | "resolved";
  diagnosed_date: string;
  notes?: string;
}

export interface HealthProfile {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth?: string;
  sex?: Sex;
  blood_group?: BloodGroup;
  height_cm?: number;
  weight_kg?: number;
  emergency_contact?: EmergencyContact;
  allergies: Allergy[];
  chronic_conditions: Condition[];
  preferences: {
    language: string;
    explanation_depth: "simple" | "balanced" | "detailed";
    notifications_enabled: boolean;
    theme?: "light" | "dark" | "system";
  };
  created_at: string;
  updated_at: string;
}

export type DocumentCategory =
  | "prescription"
  | "lab_report"
  | "imaging"
  | "discharge_summary"
  | "doctor_note"
  | "other";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "extracted"
  | "needs_review"
  | "verified"
  | "failed";

export interface MedicalDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: DocumentCategory;
  document_date?: string;
  facility_name?: string;
  doctor_name?: string;
  status: DocumentStatus;
  summary?: string;
  tags?: string[];
  created_at: string;
}

export interface ExtractedLabResult {
  test_name: string;
  value: number;
  unit: string;
  reference_range?: string;
  is_abnormal: boolean;
}

export interface ExtractedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface ExtractedRecordData {
  document_type: DocumentCategory;
  date?: string;
  facility?: string;
  doctor?: string;
  diagnoses?: string[];
  medications?: ExtractedMedication[];
  lab_results?: ExtractedLabResult[];
  instructions?: string[];
}

export interface ExtractedRecord {
  id: string;
  document_id: string;
  user_id: string;
  raw_extracted: ExtractedRecordData;
  confirmed_data?: ExtractedRecordData;
  confidence_score: number;
  status: "pending" | "confirmed" | "rejected" | "modified";
  reviewed_at?: string;
  created_at: string;
}

export type TimelineEventType =
  | "visit"
  | "diagnosis"
  | "medication_start"
  | "medication_stop"
  | "lab_test"
  | "imaging"
  | "surgery"
  | "measurement"
  | "note";

export interface TimelineEvent {
  id: string;
  user_id: string;
  document_id?: string;
  event_type: TimelineEventType;
  title: string;
  description?: string;
  event_date: string;
  facility_or_doctor?: string;
  is_verified: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type MedicationStatus = "active" | "upcoming" | "completed" | "discontinued" | "needs_confirmation";

export interface Medication {
  id: string;
  user_id: string;
  document_id?: string;
  name: string;
  generic_name?: string;
  strength?: string;
  dosage: string;
  frequency: string; // e.g. "Once daily", "Twice daily with meals"
  route?: string;
  instructions?: string;
  start_date: string;
  end_date?: string;
  prescribing_doctor?: string;
  related_condition?: string;
  status: MedicationStatus;
  created_at: string;
}

export type AdherenceStatus = "taken" | "skipped" | "snoozed" | "missed";

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_time: string;
  recorded_time?: string;
  status: AdherenceStatus;
  notes?: string;
  created_at: string;
}

export type MetricType =
  | "blood_pressure"
  | "heart_rate"
  | "glucose"
  | "hba1c"
  | "weight"
  | "temperature"
  | "spo2"
  | "other";

export interface HealthMetric {
  id: string;
  user_id: string;
  document_id?: string;
  metric_type: MetricType;
  value_primary: number;
  value_secondary?: number; // e.g. diastolic for blood pressure
  unit: string;
  context?: "fasting" | "postprandial" | "resting" | "random" | "bedtime";
  reference_low?: number;
  reference_high?: number;
  is_abnormal?: boolean;
  recorded_at: string;
  notes?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialty: string;
  clinic_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled" | "rescheduled";

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id?: string;
  doctor_name: string;
  specialty: string;
  clinic_or_hospital: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  location?: string;
  status: AppointmentStatus;
  consultation_notes?: string;
  preparation_questions?: string[];
  created_at: string;
}

export interface AICitation {
  document_id: string;
  document_title: string;
  date?: string;
  page?: number;
  snippet?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: AICitation[];
  is_emergency_flag?: boolean;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | "critical_alert"
  | "verification_required"
  | "medication_reminder"
  | "appointment_reminder"
  | "care_insight"
  | "preventive_care";

export interface ClinicalNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info" | "success";
  source_trigger: string;
  link_href?: string;
  link_label?: string;
  is_read: boolean;
  is_dismissed?: boolean;
  created_at: string;
}
