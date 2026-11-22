import { createClient, isSupabaseConfigured } from "../client";

export interface PrescriptionItemInput {
  medication_name: string;
  generic_name?: string;
  strength?: string;
  dosage: string;
  frequency: string;
  route?: string;
  duration_days?: number;
  instructions?: string;
}

export interface ConsultationInput {
  patientId: string;
  doctorId: string;
  visitTokenId?: string | null;
  chiefComplaints?: string;
  clinicalFindings?: string;
  diagnosis: string;
  icd10?: string;
  advice?: string;
  clinicalNotes?: string;
}

export interface PrescriptionInput {
  consultationId?: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  generalAdvice?: string;
  items: PrescriptionItemInput[];
}

export interface FollowUpInput {
  consultationId?: string | null;
  patientId: string;
  doctorId: string;
  scheduledDate: string; // YYYY-MM-DD
  reason?: string;
  recommendedTests?: string[];
}

export interface DetailedConsultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_token_id: string | null;
  chief_complaints: string | null;
  clinical_findings: string | null;
  diagnosis: string | null;
  icd10: string | null;
  advice: string | null;
  clinical_notes: string | null;
  created_at: string;
  patient_name?: string;
  prescriptions?: Array<{
    id: string;
    published_at: string | null;
    items: any[];
  }>;
}

export interface DetailedFollowUp {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  scheduled_date: string;
  reason: string | null;
  recommended_tests: string[];
  status: "scheduled" | "completed" | "missed" | "cancelled";
  created_at: string;
  patient_name?: string;
}

export interface PatientSnapshot {
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  allergies: string[];
  chronic_conditions: string[];
}

/**
 * Fetch patient snapshot (profile + allergies + conditions) via Security Definer RPC
 */
export async function getPatientSnapshot(
  patientId: string
): Promise<PatientSnapshot | null> {
  if (!patientId || !isSupabaseConfigured()) return null;
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("doctor_get_patient_snapshot", {
    p_patient_id: patientId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  const allergies = Array.isArray(row.allergies)
    ? row.allergies
    : typeof row.allergies === "string"
    ? [row.allergies]
    : [];
  const chronicConditions = Array.isArray(row.chronic_conditions)
    ? row.chronic_conditions
    : typeof row.chronic_conditions === "string"
    ? [row.chronic_conditions]
    : [];

  return {
    full_name: row.full_name || "Patient",
    date_of_birth: row.date_of_birth || null,
    sex: row.sex || null,
    blood_group: row.blood_group || null,
    height_cm: row.height_cm || null,
    weight_kg: row.weight_kg || null,
    allergies,
    chronic_conditions: chronicConditions,
  };
}

/**
 * Check if a medication name or generic name potentially conflicts with patient allergies
 */
export function checkMedicationAllergy(
  medicationName: string,
  genericName: string | undefined,
  allergies: string[]
): { hasConflict: boolean; matchedAllergy?: string } {
  if (!allergies || allergies.length === 0) {
    return { hasConflict: false };
  }

  const medLower = (medicationName || "").toLowerCase().trim();
  const genLower = (genericName || "").toLowerCase().trim();

  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase().trim();
    if (!allergyLower) continue;

    // Direct substring checks or common class patterns
    if (
      (medLower && (medLower.includes(allergyLower) || allergyLower.includes(medLower))) ||
      (genLower && (genLower.includes(allergyLower) || allergyLower.includes(genLower)))
    ) {
      return { hasConflict: true, matchedAllergy: allergy };
    }

    // Special clinical class mapping
    if (allergyLower.includes("penicillin")) {
      const penicillins = ["amoxicillin", "ampicillin", "augmentin", "cloxacillin", "piperacillin", "penicillin"];
      if (penicillins.some((p) => medLower.includes(p) || genLower.includes(p))) {
        return { hasConflict: true, matchedAllergy: allergy };
      }
    }
    if (allergyLower.includes("sulfa")) {
      const sulfas = ["sulfamethoxazole", "bactrim", "septrin", "sulfasalazine", "cotrimoxazole"];
      if (sulfas.some((s) => medLower.includes(s) || genLower.includes(s))) {
        return { hasConflict: true, matchedAllergy: allergy };
      }
    }
    if (allergyLower.includes("nsaid") || allergyLower.includes("aspirin")) {
      const nsaids = ["aspirin", "ibuprofen", "naproxen", "diclofenac", "ketorolac", "aceclofenac"];
      if (nsaids.some((n) => medLower.includes(n) || genLower.includes(n))) {
        return { hasConflict: true, matchedAllergy: allergy };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Create a new clinical consultation record
 */
export async function createConsultation(
  input: ConsultationInput
): Promise<{ success: boolean; consultationId?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const { data, error } = await supabase
    .from("consultations")
    .insert({
      patient_id: input.patientId,
      doctor_id: input.doctorId,
      visit_token_id: input.visitTokenId || null,
      chief_complaints: input.chiefComplaints || null,
      clinical_findings: input.clinicalFindings || null,
      diagnosis: input.diagnosis,
      icd10: input.icd10 || null,
      advice: input.advice || null,
      clinical_notes: input.clinicalNotes || null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, consultationId: data.id };
}

/**
 * Create an e-prescription with multiple medication items
 */
export async function createPrescription(
  input: PrescriptionInput
): Promise<{ success: boolean; prescriptionId?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  // 1. Insert prescription header
  const { data: rx, error: rxError } = await supabase
    .from("prescriptions")
    .insert({
      consultation_id: input.consultationId || null,
      patient_id: input.patientId,
      doctor_id: input.doctorId,
      diagnosis: input.diagnosis || null,
      general_advice: input.generalAdvice || null,
    })
    .select("id")
    .single();

  if (rxError || !rx) {
    return { success: false, error: rxError?.message || "Failed to create prescription" };
  }

  // 2. Insert items
  if (input.items && input.items.length > 0) {
    const itemsToInsert = input.items.map((item) => ({
      prescription_id: rx.id,
      medication_name: item.medication_name.trim(),
      generic_name: item.generic_name?.trim() || null,
      strength: item.strength?.trim() || null,
      dosage: item.dosage.trim(),
      frequency: item.frequency.trim(),
      route: item.route || "Oral",
      duration_days: item.duration_days || null,
      instructions: item.instructions?.trim() || null,
    }));

    const { error: itemsError } = await supabase
      .from("prescription_items")
      .insert(itemsToInsert);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }
  }

  return { success: true, prescriptionId: rx.id };
}

/**
 * Publish prescription to sync into patient's active medications and notifications
 */
export async function publishPrescription(
  prescriptionId: string
): Promise<{ success: boolean; publishedCount?: number; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("publish_prescription", {
    p_prescription_id: prescriptionId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, publishedCount: Number(data) || 0 };
}

/**
 * Schedule a follow-up review for the patient
 */
export async function createFollowUp(
  input: FollowUpInput
): Promise<{ success: boolean; followUpId?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const { data, error } = await supabase
    .from("follow_ups")
    .insert({
      consultation_id: input.consultationId || null,
      patient_id: input.patientId,
      doctor_id: input.doctorId,
      scheduled_date: input.scheduledDate,
      reason: input.reason || null,
      recommended_tests: input.recommendedTests || [],
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, followUpId: data.id };
}

/**
 * Fetch consultations authored by the doctor
 */
export async function getDoctorConsultations(
  doctorId: string
): Promise<DetailedConsultation[]> {
  if (!doctorId || !isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("consultations")
    .select(`
      id,
      patient_id,
      doctor_id,
      visit_token_id,
      chief_complaints,
      clinical_findings,
      diagnosis,
      icd10,
      advice,
      clinical_notes,
      created_at,
      prescriptions (
        id,
        published_at,
        prescription_items (*)
      )
    `)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  // Enrich with patient names
  const patientIds = Array.from(new Set(data.map((c: any) => c.patient_id)));
  const { data: profiles } = await supabase
    .from("health_profiles")
    .select("user_id, full_name")
    .in("user_id", patientIds);

  const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

  return data.map((c: any) => ({
    ...c,
    patient_name: nameMap.get(c.patient_id) || "Patient",
    prescriptions: (c.prescriptions || []).map((p: any) => ({
      id: p.id,
      published_at: p.published_at,
      items: p.prescription_items || [],
    })),
  }));
}

/**
 * Fetch follow-ups assigned to the doctor
 */
export async function getDoctorFollowUps(
  doctorId: string
): Promise<DetailedFollowUp[]> {
  if (!doctorId || !isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("follow_ups")
    .select(`
      id,
      consultation_id,
      patient_id,
      doctor_id,
      scheduled_date,
      reason,
      recommended_tests,
      status,
      created_at
    `)
    .eq("doctor_id", doctorId)
    .order("scheduled_date", { ascending: true })
    .limit(100);

  if (error || !data) {
    return [];
  }

  // Enrich with patient names
  const patientIds = Array.from(new Set(data.map((f: any) => f.patient_id)));
  const { data: profiles } = await supabase
    .from("health_profiles")
    .select("user_id, full_name")
    .in("user_id", patientIds);

  const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

  return data.map((f: any) => ({
    ...f,
    patient_name: nameMap.get(f.patient_id) || "Patient",
  }));
}

/**
 * Update the status of a scheduled follow-up
 */
export async function updateFollowUpStatus(
  followUpId: string,
  status: "scheduled" | "completed" | "missed" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const { error } = await supabase
    .from("follow_ups")
    .update({ status })
    .eq("id", followUpId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Send an alert / reminder notification to a patient regarding their scheduled follow-up
 */
export async function sendFollowUpReminder(
  patientId: string,
  doctorName: string,
  scheduledDate: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const formattedDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const { error } = await supabase.from("clinical_notifications").insert({
    user_id: patientId,
    type: "care_insight",
    title: `Follow-up Due: ${formattedDate}`,
    message: `${doctorName} has requested a clinical review on ${formattedDate}.${reason ? ` Reason: ${reason}` : ""}`,
    severity: "warning",
    source_trigger: "doctor_followup_reminder",
    link_href: "/appointments",
    link_label: "View Schedule",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
