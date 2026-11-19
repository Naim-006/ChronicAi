"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Stethoscope,
  X,
  Phone,
  Bell,
  Search,
  SlidersHorizontal,
  MoreVertical,
  ClipboardList,
  Check,
  Loader2,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { Appointment } from "@/types/medical";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  getAppointments,
  createAppointment,
} from "@/lib/supabase/services/appointments";
import { useRealtimeTables } from "@/hooks/useRealtime";

export default function AppointmentsPage() {
  const { effectiveUserId } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "all" | "past">("today");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [docName, setDocName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loc, setLoc] = useState("");

  const loadApts = React.useCallback(async () => {
    if (!effectiveUserId) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await getAppointments(effectiveUserId);
      setAppointments(data || []);
    } catch {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadApts();
  }, [loadApts]);

  // Realtime subscription: syncs scheduled appointments live
  useRealtimeTables({
    tables: ["appointments"],
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadApts();
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !date || !reason || !effectiveUserId) return;

    setIsSubmitting(true);
    try {
      const created = await createAppointment({
        user_id: effectiveUserId,
        doctor_name: docName,
        specialty: specialty || "General Medical Checkup",
        clinic_or_hospital: loc || "Metro Health Center",
        appointment_date: date,
        appointment_time: time || "15:30:00",
        reason,
        location: loc,
        status: "upcoming",
        preparation_questions: [
          `Review recent biometric changes regarding ${reason}.`,
          "Confirm current medication dosages and tolerance.",
        ],
      });

      setAppointments((prev) => [created, ...prev]);
      setShowAddModal(false);
      setDocName("");
      setSpecialty("");
      setDate("");
      setTime("");
      setReason("");
      setLoc("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(search.toLowerCase()) ||
      apt.reason.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "today") {
      return matchesSearch && apt.status === "upcoming";
    }
    if (activeTab === "past") {
      return matchesSearch && apt.status === "completed";
    }
    return matchesSearch;
  });

  const upcomingCount = appointments.filter((a) => a.status === "upcoming").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Visits"
        title="Appointments"
        description={`${upcomingCount} confirmed consultations ahead`}
        actions={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-3.5 w-3.5" />
            Book visit
          </Button>
        }
        className="lg:mb-2"
      />

      {/* Forest hero with tabs — desktop softens to a card strip */}
      <section className="soft-card overflow-hidden p-0">
        <div className="forest-surface px-5 py-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {(
              [
                { id: "today", label: "Upcoming" },
                { id: "all", label: "All" },
                { id: "past", label: "Past" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 cursor-pointer px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-[var(--border)]/70 p-4 sm:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              type="search"
              placeholder="Search doctor, clinic, specialty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
            title="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="grid gap-3.5 lg:grid-cols-2">
        {isLoading ? (
          <div className="soft-card col-span-full flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="soft-card col-span-full space-y-2 p-10 text-center">
            <Calendar className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">No appointments found</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Try another filter or book a new consultation.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <article
              key={apt.id}
              className="soft-card space-y-4 p-5 transition-all hover:border-emerald-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                    {apt.doctor_name
                      .replace("Dr. ", "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-extrabold text-[var(--foreground)]">
                        {apt.doctor_name}
                      </h3>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span className="truncate">{apt.specialty}</span>
                    </div>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--muted-foreground)]">
                      {apt.clinic_or_hospital}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)]/80 pt-3">
                <div className="soft-inset flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
                  <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span>
                    {formatDate(apt.appointment_date)}, {formatTime(apt.appointment_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--mint-deep)]"
                    title="Reminder"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  <a
                    href="tel:+15550198234"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/25 transition-transform active:scale-95"
                    title="Call clinic"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {apt.preparation_questions && apt.preparation_questions.length > 0 && (
                <div className="space-y-1.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    <ClipboardList className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    Prep checkpoints
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--foreground)]/80">
                    {apt.preparation_questions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="soft-card-lift w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-extrabold text-[var(--foreground)]">
                Schedule consultation
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Physician *
                </label>
                <Input
                  required
                  placeholder="e.g. Dr. Phos Gray"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Specialty</label>
                <Input
                  placeholder="e.g. Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Date *</label>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Time</label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Reason *
                </label>
                <Input
                  required
                  placeholder="Reason for visit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Clinic</label>
                <Input
                  placeholder="Facility name"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
