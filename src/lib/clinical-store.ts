import {
  HealthProfile,
  HealthMetric,
  Medication,
  MedicationLog,
  Appointment,
  TimelineEvent,
  MedicalDocument,
  ExtractedRecord,
} from "@/types/medical";
import {
  mockProfile,
  mockHealthMetrics,
  mockMedications,
  mockMedicationLogs,
  mockAppointments,
  mockTimelineEvents,
  mockDocuments,
  mockExtractedRecords,
} from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

/**
 * Universal Clinical Repository
 *
 * Supports two operating modes:
 * 1. Live Supabase Backend: queries PostgreSQL with Row-Level Security when Supabase is configured.
 * 2. In-Memory Resilient Store: provides instant, zero-setup, fully-functional state with
 *    in-memory persistence during development, unit testing, and offline hackathon demos.
 */
class ClinicalStore {
  // In-memory state containers seeded with comprehensive medical records
  private profile: HealthProfile = { ...mockProfile };
  private metrics: HealthMetric[] = [...mockHealthMetrics];
  private medications: Medication[] = [...mockMedications];
  private medicationLogs: MedicationLog[] = [...mockMedicationLogs];
  private appointments: Appointment[] = [...mockAppointments];
  private timelineEvents: TimelineEvent[] = [...mockTimelineEvents];
  private documents: MedicalDocument[] = [...mockDocuments];
  private extractedRecords: ExtractedRecord[] = [...mockExtractedRecords];

  private isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!url && !url.includes("placeholder") && !url.includes("example");
  }

  // --- HEALTH PROFILE ---
  async getProfile(): Promise<HealthProfile> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.from("profiles").select("*").single();
        if (!error && data) return data as HealthProfile;
      } catch (err) {
        console.warn("[ClinicalStore] Supabase getProfile failed, using store:", err);
      }
    }
    return this.profile;
  }

  async updateProfile(updates: Partial<HealthProfile>): Promise<HealthProfile> {
    this.profile = { ...this.profile, ...updates, updated_at: new Date().toISOString() };
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from("profiles").upsert(this.profile);
      } catch (err) {
        console.warn("[ClinicalStore] Supabase updateProfile failed:", err);
      }
    }
    return this.profile;
  }

  // --- HEALTH METRICS ---
  async getMetrics(type?: string): Promise<HealthMetric[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        let query = supabase.from("health_metrics").select("*").order("recorded_at", { ascending: false });
        if (type && type !== "all") query = query.eq("metric_type", type);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as HealthMetric[];
      } catch (err) {
        console.warn("[ClinicalStore] Supabase getMetrics failed, using store:", err);
      }
    }
    if (type && type !== "all") {
      return this.metrics.filter((m) => m.metric_type === type);
    }
    return this.metrics;
  }

  async addMetric(metric: Omit<HealthMetric, "id" | "created_at" | "user_id">): Promise<HealthMetric> {
    const newMetric: HealthMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
      user_id: this.profile.user_id,
      created_at: new Date().toISOString(),
      recorded_at: metric.recorded_at || new Date().toISOString(),
    };
    this.metrics.unshift(newMetric);

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from("health_metrics").insert(newMetric);
      } catch (err) {
        console.warn("[ClinicalStore] Supabase addMetric failed:", err);
      }
    }
    return newMetric;
  }

  // --- MEDICATIONS & ADHERENCE ---
  async getMedications(status?: string): Promise<Medication[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        let query = supabase.from("medications").select("*");
        if (status) query = query.eq("status", status);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Medication[];
      } catch (err) {
        console.warn("[ClinicalStore] Supabase getMedications failed, using store:", err);
      }
    }
    if (status) return this.medications.filter((m) => m.status === status);
    return this.medications;
  }

  async logMedication(log: Omit<MedicationLog, "id" | "created_at" | "user_id">): Promise<MedicationLog> {
    const newLog: MedicationLog = {
      id: `log-${Date.now()}`,
      user_id: this.profile.user_id,
      created_at: new Date().toISOString(),
      recorded_time: new Date().toISOString(),
      ...log,
    };
    this.medicationLogs.unshift(newLog);

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from("medication_logs").insert(newLog);
      } catch (err) {
        console.warn("[ClinicalStore] Supabase logMedication failed:", err);
      }
    }
    return newLog;
  }

  // --- APPOINTMENTS ---
  async getAppointments(): Promise<Appointment[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.from("appointments").select("*, doctors(*)").order("appointment_date", { ascending: true });
        if (!error && data && data.length > 0) return data as Appointment[];
      } catch (err) {
        console.warn("[ClinicalStore] Supabase getAppointments failed, using store:", err);
      }
    }
    return this.appointments;
  }

  async addAppointment(appt: Omit<Appointment, "id" | "created_at" | "user_id">): Promise<Appointment> {
    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      user_id: this.profile.user_id,
      created_at: new Date().toISOString(),
      ...appt,
    };
    this.appointments.unshift(newAppt);

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from("appointments").insert(newAppt);
      } catch (err) {
        console.warn("[ClinicalStore] Supabase addAppointment failed:", err);
      }
    }
    return newAppt;
  }

  // --- TIMELINE EVENTS ---
  async getTimelineEvents(): Promise<TimelineEvent[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.from("timeline_events").select("*").order("event_date", { ascending: false });
        if (!error && data && data.length > 0) return data as TimelineEvent[];
      } catch (err) {
        console.warn("[ClinicalStore] Supabase getTimelineEvents failed, using store:", err);
      }
    }
    return this.timelineEvents;
  }

  async addTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at" | "user_id">): Promise<TimelineEvent> {
    const newEvent: TimelineEvent = {
      id: `event-${Date.now()}`,
      user_id: this.profile.user_id,
      created_at: new Date().toISOString(),
      ...event,
    };
    this.timelineEvents.unshift(newEvent);

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from("timeline_events").insert(newEvent);
      } catch (err) {
        console.warn("[ClinicalStore] Supabase addTimelineEvent failed:", err);
      }
    }
    return newEvent;
  }

  // --- DOCUMENTS & VAULT ---
  async getDocuments(): Promise<MedicalDocument[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) return data as MedicalDocument[];
      } catch (err) {
        console.warn("[ClinicalStore] Supabase getDocuments failed, using store:", err);
      }
    }
    return this.documents;
  }

  async addDocument(doc: Omit<MedicalDocument, "id" | "created_at" | "user_id">): Promise<MedicalDocument> {
    const newDoc: MedicalDocument = {
      id: `doc-${Date.now()}`,
      user_id: this.profile.user_id,
      created_at: new Date().toISOString(),
      ...doc,
    };
    this.documents.unshift(newDoc);

    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from("documents").insert(newDoc);
      } catch (err) {
        console.warn("[ClinicalStore] Supabase addDocument failed:", err);
      }
    }
    return newDoc;
  }
}

export const clinicalStore = new ClinicalStore();
