import { createClient, isSupabaseConfigured } from "../client";
import { AuditLog } from "@/types/medical";

export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("log_audit_event", {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details as any,
    });

    if (error) {
      console.warn("Audit log RPC error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Failed to log audit event:", err);
    return null;
  }
}

export async function getAuditLogs(userId: string, limit = 50): Promise<AuditLog[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    user_id: d.user_id || undefined,
    action: d.action,
    resource_type: d.resource_type,
    resource_id: d.resource_id || undefined,
    ip_address: d.ip_address || undefined,
    user_agent: d.user_agent || undefined,
    details: (d.details as Record<string, unknown>) || undefined,
    created_at: d.created_at,
  }));
}
