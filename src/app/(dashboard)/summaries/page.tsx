"use client";

import React, { useState } from "react";
import {
  FileText,
  Printer,
  Share2,
  Lock,
  Calendar,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Download,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProfile, mockMedications, mockHealthMetrics, mockTimelineEvents } from "@/lib/mock-data";
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
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Summary & Patient-Controlled Sharing"
        description="Compile structured, print-ready medical summaries for healthcare providers, and generate encrypted time-limited access links."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Summaries & Sharing" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs h-8 gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateShareLink}
              className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              Generate Secure Link
            </Button>
          </div>
        }
      />

      {/* Share Link Drawer if active */}
      {shareToken && (
        <Card className="border-2 border-teal-600 bg-teal-50/50 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-teal-800" />
                <span className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                  Temporary Encrypted Physician Link Generated
                </span>
                <Badge variant="outline" className="border-teal-300 text-teal-900 text-[10px]">
                  Expires in 24 Hours
                </Badge>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                This link allows temporary read-only access to your active conditions, medications, and recent lab panels. Access automatically revokes after 24 hours.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={shareToken}
                  className="rounded border border-teal-300 bg-white px-2.5 py-1 text-xs text-slate-800 w-80 font-mono"
                />
                <Button size="sm" onClick={handleCopyLink} className="text-xs h-7 gap-1 bg-teal-700 text-white">
                  {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* The Printable Clinical Summary Card */}
      <Card className="border-slate-300 shadow-sm bg-white print:border-none print:shadow-none p-6 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              PATIENT CLINICAL HEALTH SUMMARY
            </h1>
            <span className="text-xs text-slate-500 block mt-0.5">
              Generated on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} • Universal Personal Medical AI Platform
            </span>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="font-bold text-slate-900 block">{mockProfile.full_name}</span>
            <span className="text-slate-500 block">DOB: {formatDate(mockProfile.date_of_birth)} (Age 64) • Blood: {mockProfile.blood_group}</span>
          </div>
        </div>

        {/* Section 1: Critical Safety & Allergies */}
        <div className="rounded-lg border-2 border-red-200 bg-red-50/30 p-4">
          <h2 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Documented Allergies & Adverse Drug Reactions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {mockProfile.allergies.map((a) => (
              <div key={a.id} className="p-2.5 rounded bg-white border border-red-200">
                <span className="font-bold text-slate-900">{a.substance}</span>
                <span className="text-red-700 font-semibold block text-[11px] mt-0.5">Reaction: {a.reaction}</span>
                <span className="text-slate-400 text-[10px]">Severity: {a.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Active Diagnoses */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
            Active Chronic Conditions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {mockProfile.chronic_conditions.map((c) => (
              <div key={c.id} className="p-3 rounded border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block">{c.name}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">ICD-10: {c.icd10}</span>
                <p className="text-[11px] text-slate-600 mt-1">{c.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Current Prescriptions */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
            Current Active Pharmacotherapy
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="p-2 font-semibold">Medication & Strength</th>
                <th className="p-2 font-semibold">Dosage & Frequency</th>
                <th className="p-2 font-semibold">Indication</th>
                <th className="p-2 font-semibold">Prescriber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockMedications.map((m) => (
                <tr key={m.id}>
                  <td className="p-2 font-bold text-slate-900">{m.name} ({m.strength})</td>
                  <td className="p-2 text-slate-700">{m.frequency}</td>
                  <td className="p-2 text-slate-600">{m.related_condition}</td>
                  <td className="p-2 text-slate-500">{m.prescribing_doctor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Recent Verified Laboratory Markers */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
            Recent Laboratory Biomarkers (Quest Diagnostics — Nov 2, 2026)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-500 block text-[11px]">Hemoglobin A1c</span>
              <span className="text-base font-bold text-teal-800">6.8 %</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Goal: &lt; 7.0%</span>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-500 block text-[11px]">Fasting Glucose</span>
              <span className="text-base font-bold text-slate-900">118 mg/dL</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Ref: 70 - 130</span>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-500 block text-[11px]">Estimated GFR</span>
              <span className="text-base font-bold text-slate-900">68 mL/min</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">CKD Stage 2 (Stable)</span>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50/50">
              <span className="text-slate-500 block text-[11px]">Blood Pressure</span>
              <span className="text-base font-bold text-slate-900">122/78 mmHg</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Target: &lt; 130/80</span>
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Footer */}
        <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-tight">
          <strong>Data Provenance Notice:</strong> This clinical summary was compiled from patient-owned medical records stored on the Universal Personal Medical AI platform. All laboratory values and prescriptions have been verified against original diagnostic reports.
        </div>
      </Card>
    </div>
  );
}
