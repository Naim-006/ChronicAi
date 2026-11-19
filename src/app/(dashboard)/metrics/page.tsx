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
import {
  Activity,
  Plus,
  TrendingDown,
  ChevronRight,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { mockHealthMetrics } from "@/lib/mock-data";

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
  const [activeTab, setActiveTab] = useState<"glucose" | "bp" | "comparison">("glucose");
  const [showLogModal, setShowLogModal] = useState(false);

  // Form state
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [context, setContext] = useState("fasting");

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Health Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Longitudinal biometrics & laboratory comparisons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log</span>
        </button>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">Log Health Metric</span>
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Metric</label>
                <select className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs">
                  <option>Blood Glucose (mg/dL)</option>
                  <option>Blood Pressure (mmHg)</option>
                  <option>Body Weight (kg)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Timing</label>
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs"
                >
                  <option value="fasting">Fasting</option>
                  <option value="postprandial">Post-Meal (2h)</option>
                  <option value="resting">Resting</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Measurement Value</label>
              <input
                type="number"
                placeholder="e.g. 118"
                value={val1}
                onChange={(e) => setVal1(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-xs font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Tab Bar (iOS Style) */}
      <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs">
        {[
          { id: "glucose", label: "Glucose" },
          { id: "bp", label: "Blood Pressure" },
          { id: "comparison", label: "Lab Matrix" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Glucose Trends */}
      {activeTab === "glucose" && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Daily Glucose Readings (mg/dL)
              </span>
              <span className="text-[11px] text-slate-400">Target Fasting: 70 – 130 mg/dL</span>
            </div>
            <span className="text-xs font-bold text-teal-800">118 mg/dL today</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={glucoseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[80, 170]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 12, fontSize: 11 }}
                />
                <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="fasting" name="Fasting" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="postprandial" name="Post-meal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Blood Pressure */}
      {activeTab === "bp" && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Blood Pressure (mmHg)
              </span>
              <span className="text-[11px] text-slate-400">Target in Diabetes: &lt; 130/80</span>
            </div>
            <span className="text-xs font-bold text-teal-800">122/78 mmHg</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 150]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 12, fontSize: 11 }}
                />
                <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Lab Comparison Matrix (Grouped Rows) */}
      {activeTab === "comparison" && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Lab Biomarker</span>
            <span className="font-semibold text-slate-500">Nov 2026 vs May 2026</span>
          </div>

          {[
            { name: "Hemoglobin A1c", latest: "6.8 %", prev: "7.1 %", goal: "< 7.0 %", improved: true },
            { name: "Fasting Glucose", latest: "118 mg/dL", prev: "126 mg/dL", goal: "70 - 130", improved: true },
            { name: "Estimated GFR (eGFR)", latest: "68 mL/min", prev: "66 mL/min", goal: "> 60 (CKD2)", stable: true },
            { name: "Serum Creatinine", latest: "1.04 mg/dL", prev: "1.08 mg/dL", goal: "0.50 - 1.10", stable: true },
            { name: "Total Cholesterol", latest: "168 mg/dL", prev: "174 mg/dL", goal: "< 200", improved: true },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">{row.name}</span>
                <span className="text-[11px] text-slate-400">Target: {row.goal}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-teal-900 block">{row.latest}</span>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {row.improved ? "✓ Improved" : "Stable"} (Prev: {row.prev})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
