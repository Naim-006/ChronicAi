import { createClient, isSupabaseConfigured } from "../client";
import { Medication, MedicationLog } from "@/types/medical";

export async function getMedications(userId: string): Promise<Medication[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    document_id: m.document_id || undefined,
    name: m.name,
    generic_name: m.generic_name || undefined,
    strength: m.strength || undefined,
    dosage: m.dosage,
    frequency: m.frequency,
    route: m.route || undefined,
    instructions: m.instructions || undefined,
    start_date: m.start_date,
    end_date: m.end_date || undefined,
    prescribing_doctor: m.prescribing_doctor || undefined,
    related_condition: m.related_condition || undefined,
    status: m.status,
    created_at: m.created_at,
  }));
}

export async function createMedication(
  med: Omit<Medication, "id" | "created_at">
): Promise<Medication> {
  const newId = `med-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...med, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("medications")
    .insert({
      user_id: med.user_id,
      name: med.name,
      generic_name: med.generic_name,
      strength: med.strength,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      instructions: med.instructions,
      start_date: med.start_date,
      end_date: med.end_date,
      prescribing_doctor: med.prescribing_doctor,
      related_condition: med.related_condition,
      status: med.status,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...med, id: newId, created_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    generic_name: data.generic_name || undefined,
    strength: data.strength || undefined,
    dosage: data.dosage,
    frequency: data.frequency,
    route: data.route || undefined,
    instructions: data.instructions || undefined,
    start_date: data.start_date,
    end_date: data.end_date || undefined,
    prescribing_doctor: data.prescribing_doctor || undefined,
    related_condition: data.related_condition || undefined,
    status: data.status,
    created_at: data.created_at,
  };
}

export async function logMedicationAdherence(
  log: Omit<MedicationLog, "id" | "created_at">
): Promise<MedicationLog> {
  const newId = `log-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...log, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("medication_logs")
    .insert({
      medication_id: log.medication_id,
      user_id: log.user_id,
      scheduled_time: log.scheduled_time,
      recorded_time: log.recorded_time,
      status: log.status,
      notes: log.notes,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...log, id: newId, created_at: now };
  }

  return {
    id: data.id,
    medication_id: data.medication_id,
    user_id: data.user_id,
    scheduled_time: data.scheduled_time,
    recorded_time: data.recorded_time || undefined,
    status: data.status,
    notes: data.notes || undefined,
    created_at: data.created_at,
  };
}
