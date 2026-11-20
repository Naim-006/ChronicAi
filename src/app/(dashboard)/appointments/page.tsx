"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Sparkles,
  ArrowRight,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/types/medical";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
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

  // Action Menu & Edit/Delete States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit Modal State
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editClinic, setEditClinic] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("upcoming");
  const [isUpdatingApt, setIsUpdatingApt] = useState(false);

  // Delete Modal State
  const [deletingApt, setDeletingApt] = useState<Appointment | null>(null);
  const [isDeletingApt, setIsDeletingApt] = useState(false);

  // Close 3-dot menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".appointment-menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleOpenEdit = (apt: Appointment) => {
    setActiveMenuId(null);
    setEditingApt(apt);
    setEditDocName(apt.doctor_name || "");
    setEditSpecialty(apt.specialty || "");
    setEditClinic(apt.clinic_or_hospital || "");
    setEditDate(apt.appointment_date || "");
    setEditTime(apt.appointment_time || "");
    setEditReason(apt.reason || "");
    setEditStatus(apt.status || "upcoming");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt || !editDocName.trim() || !editDate) return;

    setIsUpdatingApt(true);
    try {
      const updates = {
        doctor_name: editDocName.trim(),
        specialty: editSpecialty.trim() || "General Medicine",
        clinic_or_hospital: editClinic.trim() || "Healthcare Facility",
        appointment_date: editDate,
        appointment_time: editTime || "10:00:00",
        reason: editReason.trim() || "Medical Consultation",
        status: editStatus,
      };

      const success = await updateAppointment(editingApt.id, updates, effectiveUserId);
      if (success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === editingApt.id ? { ...a, ...updates } : a))
        );
        setEditingApt(null);
        setNotification(`Appointment with ${updates.doctor_name} updated successfully.`);
      } else {
        setNotification("Failed to update appointment. Please try again.");
      }
    } catch (err: any) {
      setNotification(`Error updating appointment: ${err?.message || "Unknown error"}`);
    } finally {
      setIsUpdatingApt(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleOpenDelete = (apt: Appointment) => {
    setActiveMenuId(null);
    setDeletingApt(apt);
  };

  const handleConfirmDelete = async () => {
    if (!deletingApt) return;

    setIsDeletingApt(true);
    try {
      const success = await deleteAppointment(deletingApt.id, effectiveUserId);
      if (success) {
        setAppointments((prev) => prev.filter((a) => a.id !== deletingApt.id));
        setNotification(`Appointment with ${deletingApt.doctor_name} cancelled and removed.`);
        setDeletingApt(null);
      } else {
        setNotification("Failed to delete appointment. Please try again.");
      }
    } catch (err: any) {
      setNotification(`Error deleting appointment: ${err?.message || "Unknown error"}`);
    } finally {
      setIsDeletingApt(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleToggleStatus = async (apt: Appointment) => {
    setActiveMenuId(null);
    const newStatus = apt.status === "completed" ? "upcoming" : "completed";
    try {
      const success = await updateAppointment(apt.id, { status: newStatus }, effectiveUserId);
      if (success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? { ...a, status: newStatus } : a))
        );
        setNotification(
          `Appointment marked as ${newStatus === "completed" ? "Completed" : "Upcoming"}.`
        );
      }
    } catch (err: any) {
      setNotification(`Error: ${err?.message || "Failed to update status"}`);
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qDocName = params.get("docName");
      const qSpecialty = params.get("specialty");
      const qFacility = params.get("facility");
      if (qDocName) {
        setDocName(qDocName);
        if (qSpecialty) setSpecialty(qSpecialty);
        if (qFacility) setLoc(qFacility);
        setShowAddModal(true);
      }
    }
  }, []);

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
        title="Appointments"
        actions={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-3.5 w-3.5" />
            Book visit
          </Button>
        }
        className="lg:mb-2"
      />

      {notification && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 p-3.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                <div className="relative appointment-menu-container">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === apt.id ? null : apt.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Appointment Actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMenuId === apt.id && (
                    <div className="absolute right-0 top-8 z-30 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 animate-in fade-in zoom-in-95 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(apt)}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Edit Consultation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(apt)}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{apt.status === "completed" ? "Mark as Upcoming" : "Mark as Completed"}</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(apt)}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Cancel / Delete</span>
                      </button>
                    </div>
                  )}
                </div>
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

              {/* AI Pre-Consultation Guidance Action */}
              <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Upcoming Consultation
                </span>
                <Link
                  href={`/assistant?q=${encodeURIComponent(`I have an upcoming appointment with ${apt.doctor_name} (${apt.specialty}) for ${apt.reason}. Can you give me a pre-consultation summary and key questions to ask?`)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 rounded-xl transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Prep with Copilot</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
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

      {/* EDIT APPOINTMENT MODAL */}
      {editingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="soft-card-lift w-full max-w-md space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)]">
                    Edit Consultation
                  </h3>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">
                    Update appointment timing, physician, or clinic
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingApt(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Attending Physician *
                </label>
                <Input
                  required
                  placeholder="e.g. Dr. Salim Yazdi"
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Specialty</label>
                  <Input
                    placeholder="e.g. Dermatology"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-semibold text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Date *</label>
                  <Input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Time</label>
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Consultation Reason
                </label>
                <Input
                  placeholder="e.g. Follow-up on skin lesions"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Clinic / Facility</label>
                <Input
                  placeholder="e.g. CMH, Dhaka"
                  value={editClinic}
                  onChange={(e) => setEditClinic(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
                <Button type="button" variant="outline" onClick={() => setEditingApt(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingApt}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isUpdatingApt ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="soft-card-lift w-full max-w-sm space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                  Cancel Consultation?
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Are you sure you want to remove your visit with{" "}
                  <strong className="text-[var(--foreground)]">{deletingApt.doctor_name}</strong> on{" "}
                  {formatDate(deletingApt.appointment_date)}?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingApt(null)}
              >
                Keep Visit
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeletingApt}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeletingApt ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
