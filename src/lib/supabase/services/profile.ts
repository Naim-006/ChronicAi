import { createClient, isSupabaseConfigured } from "../client";
import { HealthProfile } from "@/types/medical";

export async function getHealthProfile(userId: string): Promise<HealthProfile | null> {
  if (!userId || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return {
      id: `prof-${userId}`,
      user_id: userId,
      full_name: "Patient",
      allergies: [],
      chronic_conditions: [],
      preferences: {
        language: "en",
        explanation_depth: "balanced",
        notifications_enabled: true,
        theme: "system",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name || "Patient",
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
      theme: "system",
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateHealthProfile(
  userId: string,
  updates: Partial<HealthProfile>
): Promise<HealthProfile> {
  const supabase = createClient();
  const payload: any = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (updates.full_name !== undefined) payload.full_name = updates.full_name;
  if (updates.date_of_birth !== undefined) payload.date_of_birth = updates.date_of_birth;
  if (updates.sex !== undefined) payload.sex = updates.sex;
  if (updates.blood_group !== undefined) payload.blood_group = updates.blood_group;
  if (updates.height_cm !== undefined) payload.height_cm = updates.height_cm;
  if (updates.weight_kg !== undefined) payload.weight_kg = updates.weight_kg;
  if (updates.emergency_contact !== undefined) payload.emergency_contact = updates.emergency_contact;
  if (updates.allergies !== undefined) payload.allergies = updates.allergies;
  if (updates.chronic_conditions !== undefined) payload.chronic_conditions = updates.chronic_conditions;
  if (updates.preferences !== undefined) payload.preferences = updates.preferences;

  const { data, error } = await supabase
    .from("health_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error || !data) {
    return {
      id: `prof-${userId}`,
      user_id: userId,
      full_name: updates.full_name || "Patient",
      date_of_birth: updates.date_of_birth,
      sex: updates.sex,
      blood_group: updates.blood_group,
      height_cm: updates.height_cm,
      weight_kg: updates.weight_kg,
      emergency_contact: updates.emergency_contact,
      allergies: updates.allergies || [],
      chronic_conditions: updates.chronic_conditions || [],
      preferences: updates.preferences || {
        language: "en",
        explanation_depth: "balanced",
        notifications_enabled: true,
        theme: "system",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
      theme: "system",
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
