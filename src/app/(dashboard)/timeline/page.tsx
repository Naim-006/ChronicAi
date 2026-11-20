"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Building,
  X,
  History,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TimelineEvent, TimelineEventType } from "@/types/medical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  getTimelineEvents,
  createTimelineEvent,
} from "@/lib/supabase/services/timeline";
import { useRealtimeTable } from "@/hooks/useRealtime";

export default function TimelinePage() {
  const { effectiveUserId } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
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

  const loadTimeline = React.useCallback(async () => {
    if (!effectiveUserId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await getTimelineEvents(effectiveUserId);
      setEvents(data || []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Realtime subscription: syncs longitudinal care timeline events live
  useRealtimeTable({
    table: "timeline_events",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadTimeline();
    },
  });

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase())) ||
      (ev.facility_or_doctor && ev.facility_or_doctor.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || ev.event_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !effectiveUserId) return;

    setIsSubmitting(true);
    try {
      const newEv = await createTimelineEvent({
        user_id: effectiveUserId,
        event_type: type,
        title,
        description: desc || undefined,
        event_date: date,
        facility_or_doctor: facility || "Self-Reported",
        is_verified: true,
      });

      setEvents((prev) => [newEv, ...prev]);
      setShowAddModal(false);
      setTitle("");
      setDesc("");
      setFacility("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventBadge = (t: TimelineEventType) => {
    switch (t) {
      case "visit":
        return { label: "DOCTOR VISIT", color: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900" };
      case "lab_test":
        return { label: "LAB REPORT", color: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900" };
      case "medication_start":
        return { label: "MEDICATION REFILL", color: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900" };
      case "diagnosis":
        return { label: "DIAGNOSIS CONFIRMED", color: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900" };
      default:
        return { label: "CLINICAL RECORD", color: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">Timeline</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {events.length} health events in order, newest first
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add event
        </Button>
      </div>

      {showAddModal && (
        <div className="soft-card-lift space-y-4 border-emerald-200 dark:border-emerald-800 p-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-sm font-extrabold text-[var(--foreground)]">
              Add timeline entry
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block font-bold text-[var(--foreground)]">
                Event title *
              </label>
              <Input
                required
                placeholder="e.g. Ophthalmology Retinal Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimelineEventType)}
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-transparent px-3 text-xs text-[var(--foreground)]"
                >
                  <option value="visit" className="bg-[var(--card)] text-[var(--foreground)]">Doctor Visit</option>
                  <option value="lab_test" className="bg-[var(--card)] text-[var(--foreground)]">Lab Report</option>
                  <option value="medication_start" className="bg-[var(--card)] text-[var(--foreground)]">Medication Refill</option>
                  <option value="diagnosis" className="bg-[var(--card)] text-[var(--foreground)]">Diagnosis</option>
                  <option value="other" className="bg-[var(--card)] text-[var(--foreground)]">Other Record</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block font-bold text-[var(--foreground)]">
                Doctor / Facility
              </label>
              <Input
                placeholder="e.g. City Eye Center"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-[var(--foreground)]">Notes</label>
              <Input
                placeholder="Brief summary of findings or instructions"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save entry"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Hero Overview */}
      <section className="soft-card forest-surface overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
              Longitudinal EMR Timeline
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-white">
              {events.length} Health Milestones
            </h2>
            <p className="mt-1 text-xs text-white/80">
              Chronological record of lab tests, prescriptions, doctor encounters, and vital alerts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-800 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs">
              LIVE DATA FEED
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
        {[
          { id: "all", label: "All Events" },
          { id: "visit", label: "Doctor Visits" },
          { id: "lab_test", label: "Lab Reports" },
          { id: "medication_start", label: "Medication Refills" },
          { id: "diagnosis", label: "Diagnoses" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setTypeFilter(cat.id)}
            className={`cursor-pointer whitespace-nowrap rounded-2xl px-4 py-1.5 text-xs font-bold transition-all ${
              typeFilter === cat.id
                ? "bg-[var(--forest)] text-white shadow-sm"
                : "border border-[var(--border)] bg-white dark:bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Event feed */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="soft-card flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="soft-card p-12 text-center space-y-2">
            <History className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">No timeline events found</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Upload medical documents or click &quot;Add event&quot; to build your health history.
            </p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const badge = getEventBadge(ev.event_type);
            return (
              <article
                key={ev.id}
                className="soft-card space-y-3 p-5 transition-all hover:border-emerald-200 dark:hover:border-emerald-800"
              >
                <div className="flex flex-col justify-between gap-2 border-b border-[var(--border)]/80 pb-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                      {ev.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[var(--muted-foreground)]">
                    {formatDate(ev.event_date)}
                  </span>
                </div>

                {ev.description && (
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {ev.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-[var(--foreground)]">
                    <Building className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    {ev.facility_or_doctor || "Self-Reported"}
                  </span>

                  {ev.document_id ? (
                    <Link
                      href="/vault"
                      className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>View in Vault →</span>
                    </Link>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Self-Logged Event</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
