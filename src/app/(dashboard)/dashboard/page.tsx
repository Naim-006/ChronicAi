"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Clock,
  Sparkles,
  Pill,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  FileText,
  Plus,
  CheckCircle2,
  CalendarClock,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import {
  mockProfile,
  mockMedications,
  mockAppointments,
  mockHealthMetrics,
  mockTimelineEvents,
  mockDocuments,
} from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";

export default function DashboardPage() {
  const [meds, setMeds] = useState(mockMedications);
  const [loggedMeds, setLoggedMeds] = useState<Record<string, "taken" | "skipped">>({
    "med-1": "taken",
    "med-2": "taken",
    "med-3": "taken",
  });

  const nextAppointment = mockAppointments.find((a) => a.status === "upcoming") || mockAppointments[0];
  const pendingReviewDocs = mockDocuments.filter((d) => d.status === "needs_review");

  const handleMedAction = (medId: string, status: "taken" | "skipped") => {
    setLoggedMeds((prev) => ({
      ...prev,
      [medId]: status,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting & Verification Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Good morning, {mockProfile.full_name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here is your longitudinal health summary as of{" "}
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vault">
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5">
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              Upload Report
            </Button>
          </Link>
          <Link href="/assistant">
            <Button size="sm" className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white">
              <Sparkles className="h-3.5 w-3.5 text-teal-200" />
              Ask Medical AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Queue Alert if pending documents exist */}
      {pendingReviewDocs.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-1.5 text-amber-700 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold block">Document Extraction Verification Needed</span>
              <span className="text-[11px] text-amber-800 block">
                {pendingReviewDocs.length} new document ({pendingReviewDocs[0].file_name}) has been parsed. Review and confirm clinical facts.
              </span>
            </div>
          </div>
          <Link href="/vault">
            <Button size="sm" variant="outline" className="text-xs h-7 border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* Key Health Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fasting Glucose"
          value={118}
          unit="mg/dL"
          subtitle="Target: 70 - 130 mg/dL"
          icon={Activity}
          status="normal"
          trend={{ value: "4 mg/dL lower than yesterday", isPositive: true }}
        />
        <StatCard
          title="Latest HbA1c"
          value={6.8}
          unit="%"
          subtitle="Target: < 7.0%"
          icon={TrendingDown}
          status="normal"
          trend={{ value: "-0.3% from May 2026", isPositive: true }}
        />
        <StatCard
          title="Blood Pressure"
          value="122/78"
          unit="mmHg"
          subtitle="Resting (Omron Cuff)"
          icon={Activity}
          status="normal"
          trend={{ value: "Stable in target zone", isNeutral: true }}
        />
        <StatCard
          title="Medication Adherence"
          value="100%"
          unit="7-day avg"
          subtitle="4 active prescriptions"
          icon={Pill}
          status="normal"
          trend={{ value: "All morning doses taken", isPositive: true }}
        />
      </div>

      {/* Main Grid: Left Column (Medications & Timeline), Right Column (Appointments & AI Insight) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Span 2) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Medication Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Today's Medication Schedule</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track your daily prescribed doses. End of course requires confirmation.
                </p>
              </div>
              <Link href="/medications" className="text-xs font-medium text-teal-700 hover:underline flex items-center gap-1">
                View all ({meds.length})
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {meds.map((med) => {
                  const state = loggedMeds[med.id];
                  return (
                    <div key={med.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-slate-100 text-slate-600 mt-0.5">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{med.name}</span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {med.strength}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {med.frequency} • {med.instructions}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {state === "taken" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Taken
                          </span>
                        ) : state === "skipped" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                            Skipped
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMedAction(med.id, "taken")}
                              className="text-xs h-7 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              Mark Taken
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMedAction(med.id, "skipped")}
                              className="text-xs h-7 text-slate-500 hover:bg-slate-100"
                            >
                              Skip
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Medical Journey Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Medical Activity</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological records from your lifelong health timeline.
                </p>
              </div>
              <Link href="/timeline" className="text-xs font-medium text-teal-700 hover:underline flex items-center gap-1">
                Full timeline
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {mockTimelineEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-700 shadow-xs" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{event.title}</span>
                        <Badge variant="secondary" className="text-[10px] py-0 capitalize">
                          {event.event_type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {event.description}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {formatDate(event.event_date)} • {event.facility_or_doctor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Grounded AI Medical Insight Card */}
          <Card className="border-teal-200 bg-teal-50/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-teal-800">
                <Sparkles className="h-4 w-4" />
                <CardTitle className="text-sm font-semibold text-teal-900">
                  AI Context Insight
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Your HbA1c from Quest Diagnostics has dropped from <strong>7.1%</strong> in May 2026 to <strong>6.8%</strong> in November 2026, reaching your clinical target of &lt; 7.0%.
              </p>
              <div className="rounded-md border border-teal-200 bg-white p-2.5 text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Sourced from:</span>
                <span className="text-slate-500 block truncate">• Metabolic_Lipid_Panel_Nov2026.pdf (Quest)</span>
                <span className="text-slate-500 block truncate">• Comprehensive_Metabolic_Panel_May2026.pdf</span>
              </div>
              <Link href="/assistant" className="inline-block w-full">
                <Button size="sm" variant="outline" className="w-full text-xs h-8 border-teal-300 text-teal-900 hover:bg-teal-100">
                  Explore with Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Appointment Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upcoming Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{nextAppointment.doctor_name}</span>
                    <span className="text-[11px] text-teal-700 font-medium block">{nextAppointment.specialty}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {nextAppointment.status}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(nextAppointment.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatTime(nextAppointment.appointment_time)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">AI Preparation Checklist:</span>
                  <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc pl-3.5">
                    {nextAppointment.preparation_questions?.slice(0, 2).map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <Link href="/appointments" className="w-full block">
                  <Button size="sm" variant="outline" className="w-full text-xs h-8">
                    Manage Appointments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Active Health Conditions Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Active Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockProfile.chronic_conditions.map((cond) => (
                  <div key={cond.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-semibold text-slate-800 block">{cond.name}</span>
                      <span className="text-[10px] text-slate-500">ICD: {cond.icd10} • Since {formatDate(cond.diagnosed_date)}</span>
                    </div>
                    <Badge variant={cond.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                      {cond.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
