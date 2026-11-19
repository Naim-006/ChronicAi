"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Stethoscope,
  Sparkles,
  MapPin,
  ChevronRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { mockAppointments } from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";
import { Appointment } from "@/types/medical";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

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
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {upcomingApts.length} upcoming consultation scheduled.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Schedule</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">Schedule Medical Visit</span>
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
              <label className="font-semibold text-slate-700 block mb-1">Doctor Name *</label>
              <input
                required
                placeholder="e.g. Dr. Catherine Wei, MD"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Specialty</label>
                <input
                  placeholder="e.g. Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Facility Location</label>
                <input
                  placeholder="e.g. Medical Park Blvd"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason for Visit *</label>
              <input
                required
                placeholder="e.g. Quarterly Diabetes & Lab Review"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
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
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Visit Details & Preparation Sheet */}
      {selectedApt && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">{selectedApt.doctor_name}</span>
            <button
              type="button"
              onClick={() => setSelectedApt(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-slate-700 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Location</span>
              <span className="font-semibold text-slate-900">{formatDate(selectedApt.appointment_date)} at {formatTime(selectedApt.appointment_time)}</span>
              <span className="text-slate-500 block text-[11px]">{selectedApt.clinic_or_hospital}</span>
            </div>

            {selectedApt.preparation_questions && selectedApt.preparation_questions.length > 0 && (
              <div className="bg-teal-50/70 rounded-xl p-3 border border-teal-200 space-y-1.5">
                <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-teal-700" />
                  AI Consultation Preparation Questions
                </span>
                <ul className="list-disc pl-4 text-slate-700 space-y-1 text-[11px]">
                  {selectedApt.preparation_questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Visits (Grouped List) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Upcoming Consultations
        </span>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {upcomingApts.map((apt) => (
            <div
              key={apt.id}
              onClick={() => setSelectedApt(apt)}
              className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800 shrink-0">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {apt.doctor_name}
                  </span>
                  <span className="text-[11px] text-teal-800 font-medium block">
                    {apt.specialty} • {apt.clinic_or_hospital}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  Prep Ready
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed History (Grouped List) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Past Consultations History
        </span>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {pastApts.map((apt) => (
            <div key={apt.id} className="p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{apt.doctor_name}</span>
                <span className="text-[10px] text-slate-400">{formatDate(apt.appointment_date)}</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {apt.specialty} • {apt.clinic_or_hospital}
              </span>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed mt-1">
                {apt.consultation_notes || "Routine follow-up completed."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
