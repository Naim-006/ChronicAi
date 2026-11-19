"use client";

import React, { useState } from "react";
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

  const getEventIcon = (t: TimelineEventType) => {
    switch (t) {
      case "visit":
        return Stethoscope;
      case "lab_test":
        return Activity;
      case "medication_start":
      case "medication_stop":
        return Pill;
      case "diagnosis":
        return ShieldCheck;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Medical Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your chronological health history across {events.length} milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">Record New Health Event</span>
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
              <label className="font-semibold text-slate-700 block mb-1">Event Title *</label>
              <input
                required
                placeholder="e.g. Quarterly Lab Workup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimelineEventType)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs"
                >
                  <option value="visit">Doctor Visit</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="medication_start">Medication</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facility / Doctor</label>
              <input
                placeholder="e.g. Dr. Catherine Wei, MD"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Clinical Notes</label>
              <textarea
                rows={2}
                placeholder="Key findings, dosage instructions, or advice..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-xs font-semibold text-white"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search events, diagnoses, doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Events" },
            { id: "visit", label: "Visits" },
            { id: "lab_test", label: "Labs" },
            { id: "medication_start", label: "Medications" },
            { id: "diagnosis", label: "Diagnoses" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition-colors cursor-pointer ${
                typeFilter === cat.id
                  ? "bg-teal-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Structured List */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredEvents.map((ev) => {
          const Icon = getEventIcon(ev.event_type);
          return (
            <div key={ev.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                </div>
                <span className="text-[11px] font-semibold text-teal-800">
                  {formatDate(ev.event_date)}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-9">
                {ev.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pl-9 pt-0.5">
                <span>{ev.facility_or_doctor}</span>
                {ev.document_id && (
                  <span className="text-teal-700 font-medium flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Verified Source Linked
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
