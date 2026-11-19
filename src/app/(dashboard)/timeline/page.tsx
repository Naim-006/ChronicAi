"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Plus,
  Calendar,
  FileText,
  Building,
  CheckCircle2,
  Stethoscope,
  Activity,
  Pill,
  ShieldCheck,
  ChevronRight,
  X,
  Share2,
} from "lucide-react";
import { mockTimelineEvents } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { TimelineEvent, TimelineEventType } from "@/types/medical";

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
        return { label: "DOCTOR VISIT", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "lab_test":
        return { label: "LAB REPORT", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "medication_start":
        return { label: "MEDICATION REFILL", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "diagnosis":
        return { label: "DIAGNOSIS CONFIRMED", color: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { label: "CLINICAL RECORD", color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header (Inspired by Image 4 & 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            CareSight Patient Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological longitudinal patient journey across {events.length} documented milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Timeline Event</span>
        </button>
      </div>

      {/* Manual Entry Sheet */}
      {showAddModal && (
        <div className="rounded-3xl border border-emerald-300 bg-white p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-extrabold text-slate-900">Add Clinical Timeline Entry</span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
              <input
                required
                placeholder="e.g. Ophthalmology Retinal Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimelineEventType)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                >
                  <option value="visit">Doctor Visit</option>
                  <option value="lab_test">Lab Report</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="medication_start">Medication</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Healthcare Facility / Clinician</label>
              <input
                placeholder="e.g. Quest Diagnostics / Dr. Catherine Wei"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Clinical Notes & Findings</label>
              <textarea
                rows={2}
                placeholder="Diagnostic findings, lab values, or instructions..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Save to Timeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Featured Clinical Lab Result Card with Visual Gradient Spectrum Slider (Exact design from Image 7) */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 block">
              Featured Diagnostic Lab Screening · Quest Diagnostics
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
              Glucose in Serum or Plasma [Mass/volume]
            </h2>
            <span className="text-xs text-slate-500 block mt-0.5">
              November 2, 2026 · Facility: Boulder Community Health · Provider: Simon Jones, MD
            </span>
          </div>

          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            Normal Result
          </span>
        </div>

        {/* Current Result Spectrum Slider (Image 7 style: 91 mg/dL) */}
        <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Fasting Serum Glucose
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">91</span>
                <span className="text-xs text-slate-500 font-bold">mg/dL</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">
              ● Normal / Ideal Range
            </span>
          </div>

          {/* Color Gradient Spectrum Bar (Blue -> Emerald -> Yellow -> Red) with Indicator Pin at 91 */}
          <div className="relative pt-3 pb-1">
            <div className="h-3.5 w-full rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-rose-500 relative shadow-inner">
              {/* Pin indicator at 91 mg/dL on 0-150 scale ~ 60% */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-emerald-700 shadow-md ring-2 ring-emerald-200"
                style={{ left: "59%" }}
                title="Measured Value: 91 mg/dL"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-1.5 px-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150+</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">
              Ideal Clinical Range: <strong>70 – 100 mg/dL</strong>
            </span>
            <Link href="/assistant" className="text-emerald-700 font-bold hover:underline">
              ↑ Learn More with Copilot
            </Link>
          </div>
        </div>

        {/* Prior Baseline Result Comparison (Image 7 style: 145 mg/dL) */}
        <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Prior Screening (May 14, 2026)
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">145</span>
                <span className="text-xs text-slate-500 font-bold">mg/dL</span>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600">
              ● Abnormal Result (Elevated)
            </span>
          </div>

          {/* Color Gradient Spectrum Bar with Pin at 145 near red end */}
          <div className="relative pt-3 pb-1">
            <div className="h-3.5 w-full rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-rose-500 relative shadow-inner">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-rose-600 shadow-md ring-2 ring-rose-200"
                style={{ left: "94%" }}
                title="Measured Value: 145 mg/dL"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-1.5 px-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150+</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-100/60">
            <span className="text-slate-500">
              Improvement: <strong>-54 mg/dL reduction</strong> since starting Metformin regimen.
            </span>
            <span className="text-emerald-700 font-bold">
              Marked Clinical Progress
            </span>
          </div>
        </div>
      </div>

      {/* Search & Timeline Filter Pills (Image 4 style) */}
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
            onClick={() => setTypeFilter(cat.id)}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
              typeFilter === cat.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chronological Milestone Feed (Image 4 CareSight style) */}
      <div className="space-y-4">
        {filteredEvents.map((ev) => {
          const badge = getEventBadge(ev.event_type);
          return (
            <div
              key={ev.id}
              className="rounded-3xl bg-white border border-slate-100/90 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {ev.title}
                  </h3>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  {formatDate(ev.event_date)}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {ev.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {ev.facility_or_doctor}
                </span>

                {ev.document_id && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Source Report Linked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
