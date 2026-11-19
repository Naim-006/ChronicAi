"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Stethoscope,
  MapPin,
  ChevronRight,
  X,
  CheckCircle2,
  Phone,
  Bell,
  Search,
  SlidersHorizontal,
  ClipboardList,
} from "lucide-react";
import { mockAppointments } from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";
import { Appointment } from "@/types/medical";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [search, setSearch] = useState("");

  // Form state
  const [docName, setDocName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loc, setLoc] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !date || !reason) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      user_id: "user-elena-vance",
      doctor_name: docName,
      specialty: specialty || "General Medicine",
      clinic_or_hospital: loc || "Metro Medical Center",
      appointment_date: date,
      appointment_time: time || "09:00:00",
      reason,
      location: loc,
      status: "upcoming",
      preparation_questions: [
        `Review recent test markers regarding ${reason}.`,
        "Confirm medication adherence.",
      ],
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    setShowAddModal(false);
    setDocName("");
    setSpecialty("");
    setDate("");
    setReason("");
    setLoc("");
  };

  const upcomingApts = appointments.filter((a) => a.status === "upcoming");
  const pastApts = appointments.filter((a) => a.status !== "upcoming");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            My Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your consultation schedule and AI-prepared physician checklists.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="rounded-3xl border border-emerald-300 bg-white p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-extrabold text-slate-900">Schedule Medical Visit</span>
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
              <label className="font-bold text-slate-700 block mb-1">Doctor Name *</label>
              <input
                required
                placeholder="e.g. Dr. Catherine Wei, MD"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialty</label>
                <input
                  placeholder="e.g. Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Location</label>
                <input
                  placeholder="e.g. Medical Park Blvd"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason for Visit *</label>
              <input
                required
                placeholder="e.g. Quarterly Diabetes & Lab Review"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
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
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input Bar (Image 3 design) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search appointments by doctor or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Upcoming Appointments Cards (Exact design from Image 3) */}
      <div className="space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
          Upcoming Consultations
        </span>

        {upcomingApts.map((apt) => (
          <div
            key={apt.id}
            className="rounded-3xl bg-white border border-slate-100/90 p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] hover:border-emerald-300 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-extrabold text-sm shadow-sm ring-4 ring-emerald-50">
                  CW
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {apt.doctor_name}
                    </h3>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    {apt.specialty} • {apt.clinic_or_hospital}
                  </span>
                </div>
              </div>

              {/* Call & Notification Action Buttons (Image 3 style) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Reminder Alert"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <a
                  href="tel:+15557890123"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-sm hover:scale-105 active:scale-95 transition-all"
                  title="Call Clinic"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Time Slot Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>{formatDate(apt.appointment_date)} • {formatTime(apt.appointment_time)}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                Confirmed Slot
              </span>
            </div>

            {/* Pre-Consultation Preparation Checklist */}
            {apt.preparation_questions && apt.preparation_questions.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
                  Pre-Consultation Clinical Discussion Points:
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                  {apt.preparation_questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Past Completed Consultations (Image 3 list style) */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
          Completed Visit Records
        </span>

        {pastApts.map((apt) => (
          <div
            key={apt.id}
            className="rounded-3xl bg-white border border-slate-100/90 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{apt.doctor_name}</span>
              <span className="text-[11px] font-semibold text-slate-400">{formatDate(apt.appointment_date)}</span>
            </div>
            <span className="text-xs text-slate-500 block">
              {apt.specialty} • {apt.clinic_or_hospital}
            </span>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
              <strong>Physician Notes:</strong> {apt.consultation_notes || "Routine follow-up completed."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
