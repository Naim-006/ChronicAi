import { createClient, isSupabaseConfigured } from "../client";
import { TimelineEvent } from "@/types/medical";

export async function getTimelineEvents(userId: string): Promise<TimelineEvent[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((e: any) => ({
    id: e.id,
    user_id: e.user_id,
    document_id: e.document_id || undefined,
    event_type: e.event_type,
    title: e.title,
    description: e.description || undefined,
    event_date: e.event_date,
    facility_or_doctor: e.facility_or_doctor || undefined,
    is_verified: e.is_verified,
    metadata: (e.metadata as Record<string, unknown>) || undefined,
    created_at: e.created_at,
  }));
}

export async function createTimelineEvent(
  ev: Omit<TimelineEvent, "id" | "created_at">
): Promise<TimelineEvent> {
  const newId = `ev-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...ev, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("timeline_events")
    .insert({
      user_id: ev.user_id,
      document_id: ev.document_id,
      event_type: ev.event_type,
      title: ev.title,
      description: ev.description,
      event_date: ev.event_date,
      facility_or_doctor: ev.facility_or_doctor,
      is_verified: ev.is_verified,
      metadata: (ev.metadata as any) || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...ev, id: newId, created_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    document_id: data.document_id || undefined,
    event_type: data.event_type,
    title: data.title,
    description: data.description || undefined,
    event_date: data.event_date,
    facility_or_doctor: data.facility_or_doctor || undefined,
    is_verified: data.is_verified,
    metadata: (data.metadata as Record<string, unknown>) || undefined,
    created_at: data.created_at,
  };
}
