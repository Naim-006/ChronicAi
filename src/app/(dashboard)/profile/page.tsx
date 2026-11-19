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
} from "lucide-react";
import { mockProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockProfile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Identity"
        title="Health Profile"
        description="Emergency card, allergies, and care-team links"
      />

      {/* Profile identity */}
      <section className="soft-card flex items-center gap-3.5 p-4 sm:p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--forest)] text-lg font-extrabold text-white shadow-md">
          EV
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold leading-tight text-[var(--foreground)]">
            {profile.full_name}
          </h2>
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
            DOB: {formatDate(profile.date_of_birth)} (Age 64)
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold text-emerald-700">
            Blood Type: {profile.blood_group} · {profile.height_cm} cm · {profile.weight_kg} kg
          </span>
        </div>
      </section>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Health profile changes successfully updated.
        </div>
      )}

      {/* Emergency card */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Emergency health card
        </span>
        <div className="space-y-2.5 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
            <span className="text-xs font-semibold text-rose-900">Blood group</span>
            <span className="text-sm font-extrabold text-rose-700">{profile.blood_group}</span>
          </div>

          <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
            <div>
              <span className="block text-xs font-bold text-[var(--foreground)]">
                {profile.emergency_contact?.name}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {profile.emergency_contact?.relationship}
              </span>
            </div>
            <a
              href={`tel:${profile.emergency_contact?.phone}`}
              className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
            >
              <Phone className="h-3 w-3" />
              Call
            </a>
          </div>

          <div className="text-[11px] text-rose-800">
            <strong>Critical alert:</strong> Severe Penicillin allergy. Carries MedicAlert identifier.
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Documented drug allergies
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {profile.allergies.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3.5">
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)]">{a.substance}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-rose-700">{a.reaction}</span>
              </div>
              <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                {a.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Active chronic conditions
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {profile.chronic_conditions.map((c) => (
            <div key={c.id} className="space-y-1 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">{c.name}</span>
                <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">
                  ICD: {c.icd10}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">{c.notes}</p>
            </div>
          ))}
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
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)]">
                  Healthcare providers
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Dr. Wei, Dr. Vance, Dr. Jenkins
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
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
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
                  AI depth, units, download JSON
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
