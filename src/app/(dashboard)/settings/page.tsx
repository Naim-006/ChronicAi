"use client";

import React, { useState } from "react";
import {
  Settings,
  Bell,
  Lock,
  Download,
  CheckCircle2,
  Globe,
  Save,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { mockProfile } from "@/lib/mock-data";

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [aiDepth, setAiDepth] = useState<"simple" | "balanced" | "detailed">("balanced");
  const [notifMeds, setNotifMeds] = useState(true);
  const [notifApts, setNotifApts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure AI explanation depth, notifications & export health records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>
      </div>

      {isSaved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Settings successfully saved.
        </div>
      )}

      {/* Group 1: AI Explanation Complexity */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          AI Explanation Complexity
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {[
            { id: "simple", label: "Layman / Plain Language", desc: "Clear, conversational explanations with simple analogies." },
            { id: "balanced", label: "Balanced (Recommended)", desc: "Clear explanations alongside exact clinical biomarker names and values." },
            { id: "detailed", label: "Clinical & Detailed", desc: "In-depth physiological explanations and terminology." },
          ].map((tier) => (
            <div
              key={tier.id}
              onClick={() => setAiDepth(tier.id as any)}
              className="p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <input
                type="radio"
                name="aiDepth"
                checked={aiDepth === tier.id}
                onChange={() => setAiDepth(tier.id as any)}
                className="mt-1 text-teal-800 focus:ring-teal-700"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block">{tier.label}</span>
                <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">{tier.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group 2: Regional & Laboratory Standards */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Language & Units
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
          <div className="p-3.5 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Display Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Lab Units Format</span>
            <span className="text-slate-500 font-medium">US Standard (mg/dL, mmHg)</span>
          </div>
        </div>
      </div>

      {/* Group 3: Notifications */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Reminders & Alerts
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
          <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50">
            <div>
              <span className="font-bold text-slate-900 block">Medication Dosing Reminders</span>
              <span className="text-[11px] text-slate-500">Alerts for morning (08:00) and evening (20:00) doses.</span>
            </div>
            <input
              type="checkbox"
              checked={notifMeds}
              onChange={(e) => setNotifMeds(e.target.checked)}
              className="h-4 w-4 rounded text-teal-800 focus:ring-teal-700"
            />
          </label>

          <label className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50">
            <div>
              <span className="font-bold text-slate-900 block">Appointment Reminders</span>
              <span className="text-[11px] text-slate-500">Alerts 24 hours prior to scheduled visits.</span>
            </div>
            <input
              type="checkbox"
              checked={notifApts}
              onChange={(e) => setNotifApts(e.target.checked)}
              className="h-4 w-4 rounded text-teal-800 focus:ring-teal-700"
            />
          </label>
        </div>
      </div>

      {/* Group 4: Data Portability (Export JSON) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Data Ownership & Portability
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-4 space-y-2 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Download an encrypted, structured JSON archive containing your entire personal health life record, verified laboratory values, and prescriptions.
          </p>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-teal-800" />
            <span>Export Complete Health Record (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
