"use client";

import React, { useState } from "react";
import {
  Settings,
  Bell,
  Lock,
  Download,
  Trash2,
  Sparkles,
  CheckCircle2,
  Globe,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockProfile } from "@/lib/mock-data";

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [aiDepth, setAiDepth] = useState<"simple" | "balanced" | "detailed">("balanced");
  const [notifMeds, setNotifMeds] = useState(true);
  const [notifApts, setNotifApts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mockProfile, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Universal_Medical_AI_Export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Privacy Preferences"
        description="Configure your personal health preferences, AI explanation depth, notifications, and export your complete health data."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Settings" }]}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Save className="h-3.5 w-3.5" />
            Save Preferences
          </Button>
        }
      />

      {isSaved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Settings successfully saved.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI & Health Preferences */}
        <div className="space-y-6">
          {/* AI Explanation Customization */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-700" />
                AI Explanation Complexity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <p className="text-slate-600 text-xs leading-relaxed">
                Choose how the Medical AI synthesizes lab results and medical documents.
              </p>

              <div className="space-y-2">
                {[
                  { id: "simple", label: "Layman / Plain Language", desc: "Clear, jargon-free explanations with simple analogies." },
                  { id: "balanced", label: "Balanced (Recommended)", desc: "Clear explanations alongside exact clinical biomarker names and values." },
                  { id: "detailed", label: "Clinical & Detailed", desc: "In-depth pathophysiological descriptions with medical terminology." },
                ].map((tier) => (
                  <label
                    key={tier.id}
                    onClick={() => setAiDepth(tier.id as any)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      aiDepth === tier.id ? "border-teal-600 bg-teal-50/50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiDepth"
                      checked={aiDepth === tier.id}
                      onChange={() => setAiDepth(tier.id as any)}
                      className="mt-0.5 text-teal-700 focus:ring-teal-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{tier.label}</span>
                      <span className="text-[11px] text-slate-500 block">{tier.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language & Regional Settings */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-teal-700" />
                Language & Regional Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-slate-200 p-2 text-xs"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Standard Laboratory Units</label>
                <select className="w-full rounded-md border border-slate-200 p-2 text-xs">
                  <option value="us">US Standard (mg/dL for glucose, mmHg for BP)</option>
                  <option value="si">SI Units (mmol/L for glucose, kPa for BP)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Notifications & Data Portability */}
        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-700" />
                Notification Channels & Schedules
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Medication Dosing Reminders</span>
                  <span className="text-[11px] text-slate-500">Scheduled reminders for morning and evening doses.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifMeds}
                  onChange={(e) => setNotifMeds(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-700 focus:ring-teal-600"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Doctor Visit & Follow-Up Alerts</span>
                  <span className="text-[11px] text-slate-500">Alerts 24 hours and 2 hours prior to scheduled consultations.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifApts}
                  onChange={(e) => setNotifApts(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-700 focus:ring-teal-600"
                />
              </label>
            </CardContent>
          </Card>

          {/* Data Portability (HIPAA / GDPR) */}
          <Card className="border-slate-300">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-teal-700" />
                Data Portability & Export
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                You have absolute ownership of your healthcare data. You can download a structured copy of your entire health profile, documents, and measurements at any time.
              </p>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportData}
                className="text-xs h-8 gap-1.5 w-full border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export Complete Medical Life Record (JSON)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
