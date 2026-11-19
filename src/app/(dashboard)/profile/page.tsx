"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  CheckCircle2,
  ChevronRight,
  Share2,
  UserCheck,
  Settings,
  ShieldAlert,
  HeartPulse,
  Camera,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { uploadAvatar } from "@/lib/supabase/storage";
import { updateHealthProfile } from "@/lib/supabase/services/profile";

export default function ProfilePage() {
  const { profile, user, effectiveUserId, refreshProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage("Image must be smaller than 5MB.");
      setTimeout(() => setAvatarMessage(null), 4000);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file, effectiveUserId);
      if (res.error) {
        setAvatarMessage(`Upload failed: ${res.error}`);
      } else if (res.url) {
        await updateHealthProfile(effectiveUserId, {
          avatar_url: res.url,
        });
        await refreshProfile();
        setAvatarMessage("Profile picture successfully updated!");
      }
    } catch (err) {
      setAvatarMessage("An unexpected error occurred while uploading avatar.");
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => setAvatarMessage(null), 4000);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const allergies = profile?.allergies || [];
  const conditions = profile?.chronic_conditions || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Identity"
        title="Health Profile"
        description="Emergency card, allergies, and care-team links"
      />

      {/* Profile identity */}
      <section className="soft-card flex items-center gap-4 p-4 sm:p-5">
        <div className="relative group shrink-0">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-[var(--forest)] text-xl font-extrabold text-white shadow-md overflow-hidden border-2 border-[var(--border)]">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "PT"
            )}
          </div>
          <label
            htmlFor="profile-avatar-input"
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
            title="Upload profile picture to storage"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <>
                <Camera className="h-5 w-5 text-white" />
                <span>Upload</span>
              </>
            )}
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </label>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold leading-tight text-[var(--foreground)] truncate">
              {displayName}
            </h2>
          </div>
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)] truncate">
            {profile?.date_of_birth ? `DOB: ${formatDate(profile.date_of_birth)}` : user?.email}
          </span>
          <span className="mt-1 block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            Blood Type: {profile?.blood_group || "Unknown"} · {profile?.height_cm ? `${profile.height_cm} cm` : "Height unrecorded"} · {profile?.weight_kg ? `${profile.weight_kg} kg` : "Weight unrecorded"}
          </span>
        </div>
      </section>

      {avatarMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900/50 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{avatarMessage}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Health profile changes successfully updated.
        </div>
      )}

      {/* Emergency card */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Emergency health card
        </span>
        <div className="space-y-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-900/40 pb-2">
            <span className="text-xs font-semibold text-rose-900 dark:text-rose-200">Blood group</span>
            <span className="text-sm font-extrabold text-rose-700 dark:text-rose-400">
              {profile?.blood_group || "Not recorded"}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-900/40 pb-2">
            <div>
              <span className="block text-xs font-bold text-[var(--foreground)]">
                {profile?.emergency_contact?.name || "No emergency contact specified"}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {profile?.emergency_contact?.relationship || "Add contact in settings"}
              </span>
            </div>
            {profile?.emergency_contact?.phone && (
              <a
                href={`tel:${profile.emergency_contact.phone}`}
                className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            )}
          </div>

          <div className="text-[11px] text-rose-800 dark:text-rose-300">
            <strong>Critical status:</strong> {allergies.length > 0 ? `${allergies.length} documented drug sensitivities on file.` : "No critical medication contraindications on file."}
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Documented drug allergies
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {allergies.length === 0 ? (
            <div className="p-5 text-center text-xs text-[var(--muted-foreground)]">
              No documented allergies recorded.
            </div>
          ) : (
            allergies.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3.5">
                <div>
                  <span className="block text-xs font-bold text-[var(--foreground)]">{a.substance}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-rose-700 dark:text-rose-400">{a.reaction}</span>
                </div>
                <span className="rounded-full border border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  {a.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conditions */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Active chronic conditions
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {conditions.length === 0 ? (
            <div className="p-5 text-center text-xs text-[var(--muted-foreground)]">
              No active chronic conditions recorded.
            </div>
          ) : (
            conditions.map((c) => (
              <div key={c.id} className="space-y-1 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)]">{c.name}</span>
                  {c.icd10 && (
                    <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">
                      ICD: {c.icd10}
                    </span>
                  )}
                </div>
                {c.notes && (
                  <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">{c.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Navigation */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Care team &amp; clinical sharing
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          <Link
            href="/doctors"
            className="flex items-center justify-between p-3.5 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)]">
                  Healthcare providers
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Consulting doctors directory &amp; phone contacts
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>

          <Link
            href="/summaries"
            className="flex items-center justify-between p-3.5 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)]">
                  Printable clinical summary
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Export for appointments &amp; share links
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between p-3.5 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)]">
                  Preferences &amp; data export
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Language, Dark mode, AI depth &amp; session security
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
