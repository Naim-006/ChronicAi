"use client";

import React, { useState } from "react";
import {
  Printer,
  Share2,
  Lock,
  Copy,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { mockProfile, mockMedications } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function SummariesPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const handleGenerateShareLink = () => {
    const token = `med_share_${Math.random().toString(36).substring(2, 10)}`;
    setShareToken(`https://chronicai.health/shared/${token}?exp=24h`);
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    navigator.clipboard?.writeText(shareToken);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Clinical Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Printable medical history & temporary sharing links.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateShareLink}
            className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* Share Link Banner (if generated) */}
      {shareToken && (
        <div className="rounded-2xl border-2 border-teal-600 bg-teal-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-800" />
              Temporary 24-Hour Physician Access Link
            </span>
            <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Allows temporary read-only access to your active conditions, current medications, and latest labs. Revokes automatically in 24 hours.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              readOnly
              value={shareToken}
              className="flex-1 h-8 rounded-lg border border-teal-300 bg-white px-2.5 text-xs font-mono text-slate-800"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 h-8 px-3 rounded-lg bg-teal-800 text-white text-xs font-semibold"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Structured Clinical Summary (Mobile Friendly & Clean Print) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-5 print:border-none print:shadow-none print:p-0">
        {/* Patient Header */}
        <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {mockProfile.full_name}
            </h2>
            <span className="text-xs text-slate-500 block mt-0.5">
              DOB: {formatDate(mockProfile.date_of_birth)} (Age 64) • Blood Type: {mockProfile.blood_group}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            Verified Record
          </span>
        </div>

        {/* 1. Critical Allergies */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 block mb-1.5 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Confirmed Allergies
          </span>
          <div className="rounded-xl border border-red-200 bg-red-50/30 divide-y divide-red-100 overflow-hidden text-xs">
            {mockProfile.allergies.map((a) => (
              <div key={a.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{a.substance}</span>
                  <span className="text-red-700 text-[11px]">{a.reaction}</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Active Conditions */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Documented Conditions
          </span>
          <div className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden text-xs">
            {mockProfile.chronic_conditions.map((c) => (
              <div key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{c.name}</span>
                  <span className="text-[11px] text-slate-500">{c.notes}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">ICD: {c.icd10}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Active Medications */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Active Pharmacotherapy
          </span>
          <div className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden text-xs">
            {mockMedications.map((m) => (
              <div key={m.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{m.name} ({m.strength})</span>
                  <span className="text-[11px] text-slate-500">{m.frequency} • {m.instructions}</span>
                </div>
                <span className="text-[11px] text-teal-800 font-medium">{m.related_condition}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Recent Verified Labs */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Recent Laboratory Biomarkers (Quest Diagnostics — Nov 2, 2026)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">HbA1c</span>
              <span className="text-sm font-bold text-teal-800">6.8 %</span>
              <span className="text-[9px] text-slate-400 block">Goal &lt; 7.0%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Fasting Glucose</span>
              <span className="text-sm font-bold text-slate-900">118 mg/dL</span>
              <span className="text-[9px] text-slate-400 block">Ref: 70 - 130</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">eGFR Kidney</span>
              <span className="text-sm font-bold text-slate-900">68 mL/min</span>
              <span className="text-[9px] text-slate-400 block">CKD2 (Stable)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Blood Pressure</span>
              <span className="text-sm font-bold text-slate-900">122/78 mmHg</span>
              <span className="text-[9px] text-slate-400 block">Target &lt; 130/80</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
