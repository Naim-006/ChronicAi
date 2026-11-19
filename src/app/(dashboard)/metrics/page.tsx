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
  TrendingUp,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mockHealthMetrics, mockDocuments } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

// Glucose Trend Data for Chart
const glucoseChartData = [
  { date: "Nov 15", fasting: 114, postprandial: 142 },
  { date: "Nov 16", fasting: 120, postprandial: 135 },
  { date: "Nov 17", fasting: 128, postprandial: 148 },
  { date: "Nov 18", fasting: 122, postprandial: 138 },
  { date: "Nov 19", fasting: 118, postprandial: 132 },
];

// Blood Pressure Trend Data
const bpChartData = [
  { date: "May 26", systolic: 132, diastolic: 82 },
  { date: "Aug 26", systolic: 126, diastolic: 78 },
  { date: "Nov 15", systolic: 126, diastolic: 80 },
  { date: "Nov 18", systolic: 122, diastolic: 78 },
];

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(mockHealthMetrics);
  const [activeTab, setActiveTab] = useState("glucose");
  const [showLogModal, setShowLogModal] = useState(false);

  // New measurement form state
  const [newType, setNewType] = useState("glucose");
  const [newVal1, setNewVal1] = useState("");
  const [newVal2, setNewVal2] = useState("");
  const [newContext, setNewContext] = useState("fasting");
  const [newNotes, setNewNotes] = useState("");

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVal1) return;

    const newMetric = {
      id: `met-${Date.now()}`,
      user_id: "user-elena-vance",
      metric_type: newType as any,
      value_primary: parseFloat(newVal1),
      value_secondary: newVal2 ? parseFloat(newVal2) : undefined,
      unit: newType === "glucose" ? "mg/dL" : newType === "blood_pressure" ? "mmHg" : "kg",
      context: newContext as any,
      recorded_at: new Date().toISOString(),
      notes: newNotes,
      created_at: new Date().toISOString(),
    };

    setMetrics((prev) => [newMetric, ...prev]);
    setShowLogModal(false);
    setNewVal1("");
    setNewVal2("");
    setNewNotes("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Analytics & Measurements"
        description="Monitor time-series trends in blood glucose, HbA1c, blood pressure, and compare longitudinal laboratory reports."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Health Analytics" }]}
        actions={
          <Button
            size="sm"
            onClick={() => setShowLogModal(true)}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Measurement
          </Button>
        }
      />

      {/* Manual Measurement Modal */}
      {showLogModal && (
        <Card className="border-2 border-teal-600 bg-white p-5 shadow-lg">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Record Health Biometric
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLogModal(false)}
              className="h-7 w-7 p-0 text-slate-400"
            >
              ×
            </Button>
          </CardHeader>
          <form onSubmit={handleAddMeasurement} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Biometric Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                >
                  <option value="glucose">Blood Glucose (mg/dL)</option>
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                  <option value="hba1c">Hemoglobin A1c (%)</option>
                  <option value="weight">Body Weight (kg)</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Context / Timing
                </label>
                <select
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                >
                  <option value="fasting">Fasting (Morning before meal)</option>
                  <option value="postprandial">Postprandial (2h after meal)</option>
                  <option value="resting">Resting</option>
                  <option value="bedtime">Bedtime</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {newType === "blood_pressure" ? "Systolic (Upper)" : "Value *"}
                </label>
                <Input
                  required
                  type="number"
                  step="0.1"
                  placeholder={newType === "glucose" ? "e.g. 118" : newType === "hba1c" ? "e.g. 6.8" : "e.g. 120"}
                  value={newVal1}
                  onChange={(e) => setNewVal1(e.target.value)}
                  className="text-xs"
                />
              </div>

              {newType === "blood_pressure" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Diastolic (Lower) *
                  </label>
                  <Input
                    required
                    type="number"
                    placeholder="e.g. 80"
                    value={newVal2}
                    onChange={(e) => setNewVal2(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Measurement Notes
              </label>
              <Input
                placeholder="e.g. Seated 5 min, left arm cuff"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLogModal(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-8"
              >
                Save Measurement
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Analytics Tabs: Charts & Comparative Matrix */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="glucose">Blood Glucose Trends</TabsTrigger>
          <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
          <TabsTrigger value="comparison">Lab Report Comparison Matrix</TabsTrigger>
        </TabsList>

        {/* Tab 1: Glucose Chart */}
        <TabsContent value="glucose" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Fasting & Postprandial Blood Glucose (mg/dL)
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Daily fingerstick records over the last 5 days. Target range: 70 – 130 mg/dL fasting.
                </p>
              </div>
              <Badge variant="success" className="text-xs">
                In Target Range
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={glucoseChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[80, 180]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: 8, fontSize: 12 }}
                    />
                    {/* Clinical Reference Target Bands */}
                    <ReferenceLine y={130} stroke="#b45309" strokeDasharray="4 4" label={{ value: "Fasting Upper Goal (130)", fill: "#b45309", fontSize: 10 }} />
                    <ReferenceLine y={70} stroke="#b45309" strokeDasharray="4 4" label={{ value: "Fasting Lower Goal (70)", fill: "#b45309", fontSize: 10 }} />
                    <Line type="monotone" dataKey="fasting" name="Fasting Glucose" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="postprandial" name="Postprandial (2h)" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Blood Pressure Chart */}
        <TabsContent value="bp" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Blood Pressure Trajectory (mmHg)
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Systolic & Diastolic readings. Clinical goal in diabetic renal protection: &lt; 130/80 mmHg.
                </p>
              </div>
              <Badge variant="success" className="text-xs">
                Controlled on Lisinopril
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[60, 150]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: 8, fontSize: 12 }}
                    />
                    <ReferenceLine y={130} stroke="#b45309" strokeDasharray="3 3" label={{ value: "Target Systolic (130)", fill: "#b45309", fontSize: 10 }} />
                    <ReferenceLine y={80} stroke="#b45309" strokeDasharray="3 3" label={{ value: "Target Diastolic (80)", fill: "#b45309", fontSize: 10 }} />
                    <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Laboratory Report Comparison Matrix */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">
                Multi-Report Laboratory Comparison Matrix
              </CardTitle>
              <p className="text-xs text-slate-500">
                Direct comparative delta between your recent Quest Diagnostics laboratory panels.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="p-3 font-semibold">Laboratory Biomarker</th>
                      <th className="p-3 font-semibold">Nov 2, 2026 (Latest)</th>
                      <th className="p-3 font-semibold">May 18, 2026</th>
                      <th className="p-3 font-semibold">Nov 10, 2025</th>
                      <th className="p-3 font-semibold">Standard Reference</th>
                      <th className="p-3 font-semibold">Clinical Trajectory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">Hemoglobin A1c</td>
                      <td className="p-3 font-bold text-teal-800">6.8 %</td>
                      <td className="p-3 text-slate-700">7.1 %</td>
                      <td className="p-3 text-slate-700">7.4 %</td>
                      <td className="p-3 text-slate-500">&lt; 7.0 % (Diabetic Goal)</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <TrendingDown className="h-3 w-3" /> Improved (-0.6%)
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">Fasting Plasma Glucose</td>
                      <td className="p-3 font-bold text-slate-900">118 mg/dL</td>
                      <td className="p-3 text-slate-700">126 mg/dL</td>
                      <td className="p-3 text-slate-700">135 mg/dL</td>
                      <td className="p-3 text-slate-500">70 - 130 mg/dL</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <TrendingDown className="h-3 w-3" /> Improved (-17 mg/dL)
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">Estimated GFR (eGFR)</td>
                      <td className="p-3 font-bold text-slate-900">68 mL/min</td>
                      <td className="p-3 text-slate-700">66 mL/min</td>
                      <td className="p-3 text-slate-700">67 mL/min</td>
                      <td className="p-3 text-slate-500">&gt; 60 mL/min/1.73m2</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Stable (CKD Stage 2)
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">Serum Creatinine</td>
                      <td className="p-3 font-bold text-slate-900">1.04 mg/dL</td>
                      <td className="p-3 text-slate-700">1.08 mg/dL</td>
                      <td className="p-3 text-slate-700">1.06 mg/dL</td>
                      <td className="p-3 text-slate-500">0.50 - 1.10 mg/dL</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Normal Baseline
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">Total Cholesterol</td>
                      <td className="p-3 font-bold text-slate-900">168 mg/dL</td>
                      <td className="p-3 text-slate-700">174 mg/dL</td>
                      <td className="p-3 text-slate-700">182 mg/dL</td>
                      <td className="p-3 text-slate-500">&lt; 200 mg/dL</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <TrendingDown className="h-3 w-3" /> Controlled (Atorvastatin)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
