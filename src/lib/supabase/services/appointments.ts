import { createClient, isSupabaseConfigured } from "../client";
import { Appointment, Doctor } from "@/types/medical";

export async function getAppointments(userId: string): Promise<Appointment[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .order("appointment_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((a: any) => ({
    id: a.id,
    user_id: a.user_id,
    doctor_id: a.doctor_id || undefined,
    doctor_name: a.doctor_name,
    specialty: a.specialty,
    clinic_or_hospital: a.clinic_or_hospital,
    appointment_date: a.appointment_date,
    appointment_time: a.appointment_time,
    reason: a.reason,
    location: a.location || undefined,
    status: a.status,
    consultation_notes: a.consultation_notes || undefined,
    preparation_questions: a.preparation_questions || undefined,
    created_at: a.created_at,
  }));
}

export async function getDoctors(userId: string): Promise<Doctor[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    user_id: d.user_id,
    name: d.name,
    specialty: d.specialty,
    clinic_name: d.clinic_name || undefined,
    phone: d.phone || undefined,
    email: d.email || undefined,
    address: d.address || undefined,
    notes: d.notes || undefined,
    created_at: d.created_at,
  }));
}

export async function createDoctor(
  doc: Omit<Doctor, "id" | "created_at">
): Promise<Doctor> {
  const newId = `doc-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...doc, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("doctors")
    .insert({
      user_id: doc.user_id,
      name: doc.name,
      specialty: doc.specialty,
      clinic_name: doc.clinic_name,
      phone: doc.phone,
      email: doc.email,
      address: doc.address,
      notes: doc.notes,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...doc, id: newId, created_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    specialty: data.specialty,
    clinic_name: data.clinic_name || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    notes: data.notes || undefined,
    created_at: data.created_at,
  };
}

export async function createAppointment(
  apt: Omit<Appointment, "id" | "created_at">
): Promise<Appointment> {
  const newId = `apt-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...apt, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: apt.user_id,
      doctor_id: apt.doctor_id,
      doctor_name: apt.doctor_name,
      specialty: apt.specialty,
      clinic_or_hospital: apt.clinic_or_hospital,
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      reason: apt.reason,
      location: apt.location,
      status: apt.status,
      consultation_notes: apt.consultation_notes,
      preparation_questions: apt.preparation_questions,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...apt, id: newId, created_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    doctor_id: data.doctor_id || undefined,
    doctor_name: data.doctor_name,
    specialty: data.specialty,
    clinic_or_hospital: data.clinic_or_hospital,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    reason: data.reason,
    location: data.location || undefined,
    status: data.status,
    consultation_notes: data.consultation_notes || undefined,
    preparation_questions: data.preparation_questions || undefined,
    created_at: data.created_at,
  };
}
