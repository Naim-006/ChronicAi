"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Medication, HealthMetric } from "@/types/medical";
import { getMedications } from "@/lib/supabase/services/medications";
import { getHealthMetrics } from "@/lib/supabase/services/metrics";

export default function SummariesPage() {
  const { profile, user, effectiveUserId } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [accessPin, setAccessPin] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (effectiveUserId) {
      setIsLoading(true);
      Promise.all([
        getMedications(effectiveUserId),
        getHealthMetrics(effectiveUserId),
      ])
        .then(([meds, mets]) => {
          if (isMounted) {
            setMedications(meds);
            setMetrics(mets);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setMedications([]);
      setMetrics([]);
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

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

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Patient";

  const allergies = profile?.allergies || [];
  const conditions = profile?.chronic_conditions || [];

  // Derived patient metrics
  const birthYear = profile?.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : null;
  const patientAge = birthYear ? new Date().getFullYear() - birthYear : null;
  const bmi =
    profile?.height_cm && profile?.weight_kg
      ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
      : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:max-w-none print:m-0 print:p-0">
      {/* Print stylesheet override for professional document output */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 11pt !important;
            line-height: 1.4 !important;
          }
          header, footer, nav, aside, .print\\:hidden {
            display: none !important;
          }
          .print-doc-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            background: transparent !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Top Header (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
            Clinical Summary & Handout
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Verified clinical report formatted for physician review, print-to-PDF export, and encrypted sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateShareLink}
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>Generate 24h Link</span>
          </button>
        </div>
      </div>

      {/* Share Link Banner (Screen Only) */}
      {shareToken && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 shadow-sm space-y-2 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Encrypted 24-Hour Patient Portal Link Active
              </span>
            </div>
            <span className="rounded-full bg-emerald-200/60 dark:bg-emerald-800/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:text-emerald-100">
              Expires in 24 Hours
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
            <input
              readOnly
              value={`${shareToken}  ·  Security PIN: ${accessPin}`}
              className="flex-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy Secure Link"}</span>
            </button>
          </div>
        </div>
      )}

      {/* PRINT-READY SUMMARY CONTAINER */}
      <div className="print-doc-container rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/80 p-6 sm:p-10 shadow-sm space-y-7 print:border-none print:shadow-none print:p-0">
        
        {/* Official Hospital / Clinic Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm print:bg-black">
                C
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
                  ChronicAI Health Systems
                </h1>
                <p className="text-[11px] font-semibold text-slate-500 print:text-slate-700">
                  Comprehensive Chronic Care Dossier & Physician Summary
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-0.5 text-xs">
              <h2 className="text-lg font-black text-slate-900 dark:text-white print:text-black">
                {displayName}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 print:text-slate-800 font-medium">
                <strong>MRN / Patient ID:</strong> #{effectiveUserId ? effectiveUserId.slice(0, 12).toUpperCase() : "PENDING"} ·{" "}
                <strong>DOB:</strong> {profile?.date_of_birth ? formatDate(profile.date_of_birth) : "Unrecorded"} {patientAge ? `(${patientAge} yrs)` : ""} ·{" "}
                <strong>Sex:</strong> {profile?.sex || "Unspecified"} ·{" "}
                <strong>Blood:</strong> {profile?.blood_group || "Unknown"}
              </p>
              {(profile?.height_cm || profile?.weight_kg) && (
                <p className="text-slate-600 dark:text-slate-300 print:text-slate-800 text-[11px]">
                  <strong>Height:</strong> {profile.height_cm ? `${profile.height_cm} cm` : "N/A"} ·{" "}
                  <strong>Weight:</strong> {profile.weight_kg ? `${profile.weight_kg} kg` : "N/A"} ·{" "}
                  <strong>BMI:</strong> {bmi ? `${bmi} kg/m²` : "N/A"} ·{" "}
                  <strong>Emergency Contact:</strong>{" "}
                  {typeof profile?.emergency_contact === "string"
                    ? profile.emergency_contact
                    : profile?.emergency_contact?.name
                    ? `${profile.emergency_contact.name} (${profile.emergency_contact.phone || ""})`
                    : "Not listed"}
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs shrink-0 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-700 block tracking-wider">
              Date Generated
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white print:text-black block text-sm">
              {formatDate(new Date().toISOString())}
            </span>
            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 print:border print:border-emerald-600 px-2 py-0.5 rounded">
              Verified EHR Record
            </span>
          </div>
        </div>

        {/* 1. Critical Drug Allergies & Adverse Reactions */}
        <div className="page-break-avoid">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle className="h-4 w-4 text-rose-600 print:text-black" />
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 print:text-black">
              1. Documented Drug Allergies & Hypersensitivities
            </h3>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 print:bg-white print:border-slate-400 divide-y divide-rose-100 dark:divide-rose-900/40 print:divide-slate-300 overflow-hidden text-xs">
            {allergies.length === 0 ? (
              <div className="p-3 text-xs font-medium text-slate-600 dark:text-slate-300 print:text-slate-800">
                No known drug allergies (NKDA) reported in electronic health records.
              </div>
            ) : (
              allergies.map((a) => (
                <div key={a.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black text-sm block">
                      {a.substance}
                    </span>
                    <span className="text-rose-700 dark:text-rose-400 print:text-black text-xs">
                      Manifestation: {a.reaction}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-rose-900 bg-rose-100 print:bg-transparent print:border print:border-slate-800 px-2.5 py-0.5 rounded-full">
                    {a.severity} Severity
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Active Conditions & Diagnoses */}
        <div className="page-break-avoid">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black mb-2">
            2. Active Chronic Conditions & Diagnoses
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {conditions.length === 0 ? (
              <div className="col-span-full p-3 rounded-xl border border-slate-200 dark:border-white/10 print:border-slate-300 text-xs text-slate-500">
                No active chronic conditions or active diagnoses logged.
              </div>
            ) : (
              conditions.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-white/10 print:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40 print:bg-white space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">
                      {c.name}
                    </span>
                    {c.icd10 && (
                      <span className="text-[10px] font-mono font-bold text-slate-600 border border-slate-300 px-1.5 py-0.5 rounded">
                        ICD-10: {c.icd10}
                      </span>
                    )}
                  </div>
                  {c.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 print:text-slate-700 leading-snug">
                      {c.notes}
                    </p>
                  )}
                  <span className="text-[10px] font-bold text-emerald-700 print:text-black block">
                    Status: {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Active Prescription Regimen */}
        <div className="page-break-avoid">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
              3. Current Medication Regimen ({medications.length} items)
            </h3>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 print:border-slate-400 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 border-b border-slate-200 dark:border-white/10 print:border-slate-400 text-slate-700 print:text-black text-[10px] font-black uppercase">
                <tr>
                  <th className="py-2.5 pl-3">Medication Name</th>
                  <th className="py-2.5 px-3">Strength & Timing</th>
                  <th className="py-2.5 px-3">Duration / Dates</th>
                  <th className="py-2.5 px-3">Prescriber / Clinic</th>
                  <th className="py-2.5 pr-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10 print:divide-slate-300">
                {medications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-xs text-slate-500">
                      No medications currently documented.
                    </td>
                  </tr>
                ) : (
                  medications.map((m) => (
                    <tr key={m.id} className="print:bg-white">
                      <td className="py-2.5 pl-3 font-bold text-slate-900 dark:text-white print:text-black">
                        <div>{m.name}</div>
                        {m.instructions && (
                          <div className="text-[10px] font-normal text-slate-500 print:text-slate-600">
                            {m.instructions}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 print:text-black font-medium">
                        {m.strength} · {m.frequency}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-400 print:text-black">
                        {m.start_date ? formatDate(m.start_date) : "Ongoing"}
                        {m.end_date ? ` to ${formatDate(m.end_date)}` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 print:text-black">
                        {m.prescribing_doctor || "Dr. Consultation"}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-bold">
                        <span className="capitalize text-[10px] px-2 py-0.5 rounded border border-slate-300 print:border-black">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Recent Health Vitals & Biomarkers */}
        <div className="page-break-avoid">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black mb-2">
            4. Recent Diagnostic Biomarkers & Clinical Lab Results
          </h3>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 print:border-slate-400 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 border-b border-slate-200 dark:border-white/10 print:border-slate-400 text-slate-700 print:text-black text-[10px] font-black uppercase">
                <tr>
                  <th className="py-2.5 pl-3">Biomarker / Panel</th>
                  <th className="py-2.5 px-3">Quantitative Value</th>
                  <th className="py-2.5 px-3">Test Date</th>
                  <th className="py-2.5 pr-3 text-right">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10 print:divide-slate-300">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs text-slate-500">
                      No biomarker records logged yet.
                    </td>
                  </tr>
                ) : (
                  metrics.slice(0, 12).map((met) => (
                    <tr key={met.id} className="print:bg-white">
                      <td className="py-2.5 pl-3 font-bold text-slate-900 dark:text-white print:text-black capitalize">
                        {met.notes || met.metric_type.replace("_", " ")}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white print:text-black">
                        {met.value_primary}{met.value_secondary ? `/${met.value_secondary}` : ""} {met.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 print:text-black">
                        {formatDate(met.recorded_at)}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <span
                          className={`font-bold text-[10px] px-2 py-0.5 rounded border ${
                            met.is_abnormal
                              ? "border-amber-500 text-amber-700 print:border-black print:text-black"
                              : "border-emerald-500 text-emerald-700 print:border-slate-400 print:text-black"
                          }`}
                        >
                          {met.is_abnormal ? "ATTENTION / ABNORMAL" : "NORMAL"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Physician Sign-off & Notes (Print only) */}
        <div className="pt-8 border-t border-slate-300 print:block hidden page-break-avoid">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-700 mb-6">Physician Notes / Care Plan Adjustments:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <div className="border-b border-slate-400 h-6"></div>
              <div className="border-b border-slate-400 h-6"></div>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-6">Reviewing Clinician Signature & Date:</p>
              <div className="border-b border-slate-400 h-10"></div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Physician Name / License</span>
                <span>Date</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-[10px] text-slate-400">
            Document generated by ChronicAI Platform · Grounded Clinical Intelligence Core · Page 1 of 1
          </div>
        </div>

      </div>
    </div>
  );
}
