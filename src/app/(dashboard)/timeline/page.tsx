"use client";

import React, { useState } from "react";
import {
  Clock,
  Search,
  Filter,
  Plus,
  Calendar,
  FileText,
  Building,
  CheckCircle2,
  Stethoscope,
  Activity,
  Pill,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockTimelineEvents } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { TimelineEvent, TimelineEventType } from "@/types/medical";

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<TimelineEventType>("visit");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventFacility, setNewEventFacility] = useState("");

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase())) ||
      (ev.facility_or_doctor && ev.facility_or_doctor.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || ev.event_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    const newEvent: TimelineEvent = {
      id: `ev-${Date.now()}`,
      user_id: "user-elena-vance",
      event_type: newEventType,
      title: newEventTitle,
      description: newEventDesc,
      event_date: newEventDate,
      facility_or_doctor: newEventFacility || "Self-Reported",
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
    setShowAddModal(false);
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventFacility("");
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
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
    <div className="space-y-6">
      <PageHeader
        title="Lifelong Medical Timeline"
        description="A complete chronological journey of your healthcare events, diagnoses, medications, and laboratory tests over time."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Medical Timeline" }]}
        actions={
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Manual Event
          </Button>
        }
      />

      {/* Manual Event Modal */}
      {showAddModal && (
        <Card className="border-2 border-teal-600 bg-white p-5 shadow-lg">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Record Timeline Event
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="h-7 w-7 p-0 text-slate-400"
            >
              ×
            </Button>
          </CardHeader>
          <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Event Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Follow-up consultation with Dr. Wei"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Event Category
                </label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as TimelineEventType)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                >
                  <option value="visit">Doctor Visit</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="lab_test">Laboratory Test</option>
                  <option value="medication_start">Medication Start</option>
                  <option value="surgery">Procedure / Surgery</option>
                  <option value="note">Clinical Note</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Event Date
                </label>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Facility or Healthcare Provider
                </label>
                <Input
                  placeholder="e.g. St. Jude Heart Institute"
                  value={newEventFacility}
                  onChange={(e) => setNewEventFacility(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Clinical Notes / Findings
              </label>
              <textarea
                rows={2}
                placeholder="Details, advice given, medication instructions, or observations..."
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-8"
              >
                Save Event to Timeline
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search timeline events, providers, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "visit", "diagnosis", "lab_test", "medication_start"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={typeFilter === type ? "default" : "outline"}
              onClick={() => setTypeFilter(type)}
              className="text-xs h-8 capitalize shrink-0"
            >
              {type === "all" ? "All Events" : type.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Chronological Timeline Stream */}
      <div className="relative pl-8 sm:pl-10 space-y-6 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {filteredEvents.map((ev) => {
          const Icon = getEventIcon(ev.event_type);
          return (
            <div key={ev.id} className="relative group">
              {/* Timeline Node Badge */}
              <div className="absolute -left-8 sm:-left-10 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal-700 text-white shadow-xs">
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Event Card */}
              <Card className="hover:border-slate-300 transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                      <Badge variant="secondary" className="text-[10px] py-0 capitalize">
                        {ev.event_type.replace("_", " ")}
                      </Badge>
                    </div>

                    <span className="text-xs font-semibold text-teal-800">
                      {formatDate(ev.event_date)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {ev.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Building className="h-3 w-3 text-slate-400" />
                      {ev.facility_or_doctor}
                    </span>

                    {ev.document_id && (
                      <span className="text-teal-700 font-medium flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Source Document Linked
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
