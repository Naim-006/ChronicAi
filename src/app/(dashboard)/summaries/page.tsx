"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Share2,
  Lock,
  Copy,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Key,
  CheckCircle2,
  Calendar,
  Pill,
  Activity,
} from "lucide-react";
import { mockProfile, mockMedications, mockAppointments } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function SummariesPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [accessPin, setAccessPin] = useState<string | null>(null);

  const handleGenerateShareLink = () => {
    const token = `med_${Math.random().toString(36).substring(2, 10)}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setShareToken(`https://chronicai.health/shared/${token}?exp=24h`);
    setAccessPin(pin);
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    navigator.clipboard?.writeText(`${shareToken} (PIN: ${accessPin})`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Clinical Summary & Handout
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Print-ready medical briefing for doctor appointments and encrypted 24-hour sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print PDF</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateShareLink}
            className="flex items-center gap-1.5 rounded-full bg-[#22C55E] hover:bg-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-md shadow-green-600/30 transition-all cursor-pointer active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span>Generate Doctor Link</span>
          </button>
        </div>
      </div>

      {/* Share Link Banner (if generated) */}
      {shareToken && (
        <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/80 p-5 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-700" />
              Temporary 24-Hour Physician Access Portal
            </span>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Self-Destructs in 24h
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Grants your physician secure read-only access to your active conditions, current medications, allergy card, and Quest Diagnostics panels.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <input
              readOnly
              value={shareToken}
              className="w-full sm:flex-1 h-10 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-mono text-slate-900 shadow-2xs"
            />
            {accessPin && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 shrink-0 shadow-2xs">
                <Key className="h-3.5 w-3.5 text-emerald-600" />
                <span>Access PIN: <strong className="text-emerald-700 font-mono">{accessPin}</strong></span>
              </div>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#18261F] text-white text-xs font-bold shadow-xs hover:bg-[#253D30] transition-colors cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? "Copied Link + PIN" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1-Page Structured Clinical Briefing Document (Print Optimized) */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header & Patient Demographics */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {mockProfile.full_name}
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                Patient ID: #892-04
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              DOB: {formatDate(mockProfile.date_of_birth)} (Age 48) · Sex: Female · Blood Group: <strong>{mockProfile.blood_group}</strong>
            </span>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Clinical Briefing Generated
            </span>
            <span className="font-extrabold text-slate-800 block">
              {formatDate(new Date().toISOString())}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              Verified by Universal Medical AI
            </span>
          </div>
        </div>

        {/* 1. Critical Allergies (High Visibility Red Box) */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 block mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Documented Drug Allergies & Adverse Reactions
          </span>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 divide-y divide-rose-100 overflow-hidden text-xs">
            {mockProfile.allergies.map((a) => (
              <div key={a.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">{a.substance}</span>
                  <span className="text-rose-700 text-xs font-medium">Reaction: {a.reaction}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                  {a.severity} Severity
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Active Conditions & Diagnoses */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
            Documented Diagnoses & Care Protocols
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {mockProfile.chronic_conditions.map((c) => (
              <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{c.name}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {c.icd10}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{c.notes}</p>
                <span className="text-[10px] font-bold text-emerald-700 block">Status: {c.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Active Prescription Regimen (Table) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
              Active Prescriptions (96% 6-Month Adherence)
            </span>
            <span className="text-xs font-bold text-emerald-700">4 Active Medications</span>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase">
                <tr>
                  <th className="py-2.5 pl-4">Medication</th>
                  <th className="py-2.5 px-3">Strength & Frequency</th>
                  <th className="py-2.5 px-3">Prescriber</th>
                  <th className="py-2.5 pr-4 text-right">Adherence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockMedications.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pl-4 font-bold text-slate-900">
                      {m.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {m.strength} · {m.frequency}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {m.prescribing_doctor}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-100">
                        Taken 100%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Longitudinal Biomarker Trajectory Table */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
            12-Month Longitudinal Lab Trajectory (Quest Diagnostics)
          </span>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase">
                <tr>
                  <th className="py-2.5 pl-4">Biomarker</th>
                  <th className="py-2.5 px-3">Nov 2, 2026 (Latest)</th>
                  <th className="py-2.5 px-3">May 18, 2026</th>
                  <th className="py-2.5 pr-4 text-right">Clinical Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 pl-4 font-bold text-slate-900">Hemoglobin A1c</td>
                  <td className="py-2.5 px-3 font-extrabold text-emerald-700">6.8%</td>
                  <td className="py-2.5 px-3 text-slate-500">7.1%</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="text-emerald-700 font-bold">Goal Met (&lt; 7.0%)</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pl-4 font-bold text-slate-900">Fasting Glucose</td>
                  <td className="py-2.5 px-3 font-extrabold text-emerald-700">118 mg/dL</td>
                  <td className="py-2.5 px-3 text-slate-500">126 mg/dL</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="text-emerald-700 font-bold">-8 mg/dL Improved</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pl-4 font-bold text-slate-900">eGFR (Kidney Filtration)</td>
                  <td className="py-2.5 px-3 font-extrabold text-slate-800">68 mL/min</td>
                  <td className="py-2.5 px-3 text-slate-500">67 mL/min</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="text-slate-600 font-bold">Stable Stage 2 CKD</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pl-4 font-bold text-slate-900">Serum Creatinine</td>
                  <td className="py-2.5 px-3 font-extrabold text-slate-800">1.04 mg/dL</td>
                  <td className="py-2.5 px-3 text-slate-500">1.06 mg/dL</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="text-emerald-700 font-bold">Normal Range</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Pre-Visit Clinical Questions for Physician */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Stethoscope className="h-4 w-4 text-emerald-600" />
            <span>Discussion Points Prepared for Dr. Catherine Wei (Dec 8, 2026):</span>
          </div>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            <li>HbA1c reached 6.8% (down from 7.1%). Evaluate maintaining 1000mg Metformin twice daily.</li>
            <li>Confirm Lisinopril 20mg continues to provide optimal renoprotective benefit for eGFR 68.</li>
            <li>Schedule routine annual urine microalbumin-to-creatinine ratio screening for early 2027.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
