import { createClient, isSupabaseConfigured } from "../client";
import { HealthMetric, MetricType } from "@/types/medical";

export async function getHealthMetrics(
  userId: string,
  metricType?: MetricType
): Promise<HealthMetric[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  let query = supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });

  if (metricType) {
    query = query.eq("metric_type", metricType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    document_id: m.document_id || undefined,
    metric_type: m.metric_type,
    value_primary: Number(m.value_primary),
    value_secondary: m.value_secondary ? Number(m.value_secondary) : undefined,
    unit: m.unit,
    context: m.context || undefined,
    reference_low: m.reference_low ? Number(m.reference_low) : undefined,
    reference_high: m.reference_high ? Number(m.reference_high) : undefined,
    is_abnormal: m.is_abnormal,
    recorded_at: m.recorded_at,
    notes: m.notes || undefined,
    created_at: m.created_at,
  }));
}

export async function logHealthMetric(
  metric: Omit<HealthMetric, "id" | "created_at">
): Promise<HealthMetric> {
  const newId = `metric-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { ...metric, id: newId, created_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("health_metrics")
    .insert({
      user_id: metric.user_id,
      document_id: metric.document_id,
      metric_type: metric.metric_type,
      value_primary: metric.value_primary,
      value_secondary: metric.value_secondary,
      unit: metric.unit,
      context: metric.context,
      reference_low: metric.reference_low,
      reference_high: metric.reference_high,
      is_abnormal: metric.is_abnormal,
      recorded_at: metric.recorded_at,
      notes: metric.notes,
    })
    .select()
    .single();

  if (error || !data) {
    return { ...metric, id: newId, created_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    document_id: data.document_id || undefined,
    metric_type: data.metric_type,
    value_primary: Number(data.value_primary),
    value_secondary: data.value_secondary ? Number(data.value_secondary) : undefined,
    unit: data.unit,
    context: data.context || undefined,
    reference_low: data.reference_low ? Number(data.reference_low) : undefined,
    reference_high: data.reference_high ? Number(data.reference_high) : undefined,
    is_abnormal: data.is_abnormal,
    recorded_at: data.recorded_at,
    notes: data.notes || undefined,
    created_at: data.created_at,
  };
}
