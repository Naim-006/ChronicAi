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

  // If in browser, use privileged server endpoint to avoid RLS/permission issues
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/medications/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "take",
          userId: log.user_id,
          medicationId: log.medication_id,
          scheduledTime: log.scheduled_time,
          notes: log.notes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.log) {
        return {
          id: json.log.id,
          medication_id: json.log.medication_id,
          user_id: json.log.user_id,
          scheduled_time: json.log.scheduled_time,
          recorded_time: json.log.recorded_time || undefined,
          status: json.log.status,
          notes: json.log.notes || undefined,
          created_at: json.log.created_at,
        };
      }
    } catch (apiErr) {
      console.warn("Server adherence log failed, falling back to direct client:", apiErr);
    }
  }

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

export async function untakeMedicationAdherence(
  medicationId: string,
  userId: string
): Promise<boolean> {
  // If in browser, call privileged server endpoint to delete today's adherence log
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/medications/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "untake",
          userId,
          medicationId,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return true;
      }
    } catch (apiErr) {
      console.warn("Server untake failed, falling back to direct client:", apiErr);
    }
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { error } = await supabase
    .from("medication_logs")
    .delete()
    .eq("user_id", userId)
    .eq("medication_id", medicationId)
    .gte("created_at", today.toISOString());

  if (error) {
    console.error("Failed to delete medication log:", error);
    return false;
  }

  return true;
}

export async function getMedicationLogs(
  userId: string,
  limitDays = 14
): Promise<MedicationLog[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - limitDays);

  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    medication_id: d.medication_id,
    user_id: d.user_id,
    scheduled_time: d.scheduled_time,
    recorded_time: d.recorded_time || undefined,
    status: d.status,
    notes: d.notes || undefined,
    created_at: d.created_at,
  }));
}

export async function updateMedication(
  id: string,
  userId: string,
  updates: Partial<Omit<Medication, "id" | "user_id" | "created_at">>
): Promise<Medication | null> {
  // If running in browser, use server route with service-role to avoid client RLS blocks
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/medications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, updates }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.medication) {
        return json.medication;
      }
    } catch (apiErr) {
      console.warn("Server medication update failed, falling back to direct client:", apiErr);
    }
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("medications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to update medication:", error);
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    document_id: data.document_id || undefined,
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

export async function deleteMedication(id: string, userId: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/medications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return true;
      }
    } catch (apiErr) {
      console.warn("Server medication delete failed, falling back to direct client:", apiErr);
    }
  }

  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
