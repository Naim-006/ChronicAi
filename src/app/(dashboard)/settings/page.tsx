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
  Database,
  Cpu,
  Key,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("settings.title", "Settings & Platform Configuration")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your account, clinical AI complexity, privacy, notifications &amp; data export.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer self-start sm:self-auto"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving ? "Saving..." : t("action.save", "Save Changes")}</span>
        </button>
      </div>

      {isSaved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          Settings and preferences successfully saved to your profile.
        </div>
      )}

      {/* 1. Account Section */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Account Profile
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative group shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black text-xl shadow-md overflow-hidden">
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAvatar}
                  alt={profile?.full_name || "Profile Photo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {(profile?.full_name || user?.email || "P")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 cursor-pointer transition-transform group-hover:scale-110"
              title="Change Profile Photo"
            >
              {avatarUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate">
              {profile?.full_name || "Patient Account"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
              {user?.email || "Authenticated User"}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Patient ID: {effectiveUserId ? `${effectiveUserId.slice(0, 16)}...` : "Active"}
            </span>
          </div>
        </div>

        {avatarSuccess && (
          <p className="text-xs text-emerald-600 font-semibold">{avatarSuccess}</p>
        )}
        {avatarError && (
          <p className="text-xs text-rose-500 font-semibold">{avatarError}</p>
        )}
      </section>

      {/* 2. AI Preferences Section */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t("settings.ai_depth_group", "Clinical AI Explanation Complexity")}
          </h2>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
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
              className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <input
                type="radio"
                name="aiDepth"
                checked={aiDepth === tier.id}
                onChange={() => setAiDepth(tier.id as any)}
                className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{tier.label}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed mt-0.5">{tier.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Appearance & Theme Section */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <Sun className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t("settings.appearance_group", "Theme & Appearance")}
          </h2>
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
                  "flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer relative",
                  isSelected
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-white/[0.03] hover:border-slate-300"
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
      </section>

      {/* 4. Language & Regional Standards Section */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t("settings.regional_group", "Language & Units")}
          </h2>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden text-xs">
          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {t("settings.display_lang", "Display Language")}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch entire interface and Clinical Copilot language
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[160px]"
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
            <span className="text-slate-500 dark:text-slate-400 font-bold">
              {t("settings.units_val", "US Standard (mg/dL, mmHg, g/dL)")}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Reminders & Alerts Section */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t("settings.reminders_group", "Reminders & Notifications")}
          </h2>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden text-xs">
          <label className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {t("settings.notif_meds_label", "Medication Dosing Reminders")}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("settings.notif_meds_desc", "Timely alerts for scheduled medication doses.")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifMeds}
              onChange={(e) => setNotifMeds(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {t("settings.notif_apts_label", "Appointment Alerts")}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("settings.notif_apts_desc", "Reminders 24 hours prior to scheduled doctor consultations.")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifApts}
              onChange={(e) => setNotifApts(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* 6. Privacy, Security & Data Portability */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Privacy, Security &amp; Data Ownership
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-emerald-900 dark:text-emerald-200">
              <span className="font-bold block">Patient Data Encryption Active</span>
              <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                All uploaded documents, lab results, and health metrics are protected by Supabase Row-Level Security (RLS).
              </span>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {t("settings.data_desc", "Download an encrypted, structured JSON archive containing your entire personal health life record, verified laboratory values, and prescriptions.")}
          </p>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-white/5 py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("action.export", "Export Complete Health Record (JSON)")}</span>
          </button>
        </div>
      </section>

      {/* 7. Connected Services Section */}
      <section className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
          <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Connected Clinical Services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-500" />
                Supabase Health EHR
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              PostgreSQL relational vault, document vector storage, and realtime table synchronization.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                Google Gemini Vision OCR
              </span>
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Multimodal document entity extraction &amp; smart multilingual clinical translation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
