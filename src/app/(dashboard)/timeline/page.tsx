"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Building,
  X,
  History,
  Loader2,
  Calendar,
  Stethoscope,
  Pill,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TimelineEvent, TimelineEventType, MedicalDocument, Appointment } from "@/types/medical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  getTimelineEvents,
  createTimelineEvent,
} from "@/lib/supabase/services/timeline";
import { getDocuments } from "@/lib/supabase/services/documents";
import { getAppointments } from "@/lib/supabase/services/appointments";
import { useRealtimeTables } from "@/hooks/useRealtime";

export default function TimelinePage() {
  const { effectiveUserId } = useAuth();
  const [manualEvents, setManualEvents] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TimelineEventType>("visit");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [facility, setFacility] = useState("");
  const [desc, setDesc] = useState("");

  const loadTimeline = useCallback(async () => {
    if (!effectiveUserId) {
      setManualEvents([]);
      setDocuments([]);
      setAppointments([]);
      setIsLoading(false);
      return;
    }
    try {
      const [tData, dData, aData] = await Promise.all([
        getTimelineEvents(effectiveUserId),
        getDocuments(effectiveUserId),
        getAppointments(effectiveUserId),
      ]);
      setManualEvents(tData || []);
      setDocuments(dData || []);
      setAppointments(aData || []);
    } catch {
      setManualEvents([]);
      setDocuments([]);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Realtime subscription: syncs timeline events, documents and appointments
  useRealtimeTables({
    tables: ["timeline_events", "medical_documents", "appointments"],
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadTimeline();
    },
  });

  // Synthesize unified longitudinal timeline
  const unifiedEvents = useMemo(() => {
    const list: TimelineEvent[] = [...manualEvents];

    // Add documents as timeline events if not already present
    documents.forEach((doc) => {
      const exists = list.some((e) => e.document_id === doc.id || (e.title === doc.file_name && e.event_date === doc.document_date));
      if (!exists) {
        let evType: TimelineEventType = "lab_test";
        if (doc.category === "prescription") evType = "medication_start";
        else if (doc.category === "doctor_note" || doc.category === "discharge_summary") evType = "visit";
        else if (doc.category === "imaging") evType = "imaging";

        list.push({
          id: `doc-${doc.id}`,
          user_id: doc.user_id,
          document_id: doc.id,
          event_type: evType,
          title: doc.file_name.replace(".pdf", "").replace(/_/g, " "),
          description: doc.summary,
          event_date: doc.document_date || doc.created_at.split("T")[0],
          facility_or_doctor: doc.doctor_name || doc.facility_name,
          is_verified: doc.status === "verified",
          created_at: doc.created_at,
        });
      }
    });

    // Add appointments as timeline events
    appointments.forEach((apt) => {
      const exists = list.some((e) => e.event_date === apt.appointment_date && e.facility_or_doctor === apt.doctor_name);
      if (!exists) {
        list.push({
          id: `apt-${apt.id}`,
          user_id: apt.user_id,
          event_type: "visit",
          title: `Consultation: ${apt.reason || "General Follow-up"}`,
          description: apt.clinic_or_hospital ? `${apt.specialty} at ${apt.clinic_or_hospital}` : apt.specialty,
          event_date: apt.appointment_date,
          facility_or_doctor: apt.doctor_name,
          is_verified: apt.status === "upcoming" || apt.status === "completed",
          created_at: apt.created_at,
        });
      }
    });

    // Sort descending by event_date
    return list.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }, [manualEvents, documents, appointments]);

  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((ev) => {
      const matchesSearch =
        search === "" ||
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        (ev.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (ev.facility_or_doctor || "").toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "visit" && ev.event_type === "visit") ||
        (typeFilter === "lab_test" && ev.event_type === "lab_test") ||
        (typeFilter === "medication_start" && ev.event_type === "medication_start") ||
        (typeFilter === "diagnosis" && ev.event_type === "diagnosis") ||
        (typeFilter === "imaging" && ev.event_type === "imaging");

      return matchesSearch && matchesType;
    });
  }, [unifiedEvents, search, typeFilter]);

  // Group events by Month & Year for clear chronological hierarchy
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    filteredEvents.forEach((ev) => {
      const dateObj = new Date(ev.event_date);
      const key = isNaN(dateObj.getTime())
        ? "Recent Events"
        : dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !effectiveUserId) return;

    setIsSubmitting(true);
    try {
      const newEv = await createTimelineEvent({
        user_id: effectiveUserId,
        title: title.trim(),
        event_type: type,
        event_date: date,
        facility_or_doctor: facility.trim() || undefined,
        description: desc.trim() || undefined,
        is_verified: true,
      });
      setManualEvents((prev) => [newEv, ...prev]);
      setShowAddModal(false);
      setTitle("");
      setFacility("");
      setDesc("");
    } catch (err) {
      console.error("Failed to add timeline event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventBadge = (t: TimelineEventType) => {
    switch (t) {
      case "visit":
        return {
          label: "Doctor Consultation",
          icon: Stethoscope,
          color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
        };
      case "lab_test":
        return {
          label: "Laboratory Investigation",
          icon: Activity,
          color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        };
      case "medication_start":
        return {
          label: "Prescription & Medication",
          icon: Pill,
          color: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        };
      case "diagnosis":
        return {
          label: "Diagnosis Confirmed",
          icon: CheckCircle2,
          color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        };
      case "imaging":
        return {
          label: "Diagnostic Imaging",
          icon: FileText,
          color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        };
      default:
        return {
          label: "Clinical Event",
          icon: FileText,
          color: "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Medical Timeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unified chronological journey of your doctor visits, prescriptions, and lab tests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddModal(true)} size="sm" className="cursor-pointer">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Manual Event Modal */}
      {showAddModal && (
        <div className="glass-card p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              Add Timeline Milestone
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-900 dark:text-white">
                Milestone Title *
              </label>
              <Input
                required
                placeholder="e.g. Annual Cardiology Checkup & ECG"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-bold text-slate-900 dark:text-white">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimelineEventType)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="visit">Doctor Visit</option>
                  <option value="lab_test">Lab Report</option>
                  <option value="medication_start">Prescription / Refill</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="imaging">Imaging (X-Ray, MRI, USG)</option>
                  <option value="note">Clinical Note</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-900 dark:text-white">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-900 dark:text-white">
                Physician / Hospital
              </label>
              <Input
                placeholder="e.g. CMH Dhaka, Dr. Salim Yazdi"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-900 dark:text-white">Clinical Notes</label>
              <Input
                placeholder="Key findings, instructions, or recommendations"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save to Timeline"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Card */}
      <section className="glass-card p-5 sm:p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Verified Longitudinal Record
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {unifiedEvents.length} Clinical Milestones Recorded
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Automatically synchronized from your uploaded medical documents, verified diagnostic lab reports, and doctor consultations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/vault"
            className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors cursor-pointer"
          >
            Vault Documents ({documents.length})
          </Link>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
        {[
          { id: "all", label: "All Milestones" },
          { id: "lab_test", label: "Lab Investigations" },
          { id: "medication_start", label: "Prescriptions" },
          { id: "visit", label: "Doctor Consultations" },
          { id: "imaging", label: "Imaging" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setTypeFilter(cat.id)}
            className={`cursor-pointer whitespace-nowrap rounded-2xl px-4 py-1.5 text-xs font-bold transition-all ${
              typeFilter === cat.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chronological Event Feed */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="glass-card flex items-center justify-center p-12 rounded-3xl">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3 rounded-3xl border border-slate-200 dark:border-white/10">
            <History className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No milestones found for this filter
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload a prescription or lab report in Vault to automatically populate your medical timeline.
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([monthYear, evList]) => (
            <div key={monthYear} className="space-y-3">
              {/* Month Header Pill */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                  {monthYear}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>

              {/* Events in Month */}
              <div className="space-y-3 pl-2 border-l-2 border-emerald-500/20 ml-3">
                {evList.map((ev) => {
                  const badge = getEventBadge(ev.event_type);
                  const Icon = badge.icon;
                  return (
                    <article
                      key={ev.id}
                      className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2.5 transition-all hover:border-emerald-400/50 hover:shadow-xs relative"
                    >
                      {/* Timeline dot */}
                      <span className="absolute -left-[19px] top-5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#070d18]" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                          >
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </span>
                          {ev.is_verified && (
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ev.event_date)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {ev.title}
                        </h3>
                        {ev.facility_or_doctor && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Building className="h-3 w-3" />
                            <span>{ev.facility_or_doctor}</span>
                          </div>
                        )}
                        {ev.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      {/* Source Document Link */}
                      {ev.document_id && (
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end">
                          <Link
                            href="/vault"
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>Inspect Source Record in Vault</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
