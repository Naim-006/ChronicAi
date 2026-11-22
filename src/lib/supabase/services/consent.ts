import { createClient, isSupabaseConfigured } from "../client";
import { GrantScopeCategory } from "@/types/doctor-portal";

export interface PatientIdentifierResult {
  patient_code: string;
  qr_token: string;
}

export interface DetailedAccessRequest {
  id: string;
  doctor_id: string;
  requested_scope: GrantScopeCategory[];
  message: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  doctor?: {
    id: string;
    full_name: string;
    specialty: string;
    bmdc_number: string;
    chamber_info: any;
  } | null;
}

export interface DetailedAccessGrant {
  id: string;
  doctor_id: string;
  request_id: string | null;
  scope: GrantScopeCategory[];
  created_at: string;
  expires_at: string;
  doctor?: {
    id: string;
    full_name: string;
    specialty: string;
    bmdc_number: string;
    chamber_info: any;
  } | null;
}

/**
 * Ensures or rotates permanent patient identifier & QR token
 */
export async function getPatientIdentifier(
  regenerate = false
): Promise<PatientIdentifierResult | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("ensure_patient_identifier", {
    p_regenerate: regenerate,
  });

  if (error || !data || data.length === 0) {
    console.error("Error in ensure_patient_identifier:", error);
    return null;
  }

  return {
    patient_code: data[0].patient_code,
    qr_token: data[0].qr_token,
  };
}

/**
 * Fetch pending access requests for the logged in patient
 */
export async function getPatientAccessRequests(): Promise<DetailedAccessRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("access_requests")
    .select(`
      id,
      doctor_id,
      requested_scope,
      message,
      status,
      created_at,
      expires_at,
      doctor_profiles (
        id,
        full_name,
        specialty,
        bmdc_number,
        chamber_info
      )
    `)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Error fetching access requests:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    doctor_id: item.doctor_id,
    requested_scope: item.requested_scope,
    message: item.message,
    status: item.status,
    created_at: item.created_at,
    expires_at: item.expires_at,
    doctor: item.doctor_profiles || null,
  }));
}

/**
 * Fetch active access grants for the logged in patient
 */
export async function getPatientAccessGrants(): Promise<DetailedAccessGrant[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("access_grants")
    .select(`
      id,
      doctor_id,
      request_id,
      scope,
      created_at,
      expires_at,
      doctor_profiles (
        id,
        full_name,
        specialty,
        bmdc_number,
        chamber_info
      )
    `)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Error fetching access grants:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    doctor_id: item.doctor_id,
    request_id: item.request_id,
    scope: item.scope,
    created_at: item.created_at,
    expires_at: item.expires_at,
    doctor: item.doctor_profiles || null,
  }));
}

/**
 * Patient responds to an access request (Approve or Reject)
 */
export async function respondToAccessRequest(payload: {
  requestId: string;
  approve: boolean;
  scope?: GrantScopeCategory[];
  expiresAt?: string;
}): Promise<{ success: boolean; grantId?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("respond_access_request", {
    p_request_id: payload.requestId,
    p_approve: payload.approve,
    p_scope: payload.scope && payload.scope.length > 0 ? payload.scope : null,
    p_expires_at: payload.expiresAt || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, grantId: data };
}

/**
 * Patient 1-click revoke an access grant
 */
export async function revokeAccessGrant(grantId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("revoke_access_grant", {
    p_grant_id: grantId,
  });

  if (error) {
    console.error("Error in revoke_access_grant:", error);
    return false;
  }

  return Boolean(data);
}

/**
 * Doctor submits an access request using a patient code
 */
export async function doctorRequestAccessByCode(payload: {
  patientCode: string;
  requestedScope?: GrantScopeCategory[];
  message?: string;
}): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Database not configured" };
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("request_access_by_code", {
    p_code: payload.patientCode.trim(),
    p_requested_scope: payload.requestedScope && payload.requestedScope.length > 0 ? payload.requestedScope : null,
    p_message: payload.message?.trim() || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, status: data?.status || "submitted" };
}

/**
 * Doctor lists all requests they submitted
 */
export async function doctorListAccessRequests(): Promise<any[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("doctor_list_access_requests");
  if (error || !data) {
    console.warn("Error in doctor_list_access_requests:", error);
    return [];
  }

  return data;
}
