import { createClient, isSupabaseConfigured } from "../client";
import { DoctorProfile, ClinicStaff } from "@/types/doctor-portal";

/**
 * Fetch a doctor's profile by user_id
 */
export async function getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
  if (!userId || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    // Optional fallback to server endpoint if client query is blocked by race conditions
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/doctor/profile/get?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.profile) {
            return json.profile as DoctorProfile;
          }
        }
      } catch {
        // Fallback quiet
      }
    }
    return null;
  }

  return data as unknown as DoctorProfile;
}

/**
 * Fetch clinic staff associations for a user
 */
export async function getClinicStaff(userId: string): Promise<ClinicStaff[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_staff")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error || !data) {
    return [];
  }

  return data as unknown as ClinicStaff[];
}

/**
 * Register a new doctor profile (trigger forces status to 'pending')
 */
export async function registerDoctorProfile(payload: {
  userId: string;
  fullName: string;
  bmdcNumber: string;
  specialty: string;
  qualifications?: string;
  chamberInfo?: Record<string, any>;
}): Promise<{ success: boolean; profile?: DoctorProfile; error?: string }> {
  if (!payload.userId || !isSupabaseConfigured()) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .insert({
      user_id: payload.userId,
      full_name: payload.fullName,
      bmdc_number: payload.bmdcNumber.trim().toUpperCase(),
      specialty: payload.specialty,
      qualifications: payload.qualifications || null,
      chamber_info: payload.chamberInfo || {},
      verification_status: "pending",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data as unknown as DoctorProfile };
}
