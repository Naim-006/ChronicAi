"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Clock,
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
  Heart,
  Flame,
  Footprints,
  Phone,
  ShieldCheck,
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
      {/* 1. Health Condition Top Banner (Exact design from Image 1) */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] border border-slate-100/90 relative overflow-hidden">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Heart className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                Health Condition
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600">
                ● Type 2 Diabetes & HTN Managed
              </span>
            </div>
          </div>

          {/* Circular Percentage Ring */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-2 ring-emerald-100">
            <span>88%</span>
            <span className="text-[10px] font-medium text-emerald-600">Optimal</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold">
            <span className="text-slate-500">Glycemic & Cardiovascular Target</span>
            <span className="text-emerald-700">HbA1c 6.8% (Goal &lt; 7.0%)</span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden p-0.5">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 w-[88%] transition-all shadow-xs" />
          </div>
        </div>

        {/* Bottom Two Quick Indicators */}
        <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fasting Glucose</span>
              <span className="text-xs font-extrabold text-slate-900">118 mg/dL</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">eGFR Kidney</span>
              <span className="text-xs font-extrabold text-slate-900">68 mL/min (Stable)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Workflow Bar (Streamlined Patient Actions) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/metrics"
          className="flex items-center gap-2.5 rounded-2xl bg-white border border-slate-200/80 p-3 hover:border-emerald-300 hover:shadow-xs transition-all group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
            <Activity className="h-4 w-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">Log Vitals</span>
            <span className="text-[10px] text-slate-400">BP, Glucose</span>
          </div>
        </Link>

        <Link
          href="/vault"
          className="flex items-center gap-2.5 rounded-2xl bg-white border border-slate-200/80 p-3 hover:border-emerald-300 hover:shadow-xs transition-all group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">Add Record</span>
            <span className="text-[10px] text-slate-400">PDF, Lab Scan</span>
          </div>
        </Link>

        <Link
          href="/appointments"
          className="flex items-center gap-2.5 rounded-2xl bg-white border border-slate-200/80 p-3 hover:border-emerald-300 hover:shadow-xs transition-all group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">Visits</span>
            <span className="text-[10px] text-slate-400">Schedule, Prep</span>
          </div>
        </Link>

        <Link
          href="/assistant"
          className="flex items-center gap-2.5 rounded-2xl bg-white border border-slate-200/80 p-3 hover:border-emerald-300 hover:shadow-xs transition-all group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white group-hover:scale-105 transition-transform">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">Copilot</span>
            <span className="text-[10px] text-slate-400">Clinical Guide</span>
          </div>
        </Link>
      </div>

      {/* 3. Verification Alert Banner if unconfirmed document exists */}
      {pendingReviewDocs.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-800 shrink-0 mt-0.5">
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
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition-colors"
                >
                  Review Extracted Data
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Access 2x2 Grid (Exact layout from Image 1) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Biometric Quick Access
          </h3>
          <Link href="/metrics" className="text-xs font-bold text-emerald-600 hover:underline">
            View Analytics
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Fasting Glucose */}
          <Link
            href="/metrics"
            className="rounded-3xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Fasting Glucose</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">118</span>
                <span className="text-xs text-slate-400 font-medium">mg/dL</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                ● In Target (70-130)
              </span>
            </div>
            {/* Visual Sparkline Wave */}
            <div className="mt-3 h-8 flex items-end gap-1.5">
              <div className="flex-1 bg-emerald-100 rounded-full h-4" />
              <div className="flex-1 bg-emerald-200 rounded-full h-6" />
              <div className="flex-1 bg-emerald-300 rounded-full h-5" />
              <div className="flex-1 bg-emerald-400 rounded-full h-7" />
              <div className="flex-1 bg-emerald-600 rounded-full h-8" />
            </div>
          </Link>

          {/* Card 2: Blood Pressure */}
          <Link
            href="/metrics"
            className="rounded-3xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Blood Pressure</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Heart className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">122/78</span>
                <span className="text-xs text-slate-400 font-medium">mmHg</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                ● Normal Seated
              </span>
            </div>
            {/* Dot Matrix Graphic */}
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i < 6 ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </Link>

          {/* Card 3: Latest HbA1c */}
          <Link
            href="/metrics"
            className="rounded-3xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Latest HbA1c</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-emerald-700">6.8%</span>
                <span className="text-xs text-slate-400 font-medium">Nov 2026</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                -0.3% Improved
              </span>
            </div>
            {/* Horizontal Spectrum Bar */}
            <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-400 relative overflow-hidden" />
          </Link>

          {/* Card 4: Medication Adherence */}
          <Link
            href="/medications"
            className="rounded-3xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Medications</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Pill className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">4 of 4</span>
                <span className="text-xs text-slate-400 font-medium">Active</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                Daily protocol active
              </span>
            </div>
            {/* Mini Progress Circles */}
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-2 flex-1 rounded-full bg-emerald-500" />
              <div className="h-2 flex-1 rounded-full bg-emerald-500" />
              <div className="h-2 flex-1 rounded-full bg-emerald-500" />
              <div className="h-2 flex-1 rounded-full bg-slate-200" />
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Top Doctor & Appointment (Exact style from Image 1 & 3) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Next Doctor Appointment
          </h3>
          <Link href="/appointments" className="text-xs font-bold text-emerald-600 hover:underline">
            View Schedule
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-slate-100/90 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-extrabold text-sm shadow-sm ring-4 ring-emerald-50">
              CW
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900">
                  {nextAppointment.doctor_name}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-50" />
              </div>
              <span className="text-xs text-slate-500 font-medium block">
                {nextAppointment.specialty} • {nextAppointment.clinic_or_hospital}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {formatDate(nextAppointment.appointment_date)} at {formatTime(nextAppointment.appointment_time)}
              </span>
            </div>
          </div>

          <Link
            href="/appointments"
            className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs shrink-0"
          >
            Prep Visit
          </Link>
        </div>
      </div>

      {/* 6. Daily Medication Checklist (Structured Card List) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Today's Medications
          </h3>
          <Link href="/medications" className="text-xs font-bold text-emerald-600 hover:underline">
            Adherence Matrix
          </Link>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] divide-y divide-slate-100 overflow-hidden">
          {mockMedications.map((med) => {
            const isTaken = loggedMeds[med.id];
            return (
              <div
                key={med.id}
                onClick={() => toggleMed(med.id)}
                className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    aria-label={`Mark ${med.name} as taken`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all shrink-0 ${
                      isTaken
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xs scale-105"
                        : "border-slate-300 hover:border-slate-400 bg-white"
                    }`}
                  >
                    {isTaken && <Check className="h-4 w-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          isTaken ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {med.name}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {med.strength}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      {med.frequency}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold ${
                    isTaken ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {isTaken ? "Logged" : "Tap to log"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Clinical Copilot Intelligence Banner (Professional Healthcare Guidance) */}
      <div className="rounded-3xl bg-gradient-to-tr from-emerald-700 to-green-600 p-5 text-white shadow-lg shadow-emerald-600/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
            Clinical Health Intelligence
          </span>
        </div>
        <h4 className="text-base font-extrabold leading-tight">
          Review your medical records with your Clinical Copilot
        </h4>
        <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
          Grounded directly in Quest Diagnostics panels, clinical notes, and active prescriptions.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Compare my HbA1c trajectory",
            "What questions for Dr. Wei on Dec 8?",
            "Explain my kidney eGFR 68",
          ].map((prompt, i) => (
            <Link
              key={i}
              href="/assistant"
              className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
            >
              {prompt}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
