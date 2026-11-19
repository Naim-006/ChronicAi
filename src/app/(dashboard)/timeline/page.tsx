"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Building,
  X,
} from "lucide-react";
import { mockTimelineEvents } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { TimelineEvent, TimelineEventType } from "@/types/medical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TimelineEventType>("visit");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [facility, setFacility] = useState("");
  const [desc, setDesc] = useState("");

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase())) ||
      (ev.facility_or_doctor && ev.facility_or_doctor.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || ev.event_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newEv: TimelineEvent = {
      id: `ev-${Date.now()}`,
      user_id: "user-elena-vance",
      event_type: type,
      title,
      description: desc,
      event_date: date,
      facility_or_doctor: facility || "Self-Reported",
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    setEvents((prev) => [newEv, ...prev]);
    setShowAddModal(false);
    setTitle("");
    setDesc("");
    setFacility("");
  };

  const getEventBadge = (t: TimelineEventType) => {
    switch (t) {
      case "visit":
        return { label: "DOCTOR VISIT", color: "bg-sky-50 text-sky-700 border-sky-100" };
      case "lab_test":
        return { label: "LAB REPORT", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "medication_start":
        return { label: "MEDICATION REFILL", color: "bg-amber-50 text-amber-700 border-amber-100" };
      case "diagnosis":
        return { label: "DIAGNOSIS CONFIRMED", color: "bg-rose-50 text-rose-700 border-rose-100" };
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
        <div className="soft-card-lift space-y-4 border-emerald-200 p-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-sm font-extrabold text-[var(--foreground)]">
              Add timeline entry
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimelineEventType)}
                  className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                >
                  <option value="visit">Doctor Visit</option>
                  <option value="lab_test">Lab Report</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="medication_start">Medication</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Event date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block font-bold text-[var(--foreground)]">
                Facility / clinician
              </label>
              <Input
                placeholder="e.g. Quest Diagnostics / Dr. Catherine Wei"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-[var(--foreground)]">
                Clinical notes
              </label>
              <textarea
                rows={2}
                placeholder="Diagnostic findings, lab values, or instructions..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-white p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
              />
            </div>
            <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save to timeline</Button>
            </div>
          </form>
        </div>
      )}

      {/* Featured lab result */}
      <div className="soft-card space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/80 pb-3">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Featured diagnostic · Quest Diagnostics
            </span>
            <h2 className="mt-0.5 text-base font-extrabold text-[var(--foreground)]">
              Glucose in Serum or Plasma [Mass/volume]
            </h2>
            <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
              November 2, 2026 · Boulder Community Health · Simon Jones, MD
            </span>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Normal
          </span>
        </div>

        <div className="soft-inset space-y-3 p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="block text-xs font-semibold text-[var(--muted-foreground)]">
                Fasting Serum Glucose
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[var(--foreground)]">91</span>
                <span className="text-xs font-bold text-[var(--muted-foreground)]">mg/dL</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">● Normal / Ideal</span>
          </div>

          <div className="relative pb-1 pt-3">
            <div className="relative h-3.5 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner">
              <div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-emerald-700 bg-white shadow-md ring-2 ring-emerald-200"
                style={{ left: "59%" }}
                title="Measured Value: 91 mg/dL"
              />
            </div>
            <div className="mt-1.5 flex justify-between px-1 text-[11px] font-bold text-[var(--muted-foreground)]">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150+</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)]/60 pt-2 text-xs">
            <span className="text-[var(--muted-foreground)]">
              Ideal range: <strong className="text-[var(--foreground)]">70 – 100 mg/dL</strong>
            </span>
            <Link href="/assistant" className="font-bold text-emerald-700 hover:underline">
              Learn more
            </Link>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="block text-xs font-semibold text-[var(--muted-foreground)]">
                Prior Screening (May 14, 2026)
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[var(--foreground)]">145</span>
                <span className="text-xs font-bold text-[var(--muted-foreground)]">mg/dL</span>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600">● Elevated</span>
          </div>

          <div className="relative pb-1 pt-3">
            <div className="relative h-3.5 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner">
              <div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-rose-600 bg-white shadow-md ring-2 ring-rose-200"
                style={{ left: "94%" }}
                title="Measured Value: 145 mg/dL"
              />
            </div>
            <div className="mt-1.5 flex justify-between px-1 text-[11px] font-bold text-[var(--muted-foreground)]">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150+</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-rose-100/60 pt-2 text-xs">
            <span className="text-[var(--muted-foreground)]">
              Improvement: <strong className="text-[var(--foreground)]">−54 mg/dL</strong> since Metformin
            </span>
            <span className="font-bold text-emerald-700">Marked progress</span>
          </div>
        </div>
      </div>

      {/* CareSight Multi-Tier Horizontal Branched Timeline (Image 4 Replica) */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-[var(--shadow-soft)] space-y-4 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[var(--foreground)] leading-tight truncate">
              CareSight Longitudinal Trajectory
            </h2>
            <span className="text-[11px] text-[var(--muted-foreground)] block">
              Multi-tier clinical milestone branch: Inpatient events, care orders, and active EMR feeds.
            </span>
          </div>

          {/* Quick Date Range Selectors */}
          <div className="flex items-center gap-1 text-[10px] font-bold overflow-x-auto pb-1 max-w-full hide-scrollbar">
            {["Last 30 Days", "Last 90 Days", "Last Year", "Last 5 Years", "All History"].map((r, i) => (
              <span
                key={r}
                className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  i === 2
                    ? "bg-[#18261F] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Visual Branched SVG / Node Spine */}
        <div className="relative py-4 overflow-x-auto max-w-full">
          <div className="min-w-[620px] relative px-4">
            {/* Top Branch: Inpatient & SNF Badges */}
            <div className="flex justify-between items-center pb-3 text-[10px] font-bold">
              <span className="rounded-lg bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-200">
                ADMISSION SNF · Valley
              </span>
              <span className="rounded-lg bg-rose-100 text-rose-900 px-2 py-0.5 border border-rose-200">
                HOSPITALIZATION · St. Jude
              </span>
              <span className="rounded-lg bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-200">
                ADMISSION SNF · Rehab
              </span>
            </div>

            {/* Central Timeline Spine Line */}
            <div className="relative h-2 w-full bg-slate-200 rounded-full my-3 flex items-center justify-between px-6">
              {/* Connected Dots */}
              {["2022", "2023", "2024", "2025", "2026"].map((yr, idx) => (
                <div key={yr} className="relative flex flex-col items-center">
                  <span
                    className={`h-4 w-4 rounded-full border-2 border-white shadow-sm ring-2 ${
                      idx === 4
                        ? "bg-emerald-500 ring-emerald-300"
                        : idx === 3
                        ? "bg-teal-500 ring-teal-200"
                        : "bg-slate-400 ring-slate-200"
                    }`}
                  />
                  <span className="absolute -bottom-5 text-[10px] font-bold text-slate-500">
                    {yr}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Branch: Orders & Prescriptions */}
            <div className="flex justify-between items-center pt-5 text-[10px] font-bold">
              <span className="rounded-lg bg-slate-800 text-white px-2 py-0.5 shadow-xs">
                NEW MED: Lisinopril
              </span>
              <span className="rounded-lg bg-teal-800 text-white px-2 py-0.5 shadow-xs">
                NEW ORDER: HbA1c Panel
              </span>
              <span className="rounded-lg bg-emerald-800 text-white px-2 py-0.5 shadow-xs">
                ACTIVE EMR DATA FEED
              </span>
            </div>
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
                : "border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Event feed */}
      <div className="space-y-3.5">
        {filteredEvents.map((ev) => {
          const badge = getEventBadge(ev.event_type);
          return (
            <article
              key={ev.id}
              className="soft-card space-y-3 p-5 transition-all hover:border-emerald-200"
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

              <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                {ev.description}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-[var(--foreground)]">
                  <Building className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  {ev.facility_or_doctor}
                </span>

                {ev.document_id && (
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <FileText className="h-3.5 w-3.5" />
                    Source linked
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
