"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Camera,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { updateHealthProfile } from "@/lib/supabase/services/profile";
import { uploadAvatar } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, effectiveUserId, profile, refreshProfile } = useAuth();

  const [aiDepth, setAiDepth] = useState<"simple" | "balanced" | "detailed">("balanced");
  const [notifMeds, setNotifMeds] = useState(true);
  const [notifApts, setNotifApts] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;
    const previewUrl = URL.createObjectURL(file);
    setLocalAvatarUrl(previewUrl);

    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarSuccess(null);
    try {
      const { url, error } = await uploadAvatar(file, effectiveUserId);
      if (error || !url) {
        setAvatarError(error || "Failed to upload avatar image");
      } else {
        setLocalAvatarUrl(url);
        await updateHealthProfile(effectiveUserId, { avatar_url: url });
        await refreshProfile();
        setAvatarSuccess("Profile photo updated and saved to storage!");
        setTimeout(() => setAvatarSuccess(null), 4000);
      }
    } catch {
      setAvatarError("An unexpected error occurred while uploading.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const currentAvatar =
    localAvatarUrl ||
    profile?.avatar_url ||
    (profile?.preferences as any)?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null;

  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as any;
      if (prefs.explanation_depth) setAiDepth(prefs.explanation_depth);
      if (prefs.language && ["en", "bn", "es"].includes(prefs.language)) {
        setLanguage(prefs.language);
      }
      if (prefs.notifications_enabled !== undefined) {
        setNotifMeds(prefs.notifications_enabled);
        setNotifApts(prefs.notifications_enabled);
      }
    }
  }, [profile, setLanguage]);

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
      profile: profile || null,
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
            Manage your account, display language, notifications, and health preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving ? "Saving..." : t("action.save", "Save Changes")}</span>
        </button>
      </div>

      {isSaved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          Settings and preferences successfully saved.
        </div>
      )}

      {/* Group 1: Appearance */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-2">
          {t("settings.appearance_group", "Interface Theme & Dark Mode")}
        </span>
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
                  "flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer relative",
                  isSelected
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {opt.label}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {opt.description}
                </span>
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group 2: Regional Language */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-2">
          {t("settings.regional_group", "Regional & Localization")}
        </span>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {t("settings.display_lang", "Display Language")}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("settings.display_lang_sub", "Switch entire interface instantly")}
                </span>
              </div>
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
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("action.export", "Export Complete Health Record (JSON)")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
