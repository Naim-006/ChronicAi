import { createClient, isSupabaseConfigured } from "../client";
import { ClinicalNotification } from "@/types/medical";

export async function getClinicalNotifications(userId: string): Promise<ClinicalNotification[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinical_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((n: any) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    severity: n.severity,
    source_trigger: n.source_trigger,
    link_href: n.link_href || undefined,
    link_label: n.link_label || undefined,
    is_read: n.is_read,
    is_dismissed: n.is_dismissed,
    created_at: n.created_at,
  }));
}

export async function createClinicalNotification(
  notif: Omit<ClinicalNotification, "id" | "created_at" | "is_read" | "is_dismissed"> & {
    is_read?: boolean;
    is_dismissed?: boolean;
  }
): Promise<ClinicalNotification> {
  const newId = `notif-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return {
      ...notif,
      id: newId,
      is_read: notif.is_read ?? false,
      is_dismissed: notif.is_dismissed ?? false,
      created_at: now,
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinical_notifications")
    .insert({
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      severity: notif.severity,
      source_trigger: notif.source_trigger,
      link_href: notif.link_href || null,
      link_label: notif.link_label || null,
      is_read: notif.is_read || false,
      is_dismissed: notif.is_dismissed || false,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      ...notif,
      id: newId,
      is_read: notif.is_read ?? false,
      is_dismissed: notif.is_dismissed ?? false,
      created_at: now,
    };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    severity: data.severity,
    source_trigger: data.source_trigger,
    link_href: data.link_href || undefined,
    link_label: data.link_label || undefined,
    is_read: data.is_read,
    is_dismissed: data.is_dismissed,
    created_at: data.created_at,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createClient();
  await supabase
    .from("clinical_notifications")
    .update({ is_read: true })
    .eq("id", id);
}

export async function dismissNotification(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createClient();
  await supabase
    .from("clinical_notifications")
    .update({ is_dismissed: true, is_read: true })
    .eq("id", id);
}
