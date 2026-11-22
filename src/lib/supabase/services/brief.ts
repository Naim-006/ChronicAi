import { createClient } from "../client";

export interface CitationItem {
  id: string;
  title: string;
  category: string;
  date: string;
  snippet: string;
}

export interface RedFlagAlert {
  severity: "critical" | "warning";
  message: string;
  citation: string;
}

export interface PreVisitBriefData {
  patientSnapshot: {
    fullName: string;
    dateOfBirth?: string | null;
    sex?: string | null;
    bloodGroup?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    chronicConditions?: any[];
    allergies?: any[];
  };
  adherence: {
    rate: number;
    takenDoses: number;
    totalDoses: number;
  };
  metricsSnapshot: Array<{
    id: string;
    type: string;
    value: number;
    unit?: string;
    isAbnormal?: boolean;
    recordedAt: string;
  }>;
  activeMedications: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
  }>;
  recentDocuments: Array<{
    id: string;
    file_name: string;
    category?: string;
    document_date?: string;
    facility_name?: string;
    summary?: string;
  }>;
  summaryMarkdown: string;
  redFlags: RedFlagAlert[];
  citations: CitationItem[];
}

export interface BriefResponse {
  success: boolean;
  cached?: boolean;
  generatedAt?: string;
  data?: PreVisitBriefData;
  citations?: CitationItem[];
  redFlags?: RedFlagAlert[];
  error?: string;
  message?: string;
}

/**
 * Request an AI Pre-Visit Brief for a patient
 */
export async function fetchPreVisitBrief(
  patientId: string,
  forceRefresh = false
): Promise<BriefResponse> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || "";
  const userId = sessionData?.session?.user?.id || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const res = await fetch("/api/doctor/brief", {
    method: "POST",
    headers,
    body: JSON.stringify({ patientId, forceRefresh }),
  });

  return await res.json();
}

/**
 * Authorize and retrieve a 60-second signed URL for a patient document
 */
export async function authorizeDocumentDownload(
  documentId: string
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || "";
  const userId = sessionData?.session?.user?.id || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const res = await fetch("/api/doctor/document-auth", {
    method: "POST",
    headers,
    body: JSON.stringify({ documentId }),
  });

  return await res.json();
}
