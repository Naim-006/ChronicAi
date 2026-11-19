"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Clock,
  Sparkles,
  Pill,
  ChevronRight,
  AlertCircle,
  FileText,
  Plus,
  Check,
  TrendingDown,
  UploadCloud,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import { mockProfile, mockMedications, mockAppointments, mockTimelineEvents, mockDocuments } from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";

export default function DashboardPage() {
  const [loggedMeds, setLoggedMeds] = useState<Record<string, boolean>>({
    "med-1": true,
    "med-2": true,
    "med-3": true,
    "med-4": false,
  });

  const nextAppointment = mockAppointments.find((a) => a.status === "upcoming") || mockAppointments[0];
  const pendingReviewDocs = mockDocuments.filter((d) => d.status === "needs_review");

  const toggleMed = (medId: string) => {
    setLoggedMeds((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Human Greeting & Health Context Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Good morning, Elena
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your conditions (Type 2 Diabetes, HTN, CKD2) are stable today.
          </p>
        </div>

        <Link
          href="/chronic-care"
          className="flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-3 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Diabetes Care</span>
          <ChevronRight className="h-3.5 w-3.5 text-teal-600" />
        </Link>
      </div>

      {/* 2. Action Required Alert (if document needs review) */}
      {pendingReviewDocs.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 transition-all">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-amber-950 block">
                Verification Required: {pendingReviewDocs[0].file_name}
              </span>
              <p className="text-xs text-amber-800/90 mt-0.5 line-clamp-1">
                New clinical notes from Valley Eye Center parsed. Confirm findings to add to your timeline.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href="/vault"
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-800 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition-colors"
                >
                  Review Extracted Data
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Daily Health Status Snapshot (Compact 3-Pill Strip, Apple Health Style) */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Vital Indicators
          </span>
          <Link href="/metrics" className="text-xs font-medium text-teal-800 hover:underline">
            View Analytics
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Link
            href="/metrics"
            className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all text-center sm:text-left"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Fasting Glucose
            </span>
            <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-lg font-bold text-slate-900">118</span>
              <span className="text-[10px] text-slate-500 font-medium">mg/dL</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              ● In Target
            </span>
          </Link>

          <Link
            href="/metrics"
            className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all text-center sm:text-left"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Latest HbA1c
            </span>
            <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-lg font-bold text-teal-800">6.8</span>
              <span className="text-[10px] text-slate-500 font-medium">%</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              -0.3% Nov Panel
            </span>
          </Link>

          <Link
            href="/metrics"
            className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all text-center sm:text-left"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Blood Pressure
            </span>
            <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-lg font-bold text-slate-900">122/78</span>
              <span className="text-[10px] text-slate-500 font-medium">mmHg</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              Resting seated
            </span>
          </Link>
        </div>
      </div>

      {/* 4. Structured Grouped List: Today's Medication Schedule (Apple Health / Banking style) */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Today's Medications
          </span>
          <Link href="/medications" className="text-xs font-medium text-teal-800 hover:underline">
            Manage List
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {mockMedications.map((med) => {
            const isTaken = loggedMeds[med.id];
            return (
              <div
                key={med.id}
                onClick={() => toggleMed(med.id)}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label={`Mark ${med.name} as taken`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors shrink-0 ${
                      isTaken
                        ? "bg-teal-700 border-teal-700 text-white"
                        : "border-slate-300 hover:border-slate-400 bg-white"
                    }`}
                  >
                    {isTaken && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          isTaken ? "text-slate-500 line-through" : "text-slate-900"
                        }`}
                      >
                        {med.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {med.strength}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      {med.frequency}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-[11px] font-semibold ${
                      isTaken ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {isTaken ? "Taken" : "Tap to take"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Next Consultation Compact Card */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Next Doctor Visit
          </span>
          <Link href="/appointments" className="text-xs font-medium text-teal-800 hover:underline">
            All Visits
          </Link>
        </div>

        <Link
          href="/appointments"
          className="block rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 shrink-0">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {nextAppointment.doctor_name}
                </span>
                <span className="text-[11px] text-teal-800 font-medium block">
                  {nextAppointment.specialty} • {nextAppointment.clinic_or_hospital}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formatDate(nextAppointment.appointment_date)} at {formatTime(nextAppointment.appointment_time)}
                </span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 truncate max-w-[220px]">
              Reason: {nextAppointment.reason}
            </span>
            <span className="text-teal-800 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Preparation Ready
            </span>
          </div>
        </Link>
      </div>

      {/* 6. AI Medical Health Query Banner (Integrated, Not Generic) */}
      <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-800 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-teal-950">
            Ask Your Medical Life Assistant
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Instant answers grounded in your verified lab results, prescriptions, and timeline.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {[
            "How has my HbA1c changed?",
            "What questions for Dr. Wei?",
            "List my 4 active medications",
          ].map((prompt, i) => (
            <Link
              key={i}
              href="/assistant"
              className="rounded-full bg-white border border-teal-200/80 px-3 py-1 text-[11px] font-medium text-teal-900 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs"
            >
              {prompt}
            </Link>
          ))}
        </div>
      </div>

      {/* 7. Structured Grouped List: Recent Medical Journey */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recent Timeline Records
          </span>
          <Link href="/timeline" className="text-xs font-medium text-teal-800 hover:underline">
            Full Journey
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {mockTimelineEvents.slice(0, 3).map((event) => (
            <Link
              key={event.id}
              href="/timeline"
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {event.title}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                    {formatDate(event.event_date)} • {event.facility_or_doctor}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>

      {/* 8. Quick Actions (Pill Bar) */}
      <div className="pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href="/vault"
            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200/90 py-2.5 px-3 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            <UploadCloud className="h-3.5 w-3.5 text-teal-700" />
            Upload File
          </Link>

          <Link
            href="/metrics"
            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200/90 py-2.5 px-3 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5 text-teal-700" />
            Log Biometric
          </Link>

          <Link
            href="/appointments"
            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200/90 py-2.5 px-3 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            <Calendar className="h-3.5 w-3.5 text-teal-700" />
            Add Visit
          </Link>
        </div>
      </div>
    </div>
  );
}
