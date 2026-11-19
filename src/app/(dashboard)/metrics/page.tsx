"use client";

import React, { useState, useEffect } from "react";
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
import { Plus, X, Activity, Heart, TrendingDown, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { HealthMetric, MetricType } from "@/types/medical";
import { getHealthMetrics, logHealthMetric } from "@/lib/supabase/services/metrics";
import { formatDate } from "@/lib/utils";

export default function MetricsPage() {
  const { effectiveUserId } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("glucose");
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [metricType, setMetricType] = useState<MetricType>("glucose");
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [context, setContext] = useState<"fasting" | "postprandial" | "resting" | "random" | "bedtime">("fasting");

  useEffect(() => {
    let isMounted = true;
    if (effectiveUserId) {
      setIsLoading(true);
      getHealthMetrics(effectiveUserId)
        .then((data) => {
          if (isMounted) setMetrics(data);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setMetrics([]);
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val1 || !effectiveUserId) return;

    setIsSubmitting(true);
    try {
      const v1 = parseFloat(val1);
      const v2 = val2 ? parseFloat(val2) : undefined;
      const unit = metricType === "glucose" ? "mg/dL" : metricType === "blood_pressure" ? "mmHg" : "kg";

      const created = await logHealthMetric({
        user_id: effectiveUserId,
        metric_type: metricType,
        value_primary: v1,
        value_secondary: v2,
        unit,
        context,
        recorded_at: new Date().toISOString(),
      });

      setMetrics((prev) => [created, ...prev]);
      setShowLogModal(false);
      setVal1("");
      setVal2("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build chart datasets from real user metrics
  const glucoseMetrics = metrics
    .filter((m) => m.metric_type === "glucose")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const glucoseData = glucoseMetrics.map((m) => ({
    date: formatDate(m.recorded_at),
    fasting: m.context === "fasting" ? m.value_primary : undefined,
    postprandial: m.context === "postprandial" ? m.value_primary : undefined,
    value: m.value_primary,
  }));

  const bpMetrics = metrics
    .filter((m) => m.metric_type === "blood_pressure")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const bpData = bpMetrics.map((m) => ({
    date: formatDate(m.recorded_at),
    systolic: m.value_primary,
    diastolic: m.value_secondary || 80,
  }));

  const latestGlucose = metrics.find((m) => m.metric_type === "glucose");
  const latestBP = metrics.find((m) => m.metric_type === "blood_pressure");
  const latestHbA1c = metrics.find((m) => m.metric_type === "hba1c");

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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              Fasting glucose
            </span>
            <span className="text-lg font-extrabold text-[var(--foreground)]">
              {latestGlucose ? latestGlucose.value_primary : "—"}{" "}
              <span className="text-xs font-medium text-[var(--muted-foreground)]">mg/dL</span>
            </span>
          </div>
        </div>

        <div className="soft-card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              Blood pressure
            </span>
            <span className="text-lg font-extrabold text-[var(--foreground)]">
              {latestBP ? `${latestBP.value_primary}/${latestBP.value_secondary || 80}` : "—"}{" "}
              <span className="text-xs font-medium text-[var(--muted-foreground)]">mmHg</span>
            </span>
          </div>
        </div>

        <div className="soft-card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              Latest HbA1c
            </span>
            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              {latestHbA1c ? `${latestHbA1c.value_primary}%` : "—"}
            </span>
          </div>
        </div>
      </div>

      {showLogModal && (
        <div className="soft-card space-y-3 border-emerald-200 dark:border-emerald-800 p-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-sm font-bold text-[var(--foreground)]">Log health metric</span>
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleLog} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-semibold text-[var(--foreground)]">Metric</label>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value as MetricType)}
                  className="h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 text-xs text-[var(--foreground)]"
                >
                  <option value="glucose" className="bg-[var(--card)] text-[var(--foreground)]">Blood Glucose (mg/dL)</option>
                  <option value="blood_pressure" className="bg-[var(--card)] text-[var(--foreground)]">Blood Pressure (mmHg)</option>
                  <option value="weight" className="bg-[var(--card)] text-[var(--foreground)]">Body Weight (kg)</option>
                  <option value="heart_rate" className="bg-[var(--card)] text-[var(--foreground)]">Heart Rate (bpm)</option>
                  <option value="hba1c" className="bg-[var(--card)] text-[var(--foreground)]">HbA1c (%)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-[var(--foreground)]">Timing / Context</label>
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value as any)}
                  className="h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 text-xs text-[var(--foreground)]"
                >
                  <option value="fasting" className="bg-[var(--card)] text-[var(--foreground)]">Fasting</option>
                  <option value="postprandial" className="bg-[var(--card)] text-[var(--foreground)]">Post-meal (2h)</option>
                  <option value="resting" className="bg-[var(--card)] text-[var(--foreground)]">Resting</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-semibold text-[var(--foreground)]">
                  {metricType === "blood_pressure" ? "Systolic *" : "Reading Value *"}
                </label>
                <Input
                  required
                  type="number"
                  step="any"
                  placeholder="e.g. 118"
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                />
              </div>
              {metricType === "blood_pressure" && (
                <div>
                  <label className="mb-1 block font-semibold text-[var(--foreground)]">Diastolic *</label>
                  <Input
                    required
                    type="number"
                    step="any"
                    placeholder="e.g. 78"
                    value={val2}
                    onChange={(e) => setVal2(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="outline" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save reading"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="glucose" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="glucose">Blood Glucose</TabsTrigger>
          <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
          <TabsTrigger value="comparison">Lab Records</TabsTrigger>
        </TabsList>

        <TabsContent value="glucose">
          <div className="soft-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-[var(--foreground)]">
                  Blood glucose trajectory (mg/dL)
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Fasting target: 80–130 · Post-meal target: &lt; 180
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {latestGlucose ? `${latestGlucose.value_primary} mg/dL` : "No data"}
              </span>
            </div>
            <div className="h-64 w-full pt-2 sm:h-72">
              {glucoseData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                  No blood glucose readings logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={glucoseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[70, 200]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: 16,
                        fontSize: 11,
                        color: "var(--foreground)",
                      }}
                    />
                    <ReferenceLine y={130} stroke="#16a34a" strokeDasharray="3 3" />
                    <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Glucose"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
                  Target: &lt; 130/80
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {latestBP ? `${latestBP.value_primary}/${latestBP.value_secondary || 80}` : "No data"}
              </span>
            </div>
            <div className="h-64 w-full pt-2 sm:h-72">
              {bpData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                  No blood pressure readings logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[60, 160]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: 16,
                        fontSize: 11,
                        color: "var(--foreground)",
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
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="soft-card overflow-hidden divide-y divide-[var(--border)]/70">
            <div className="flex items-center justify-between bg-[var(--muted)]/50 px-5 py-3.5 text-xs">
              <span className="font-bold text-[var(--foreground)]">Lab biomarker</span>
              <span className="font-semibold text-[var(--muted-foreground)]">
                Latest Reading
              </span>
            </div>
            {metrics.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
                No lab biomarker readings recorded yet.
              </div>
            ) : (
              metrics.slice(0, 8).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--muted)]/40"
                >
                  <div>
                    <span className="block text-xs font-bold text-[var(--foreground)] capitalize">
                      {m.metric_type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {formatDate(m.recorded_at)} {m.context ? `· ${m.context}` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {m.value_primary}{m.value_secondary ? `/${m.value_secondary}` : ""} {m.unit}
                    </span>
                    <span className={`text-[10px] font-medium ${m.is_abnormal ? "text-amber-600" : "text-emerald-600"}`}>
                      {m.is_abnormal ? "Attention" : "Normal"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
