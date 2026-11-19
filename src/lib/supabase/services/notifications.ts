import { createClient, isSupabaseConfigured } from "../client";
import { ClinicalNotification } from "@/types/medical";
import { mockNotifications } from "@/lib/mock-data";

export async function getClinicalNotifications(userId: string): Promise<ClinicalNotification[]> {
  if (!isSupabaseConfigured()) {
    return mockNotifications;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinical_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return mockNotifications;
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
