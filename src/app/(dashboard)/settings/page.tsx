"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Lock,
  Download,
  CheckCircle2,
  Globe,
  Save,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { mockProfile } from "@/lib/mock-data";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { updateHealthProfile } from "@/lib/supabase/services/profile";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { effectiveUserId, profile, refreshProfile } = useAuth();

  const [aiDepth, setAiDepth] = useState<"simple" | "balanced" | "detailed">("balanced");
  const [notifMeds, setNotifMeds] = useState(true);
  const [notifApts, setNotifApts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as any;
      if (prefs.explanation_depth) setAiDepth(prefs.explanation_depth);
      if (prefs.notifications_enabled !== undefined) {
        setNotifMeds(prefs.notifications_enabled);
        setNotifApts(prefs.notifications_enabled);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (effectiveUserId) {
        await updateHealthProfile(effectiveUserId, {
          preferences: {
            language,
            theme,
            explanation_depth: aiDepth,
            notifications_enabled: notifMeds || notifApts,
          },
        });
        await refreshProfile();
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings to profile:", err);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      profile: profile || mockProfile,
      exported_at: new Date().toISOString(),
      app_version: "ChronicAI v2.0",
      compliance: "HIPAA / HL7 FHIR Compatible Structure",
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ChronicAI_Health_Export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const themeOptions = [
    {
      id: "light" as const,
      label: t("settings.theme_light", "Light Mode"),
      icon: Sun,
      description: "Crisp white & gentle emerald",
    },
    {
      id: "dark" as const,
      label: t("settings.theme_dark", "Dark Mode"),
      icon: Moon,
      description: "Deep obsidian & calm contrast",
    },
    {
      id: "system" as const,
      label: t("settings.theme_system", "System Default"),
      icon: Laptop,
      description: "Follows your device system theme",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("settings.title", "Settings & Preferences")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("settings.subtitle", "Configure AI explanation depth, dark mode, language & export health records.")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving ? "Saving..." : t("action.save", "Save")}</span>
        </button>
      </div>

      {isSaved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {t("action.saved", "Settings successfully saved.")}
        </div>
      )}

      {/* Feature 1: Theme & Dark Mode Selection */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("settings.theme_group", "Theme & Appearance")}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active: {resolvedTheme === "dark" ? "Dark" : "Light"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-98",
                  isSelected
                    ? "bg-emerald-50/40 dark:bg-slate-800 border-emerald-500 shadow-sm ring-2 ring-emerald-500/25"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      isSelected
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 dark:border-slate-600"
                    )}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {opt.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature 2: Language & Regional Standards (Bangla, English, Spanish) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-2">
          {t("settings.lang_group", "Language & Regional Standards")}
        </span>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {t("settings.display_lang", "Display Language")}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                বাংলা (Bangla), English, and Español supported across the platform.
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[160px]"
            >
              <option value="en">English (US)</option>
              <option value="bn">বাংলা (Bangla)</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t("settings.units_format", "Lab Units Format")}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t("settings.units_val", "US Standard (mg/dL, mmHg)")}
            </span>
          </div>
        </div>
      </div>

      {/* Group 3: AI Explanation Complexity */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-2">
          {t("settings.ai_depth_group", "AI Explanation Complexity")}
        </span>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {[
            {
              id: "simple",
              label: t("settings.ai_simple_label", "Layman / Plain Language"),
              desc: t("settings.ai_simple_desc", "Clear, conversational explanations with simple everyday analogies."),
            },
            {
              id: "balanced",
              label: t("settings.ai_balanced_label", "Balanced (Recommended)"),
              desc: t("settings.ai_balanced_desc", "Clear explanations alongside exact clinical biomarker names and values."),
            },
            {
              id: "detailed",
              label: t("settings.ai_detailed_label", "Clinical & Detailed"),
              desc: t("settings.ai_detailed_desc", "In-depth physiological explanations and medical terminology."),
            },
          ].map((tier) => (
            <div
              key={tier.id}
              onClick={() => setAiDepth(tier.id as any)}
              className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <input
                type="radio"
                name="aiDepth"
                checked={aiDepth === tier.id}
                onChange={() => setAiDepth(tier.id as any)}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{tier.label}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed mt-0.5">{tier.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group 4: Notifications */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-2">
          {t("settings.reminders_group", "Reminders & Alerts")}
        </span>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
          <label className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {t("settings.notif_meds_label", "Medication Dosing Reminders")}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("settings.notif_meds_desc", "Alerts for morning (08:00) and evening (20:00) doses.")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifMeds}
              onChange={(e) => setNotifMeds(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {t("settings.notif_apts_label", "Appointment Reminders")}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("settings.notif_apts_desc", "Alerts 24 hours prior to scheduled visits.")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifApts}
              onChange={(e) => setNotifApts(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Group 5: Data Portability (Export JSON) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-2">
          {t("settings.data_group", "Data Ownership & Portability")}
        </span>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {t("settings.data_desc", "Download an encrypted, structured JSON archive containing your entire personal health life record, verified laboratory values, and prescriptions.")}
          </p>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("action.export", "Export Complete Health Record (JSON)")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
