import { createClient, isSupabaseConfigured } from "../client";
import { HealthProfile } from "@/types/medical";

export async function getHealthProfile(userId: string): Promise<HealthProfile | null> {
  if (!userId || !isSupabaseConfigured()) {
    return null;
  }

  // Try direct browser client first
  const supabase = createClient();
  let { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // If client query returned no data (e.g. session token attaching delay or RLS handshake), fetch via server API
  if ((error || !data) && typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/profile/get?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          return json.profile;
        }
      }
    } catch (apiErr) {
      console.warn("Failed to fetch profile via API fallback:", apiErr);
    }
  }

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

  const rawPrefs = (data.preferences as any) || {
    language: "en",
    explanation_depth: "balanced",
    notifications_enabled: true,
    theme: "system",
  };
  const resolvedAvatar = data.avatar_url || rawPrefs.avatar_url || undefined;

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name || "Patient",
    avatar_url: resolvedAvatar,
    date_of_birth: data.date_of_birth || undefined,
    sex: data.sex || undefined,
    blood_group: data.blood_group || undefined,
    height_cm: data.height_cm ? Number(data.height_cm) : undefined,
    weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
    emergency_contact: (data.emergency_contact as any) || undefined,
    allergies: (data.allergies as any) || [],
    chronic_conditions: (data.chronic_conditions as any) || [],
    preferences: rawPrefs,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateHealthProfile(
  userId: string,
  updates: Partial<HealthProfile>
): Promise<HealthProfile> {
  // If in browser context, use the server API endpoint for guaranteed database persistence
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          return json.profile;
        }
      }
    } catch (apiErr) {
      console.warn("Server profile update API error, falling back to direct client update:", apiErr);
    }
  }

  const supabase = createClient();
  const payload: any = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (updates.full_name !== undefined) payload.full_name = updates.full_name;
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
  if (updates.date_of_birth !== undefined) payload.date_of_birth = updates.date_of_birth;
  if (updates.sex !== undefined) payload.sex = updates.sex;
  if (updates.blood_group !== undefined) payload.blood_group = updates.blood_group;
  if (updates.height_cm !== undefined) payload.height_cm = updates.height_cm;
  if (updates.weight_kg !== undefined) payload.weight_kg = updates.weight_kg;
  if (updates.emergency_contact !== undefined) payload.emergency_contact = updates.emergency_contact;
  if (updates.allergies !== undefined) payload.allergies = updates.allergies;
  if (updates.chronic_conditions !== undefined) payload.chronic_conditions = updates.chronic_conditions;
  if (updates.preferences !== undefined) {
    payload.preferences = {
      ...updates.preferences,
      ...(updates.avatar_url ? { avatar_url: updates.avatar_url } : {}),
    };
  } else if (updates.avatar_url) {
    payload.preferences = { avatar_url: updates.avatar_url };
  }

  // Also update Supabase Auth user metadata so user session always holds avatar_url
  if (updates.avatar_url) {
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: updates.avatar_url },
      });
    } catch {
      // Ignored if session is restricted
    }
  }

  // Try update first (row almost always exists)
  let { data, error } = await supabase
    .from("health_profiles")
    .update(payload)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  // If no row existed, insert
  if (!error && !data) {
    const insertRes = await supabase
      .from("health_profiles")
      .insert({
        ...payload,
        full_name: payload.full_name || "Patient",
      })
      .select()
      .single();
    data = insertRes.data;
    error = insertRes.error;
  }

  const rawPrefs = (data?.preferences as any) || (payload.preferences as any) || {};
  const resolvedAvatar = data?.avatar_url || rawPrefs?.avatar_url || updates.avatar_url;

  if (error || !data) {
    return {
      id: `prof-${userId}`,
      user_id: userId,
      full_name: updates.full_name || "Patient",
      avatar_url: resolvedAvatar,
      date_of_birth: updates.date_of_birth,
      sex: updates.sex,
      blood_group: updates.blood_group,
      height_cm: updates.height_cm,
      weight_kg: updates.weight_kg,
      emergency_contact: updates.emergency_contact,
      allergies: updates.allergies || [],
      chronic_conditions: updates.chronic_conditions || [],
      preferences: rawPrefs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name,
    avatar_url: resolvedAvatar,
    date_of_birth: data.date_of_birth || undefined,
    sex: data.sex || undefined,
    blood_group: data.blood_group || undefined,
    height_cm: data.height_cm ? Number(data.height_cm) : undefined,
    weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
    emergency_contact: (data.emergency_contact as any) || undefined,
    allergies: (data.allergies as any) || [],
    chronic_conditions: (data.chronic_conditions as any) || [],
    preferences: rawPrefs,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
