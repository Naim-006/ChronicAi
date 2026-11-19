"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Plus, X, Activity, Heart, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const glucoseData = [
  { date: "Nov 15", fasting: 114, postprandial: 142 },
  { date: "Nov 16", fasting: 120, postprandial: 135 },
  { date: "Nov 17", fasting: 128, postprandial: 148 },
  { date: "Nov 18", fasting: 122, postprandial: 138 },
  { date: "Nov 19", fasting: 118, postprandial: 132 },
];

const bpData = [
  { date: "May 26", systolic: 132, diastolic: 82 },
  { date: "Aug 26", systolic: 126, diastolic: 78 },
  { date: "Nov 15", systolic: 126, diastolic: 80 },
  { date: "Nov 18", systolic: 122, diastolic: 78 },
];

export default function MetricsPage() {
  const [activeTab, setActiveTab] = useState("glucose");
  const [showLogModal, setShowLogModal] = useState(false);
  const [val1, setVal1] = useState("");
  const [context, setContext] = useState("fasting");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics"
        title="Health Analytics"
        description="Longitudinal biometrics and lab comparisons"
        actions={
          <Button size="sm" onClick={() => setShowLogModal(true)}>
            <Plus className="h-3.5 w-3.5" />
            Log vitals
          </Button>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="soft-card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              Fasting glucose
            </span>
            <span className="text-lg font-extrabold text-[var(--foreground)]">
              118 <span className="text-xs font-medium text-[var(--muted-foreground)]">mg/dL</span>
            </span>
          </div>
        </div>
        <div className="soft-card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              Blood pressure
            </span>
            <span className="text-lg font-extrabold text-[var(--foreground)]">
              122/78 <span className="text-xs font-medium text-[var(--muted-foreground)]">mmHg</span>
            </span>
          </div>
        </div>
        <div className="soft-card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              Latest HbA1c
            </span>
            <span className="text-lg font-extrabold text-emerald-700">
              6.8% <span className="text-xs font-medium text-emerald-600">−0.3%</span>
            </span>
          </div>
        </div>
      </div>

      {showLogModal && (
        <div className="soft-card space-y-3 border-emerald-200 p-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-sm font-bold text-[var(--foreground)]">Log health metric</span>
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="mb-1 block font-semibold">Metric</label>
              <select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-3 text-xs">
                <option>Blood Glucose (mg/dL)</option>
                <option>Blood Pressure (mmHg)</option>
                <option>Body Weight (kg)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold">Timing</label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-3 text-xs"
              >
                <option value="fasting">Fasting</option>
                <option value="postprandial">Post-meal (2h)</option>
                <option value="resting">Resting</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Value</label>
            <Input
              type="number"
              placeholder="e.g. 118"
              value={val1}
              onChange={(e) => setVal1(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setShowLogModal(false)}>
              Save
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
          <TabsTrigger value="glucose">Glucose</TabsTrigger>
          <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
          <TabsTrigger value="comparison">Lab Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="glucose">
          <div className="soft-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-[var(--foreground)]">
                  Daily glucose (mg/dL)
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Target fasting: 70 – 130
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700">118 today</span>
            </div>
            <div className="h-64 w-full pt-2 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={glucoseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
                  <XAxis dataKey="date" stroke="#5c7268" fontSize={11} />
                  <YAxis stroke="#5c7268" fontSize={11} domain={[80, 170]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#dce6e2",
                      borderRadius: 16,
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine y={130} stroke="#d97706" strokeDasharray="3 3" />
                  <ReferenceLine y={70} stroke="#d97706" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="fasting"
                    name="Fasting"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#16a34a" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="postprandial"
                    name="Post-meal"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bp">
          <div className="soft-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-[var(--foreground)]">
                  Blood pressure (mmHg)
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Diabetes target: &lt; 130/80
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700">122/78</span>
            </div>
            <div className="h-64 w-full pt-2 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
                  <XAxis dataKey="date" stroke="#5c7268" fontSize={11} />
                  <YAxis stroke="#5c7268" fontSize={11} domain={[60, 150]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#dce6e2",
                      borderRadius: 16,
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine y={130} stroke="#d97706" strokeDasharray="3 3" />
                  <ReferenceLine y={80} stroke="#d97706" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#16a34a" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#0ea5e9" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="soft-card overflow-hidden divide-y divide-[var(--border)]/70">
            <div className="flex items-center justify-between bg-[var(--muted)]/50 px-5 py-3.5 text-xs">
              <span className="font-bold text-[var(--foreground)]">Lab biomarker</span>
              <span className="font-semibold text-[var(--muted-foreground)]">
                Nov 2026 vs May 2026
              </span>
            </div>
            {[
              {
                name: "Hemoglobin A1c",
                latest: "6.8 %",
                prev: "7.1 %",
                goal: "< 7.0 %",
                improved: true,
              },
              {
                name: "Fasting Glucose",
                latest: "118 mg/dL",
                prev: "126 mg/dL",
                goal: "70 - 130",
                improved: true,
              },
              {
                name: "Estimated GFR (eGFR)",
                latest: "68 mL/min",
                prev: "66 mL/min",
                goal: "> 60 (CKD2)",
                improved: false,
              },
              {
                name: "Serum Creatinine",
                latest: "1.04 mg/dL",
                prev: "1.08 mg/dL",
                goal: "0.50 - 1.10",
                improved: false,
              },
              {
                name: "Total Cholesterol",
                latest: "168 mg/dL",
                prev: "174 mg/dL",
                goal: "< 200",
                improved: true,
              },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--muted)]/40"
              >
                <div>
                  <span className="block text-xs font-bold text-[var(--foreground)]">
                    {row.name}
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Target: {row.goal}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-emerald-800">
                    {row.latest}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600">
                    {row.improved ? "Improved" : "Stable"} · Prev {row.prev}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
