"use client";

import React from "react";
import Link from "next/link";
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingDown,
  Eye,
  ShieldCheck,
  Pill,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { mockProfile, mockMedications, mockHealthMetrics } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function ChronicCarePage() {
  const diabetesCondition = mockProfile.chronic_conditions.find((c) => c.name.includes("Diabetes"));
  const diabetesMeds = mockMedications.filter((m) => m.related_condition?.includes("Diabetes"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chronic Care Management — Diabetes Protocol"
        description="Specialized multi-marker monitoring for Type 2 Diabetes Mellitus, cardiovascular risk reduction, and renal preservation."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Chronic Care" }]}
      />

      {/* Disease Summary Card */}
      <Card className="border-teal-200 bg-teal-50/40">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-teal-700 text-white shadow-xs">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Type 2 Diabetes Mellitus</h2>
                  <Badge variant="default" className="text-xs">
                    ICD-10: E11.9
                  </Badge>
                  <Badge variant="outline" className="border-teal-300 text-teal-800 text-xs">
                    Well-Managed
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  Diagnosed on May 10, 2018 (8 years management). Managed through lifestyle modifications, Metformin ER 1000mg BID, and SGLT2 inhibitor Empagliflozin 10mg QD with regular quarterly endocrinology follow-ups.
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <Link href="/assistant">
                <Button size="sm" className="text-xs h-8 bg-teal-700 hover:bg-teal-800 text-white w-full gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze Care Plan
                </Button>
              </Link>
              <Link href="/metrics">
                <Button size="sm" variant="outline" className="text-xs h-8 w-full border-teal-300 text-teal-900 hover:bg-teal-100">
                  View Trends
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current HbA1c"
          value={6.8}
          unit="%"
          subtitle="Clinician Target: < 7.0%"
          icon={TrendingDown}
          status="normal"
          trend={{ value: "Target achieved in Nov", isPositive: true }}
        />
        <StatCard
          title="Fasting Glucose"
          value={118}
          unit="mg/dL"
          subtitle="Target: 70 - 130 mg/dL"
          icon={Activity}
          status="normal"
          trend={{ value: "118 mg/dL this morning", isPositive: true }}
        />
        <StatCard
          title="Renal Preservation"
          value="eGFR 68"
          unit="mL/min"
          subtitle="Stage 2 CKD (Stable)"
          icon={ShieldCheck}
          status="normal"
          trend={{ value: "ACE inhibitor active", isNeutral: true }}
        />
        <StatCard
          title="Diabetic Eye Exam"
          value="Clear"
          subtitle="Annual screening Nov 2026"
          icon={Eye}
          status="normal"
          trend={{ value: "Negative for retinopathy", isPositive: true }}
        />
      </div>

      {/* Care Protocols and Active Regimens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Diabetes Regimen */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-700" />
              Active Glycemic & Organ Protection Pharmacotherapy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diabetesMeds.map((med) => (
              <div key={med.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{med.name} ({med.strength})</span>
                  <Badge variant="outline" className="text-[10px]">
                    {med.status}
                  </Badge>
                </div>
                <div className="text-slate-600 font-medium">
                  {med.frequency} • {med.instructions}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Prescribed by {med.prescribing_doctor} for {med.related_condition}.
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preventative Screening Cadence */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-700" />
              Diabetic Preventive Screening Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Annual Dilated Eye Screening</span>
                <span className="text-slate-600 block">Completed Nov 14, 2026 with Dr. Sarah Jenkins. Result: No microvascular disease.</span>
                <span className="text-[10px] text-emerald-800 font-semibold block mt-1">Next Due: November 2027</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Quarterly HbA1c & Metabolic Panel</span>
                <span className="text-slate-600 block">Completed Nov 2, 2026 at Quest Diagnostics (6.8%).</span>
                <span className="text-[10px] text-emerald-800 font-semibold block mt-1">Next Due: February 2027</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Urine Albumin-to-Creatinine Ratio (UACR)</span>
                <span className="text-slate-600 block">Renal microalbumin monitoring for Stage 2 CKD.</span>
                <span className="text-[10px] text-amber-800 font-semibold block mt-1">Scheduled to be reviewed with Dr. Wei on Dec 8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
