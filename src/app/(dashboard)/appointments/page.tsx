"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  MoreVertical,
  ClipboardList,
  Check,
} from "lucide-react";
import { mockAppointments } from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";
import { Appointment } from "@/types/medical";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [activeTab, setActiveTab] = useState<"today" | "all" | "past">("today");
  const [search, setSearch] = useState("");
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
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    setShowAddModal(false);
    setDocName("");
    setSpecialty("");
    setDate("");
    setTime("");
    setReason("");
    setLoc("");
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

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* 1. Image 3 Top Navigation Bar with Dark Capsule Tab Switcher */}
      <div className="rounded-3xl bg-[#18261F] text-white p-5 sm:p-6 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                My Appointments
              </h1>
              <span className="text-[11px] font-medium text-emerald-400 block">
                3 Confirmed Consultations
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>

        {/* Tab Switcher (Image 3 Style: Today | Search / All | Past) */}
        <div className="mt-5 flex items-center gap-6 border-b border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === "today"
                ? "text-white font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Today & Upcoming
            {activeTab === "today" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[#22C55E]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === "all"
                ? "text-white font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Appointments
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[#22C55E]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === "past"
                ? "text-white font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Past History
            {activeTab === "past" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[#22C55E]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Matching Image 3 Pill Design) */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search appointments by doctor, clinic, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200/90 bg-white pl-11 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors shrink-0 cursor-pointer"
          title="Filter Options"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 3. Section Title Row: All Appointments + See All */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold text-slate-900">
          All Appointments
        </h2>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          See All
        </button>
      </div>

      {/* 4. Doctor Appointment Cards (Exact Design from Image 3 Screen 1) */}
      <div className="space-y-3.5">
        {filteredAppointments.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center border border-slate-200/80 space-y-2">
            <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or schedule a new consultation.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-300 transition-all space-y-4"
            >
              {/* Doctor Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  {/* Doctor Avatar */}
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200 text-emerald-800 font-extrabold text-base shadow-2xs shrink-0">
                    {apt.doctor_name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("")}
                  </div>

                  {/* Doctor Name & Specialty */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {apt.doctor_name}
                      </h3>
                      {/* Verified Badge (Image 3 Green Checkmark) */}
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E] text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                      <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                      <span>{apt.specialty}</span>
                    </div>

                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {apt.clinic_or_hospital}
                    </span>
                  </div>
                </div>

                {/* More Options Menu */}
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Appointment Actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom Row: Time Capsule + Bell & Call Buttons (Exact Image 3 Layout) */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {formatDate(apt.appointment_date)}, {formatTime(apt.appointment_time)}
                  </span>
                </div>

                {/* Action Buttons: Notification Bell + Bright Green Phone Call Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Set Reminder"
                  >
                    <Bell className="h-4 w-4" />
                  </button>

                  <a
                    href="tel:+15550198234"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-sm shadow-green-600/30 transition-transform active:scale-95 cursor-pointer"
                    title="Call Clinic"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Pre-Consultation Clinical Discussion Points */}
              {apt.preparation_questions && apt.preparation_questions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <ClipboardList className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Clinical Discussion Checkpoints:</span>
                  </div>
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                    {apt.preparation_questions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Schedule Consultation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Schedule Medical Consultation
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Physician Name *</label>
                <input
                  required
                  placeholder="e.g. Dr. Phos Gray"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialty</label>
                <input
                  placeholder="e.g. General Medical Checkup, Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Visit *</label>
                <input
                  required
                  placeholder="e.g. Routine quarterly diabetic & cardiovascular evaluation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinic / Facility</label>
                <input
                  placeholder="e.g. Metro Medical Center, Suite 402"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-xs font-bold text-white shadow-md shadow-green-600/30"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
