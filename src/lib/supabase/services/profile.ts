import { createClient, isSupabaseConfigured } from "../client";
import { HealthProfile } from "@/types/medical";
import { mockProfile } from "@/lib/mock-data";

export async function getHealthProfile(userId: string): Promise<HealthProfile> {
  if (!isSupabaseConfigured()) {
    return mockProfile;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { ...mockProfile, user_id: userId };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth || undefined,
    sex: data.sex || undefined,
    blood_group: data.blood_group || undefined,
    height_cm: data.height_cm ? Number(data.height_cm) : undefined,
    weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
    emergency_contact: (data.emergency_contact as any) || undefined,
    allergies: (data.allergies as any) || [],
    chronic_conditions: (data.chronic_conditions as any) || [],
    preferences: (data.preferences as any) || {
      language: "en",
      explanation_depth: "balanced",
      notifications_enabled: true,
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateHealthProfile(
  userId: string,
  updates: Partial<HealthProfile>
): Promise<HealthProfile> {
  if (!isSupabaseConfigured()) {
    return { ...mockProfile, ...updates };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("health_profiles")
    .update({
      full_name: updates.full_name,
      date_of_birth: updates.date_of_birth,
      sex: updates.sex,
      blood_group: updates.blood_group,
      height_cm: updates.height_cm,
      weight_kg: updates.weight_kg,
      emergency_contact: (updates.emergency_contact as any) || undefined,
      allergies: (updates.allergies as any) || undefined,
      chronic_conditions: (updates.chronic_conditions as any) || undefined,
      preferences: (updates.preferences as any) || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return { ...mockProfile, ...updates };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth || undefined,
    sex: data.sex || undefined,
    blood_group: data.blood_group || undefined,
    height_cm: data.height_cm ? Number(data.height_cm) : undefined,
    weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
    emergency_contact: (data.emergency_contact as any) || undefined,
    allergies: (data.allergies as any) || [],
    chronic_conditions: (data.chronic_conditions as any) || [],
    preferences: (data.preferences as any) || {
      language: "en",
      explanation_depth: "balanced",
      notifications_enabled: true,
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
