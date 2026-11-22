import { createClient, isSupabaseConfigured } from "../client";
import { VisitPriority, VisitTokenStatus, GrantScopeCategory } from "@/types/doctor-portal";

export interface QueueItem {
  id: string;
  serial_number: number;
  visit_date?: string;
  status: VisitTokenStatus;
  priority: VisitPriority;
  doctor_id: string;
  patient_id: string;
  patient_name?: string;
  patient_code?: string;
  triage?: any;
  created_at: string;
  called_at?: string | null;
  completed_at?: string | null;
  has_active_grant?: boolean;
}

export interface ClinicRecord {
  id: string;
  name: string;
  code: string | null;
  timezone: string;
  address?: string | null;
}

export interface AuthorizedPatientRecord {
  patient_id: string;
  patient_name: string;
  patient_code: string;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  sex?: string | null;
  blood_group?: string | null;
  grant_id: string;
  grant_scope: GrantScopeCategory[];
  grant_expires_at: string;
  last_visit_date?: string | null;
}

/**
 * Fetch clinics associated with the current staff/doctor
 */
export async function getDoctorClinics(): Promise<ClinicRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinics")
    .select("id, name, code, timezone, address");

  if (error || !data) {
    return [
      {
        id: "c0000000-0000-4000-8000-000000000001",
        name: "Dhaka Central Specialized Clinic",
        code: "DHK-SPEC-01",
        timezone: "Asia/Dhaka",
      },
    ];
  }

  return data as ClinicRecord[];
}

/**
 * Fetch clinic queue for a given clinic and date
 */
export async function getClinicQueue(
  clinicId: string,
  date?: string
): Promise<QueueItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();

  // Try RPC first
  try {
    const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)(
      "get_clinic_queue",
      {
        p_clinic_id: clinicId,
        p_date: date || null,
      }
    );

    if (!rpcErr && rpcData && Array.isArray(rpcData)) {
      // Map and check grant status for each patient
      const items: QueueItem[] = rpcData.map((row: any) => ({
        id: row.id,
        serial_number: row.serial_number,
        status: row.status as VisitTokenStatus,
        priority: row.priority as VisitPriority,
        doctor_id: row.doctor_id,
        patient_id: row.patient_id,
        patient_name: row.patient_name || `Patient #${row.serial_number}`,
        triage: row.triage,
        created_at: row.created_at,
        has_active_grant: false,
      }));

      // Enrich with access grants & patient codes
      if (items.length > 0) {
        const patientIds = items.map((i) => i.patient_id).filter(Boolean);

        const [grantsRes, codesRes] = await Promise.all([
          supabase
            .from("access_grants")
            .select("patient_id")
            .in("patient_id", patientIds)
            .is("revoked_at", null)
            .gt("expires_at", new Date().toISOString()),
          supabase
            .from("patient_identifiers")
            .select("user_id, patient_code")
            .in("user_id", patientIds),
        ]);

        const grantedSet = new Set<string>(
          (grantsRes.data || []).map((g: any) => g.patient_id)
        );
        const codeMap = new Map<string, string>(
          (codesRes.data || []).map((c: any) => [c.user_id, c.patient_code as string])
        );

        return items.map((i) => ({
          ...i,
          has_active_grant: grantedSet.has(i.patient_id),
          patient_code: codeMap.get(i.patient_id) || undefined,
        }));
      }

      return items;
    }
  } catch (err) {
    console.warn("RPC get_clinic_queue call failed, falling back to direct query:", err);
  }

  // Fallback direct query on visit_tokens
  const today = date || new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("visit_tokens")
    .select(`
      id,
      serial_number,
      visit_date,
      status,
      priority,
      doctor_id,
      patient_id,
      created_at,
      called_at,
      completed_at,
      triage
    `)
    .eq("clinic_id", clinicId)
    .eq("visit_date", today)
    .order("serial_number", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    serial_number: d.serial_number,
    visit_date: d.visit_date,
    status: d.status as VisitTokenStatus,
    priority: d.priority as VisitPriority,
    doctor_id: d.doctor_id,
    patient_id: d.patient_id,
    patient_name: `Patient #${d.serial_number}`,
    triage: d.triage,
    created_at: d.created_at,
    called_at: d.called_at,
    completed_at: d.completed_at,
    has_active_grant: false,
  }));
}

/**
 * Register a new clinic visit / issue daily serial
 */
export async function registerClinicVisit(payload: {
  clinicId: string;
  doctorId: string;
  patientCode: string;
  priority?: VisitPriority;
}): Promise<{
  success: boolean;
  serialNumber?: number;
  visitTokenId?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Database not configured" };
  }
  const supabase = createClient();

  const { data, error } = await (supabase.rpc as any)("register_visit", {
    p_clinic_id: payload.clinicId,
    p_doctor_id: payload.doctorId,
    p_patient_code: payload.patientCode.trim().toUpperCase(),
    p_priority: payload.priority || "normal",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    serialNumber: data?.serial_number,
    visitTokenId: data?.visit_token_id,
  };
}

/**
 * Update a visit token status (e.g. call patient or complete visit)
 */
export async function updateVisitTokenStatus(
  tokenId: string,
  newStatus: VisitTokenStatus
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();

  const updatePayload: Record<string, any> = {
    status: newStatus,
  };

  if (newStatus === "in_progress") {
    updatePayload.called_at = new Date().toISOString();
  } else if (newStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("visit_tokens")
    .update(updatePayload)
    .eq("id", tokenId);

  if (error) {
    console.error("Error updating visit token:", error);
    return false;
  }

  return true;
}

/**
 * Fetch patients who currently have an active access grant for the doctor
 */
export async function getAuthorizedPatients(
  doctorId: string,
  searchQuery?: string
): Promise<AuthorizedPatientRecord[]> {
  if (!doctorId || !isSupabaseConfigured()) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("access_grants")
    .select(`
      id,
      patient_id,
      scope,
      expires_at,
      created_at
    `)
    .eq("doctor_id", doctorId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return [];
  }

  const patientIds = (data as any[]).map((g: any) => g.patient_id);

  // Fetch profiles & identifiers
  const [profilesRes, codesRes, visitsRes] = await Promise.all([
    supabase
      .from("health_profiles")
      .select("user_id, full_name, avatar_url, date_of_birth, sex, blood_group")
      .in("user_id", patientIds),
    supabase
      .from("patient_identifiers")
      .select("user_id, patient_code")
      .in("user_id", patientIds),
    supabase
      .from("visit_tokens")
      .select("patient_id, visit_date")
      .eq("doctor_id", doctorId)
      .in("patient_id", patientIds)
      .order("visit_date", { ascending: false }),
  ]);

  const profileMap = new Map<string, any>(
    (profilesRes.data || []).map((p: any) => [p.user_id, p])
  );
  const codeMap = new Map<string, string>(
    (codesRes.data || []).map((c: any) => [c.user_id, c.patient_code as string])
  );

  const lastVisitMap = new Map<string, string>();
  (visitsRes.data || []).forEach((v: any) => {
    if (!lastVisitMap.has(v.patient_id)) {
      lastVisitMap.set(v.patient_id, v.visit_date);
    }
  });

  let records: AuthorizedPatientRecord[] = (data as any[]).map((grant: any) => {
    const prof = profileMap.get(grant.patient_id);
    const code = codeMap.get(grant.patient_id) || "CA-UNKNOWN";

    return {
      patient_id: grant.patient_id,
      patient_name: prof?.full_name || "Authorized Patient",
      patient_code: code,
      avatar_url: prof?.avatar_url || null,
      date_of_birth: prof?.date_of_birth || null,
      sex: prof?.sex || null,
      blood_group: prof?.blood_group || null,
      grant_id: grant.id,
      grant_scope: grant.scope as GrantScopeCategory[],
      grant_expires_at: grant.expires_at,
      last_visit_date: lastVisitMap.get(grant.patient_id) || null,
    };
  });

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    records = records.filter(
      (r) =>
        r.patient_name.toLowerCase().includes(q) ||
        r.patient_code.toLowerCase().includes(q)
    );
  }

  return records;
}
