"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserRound,
  ShieldAlert,
  AlertTriangle,
  Phone,
  Heart,
  Save,
  CheckCircle2,
  Calendar,
  Activity,
  ChevronRight,
  Share2,
  UserCheck,
  Settings,
} from "lucide-react";
import { mockProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockProfile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header (Apple Health Style) */}
      <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-800 text-white font-extrabold text-lg shrink-0 shadow-xs">
          EV
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-slate-900 leading-tight">
            {profile.full_name}
          </h1>
          <span className="text-xs text-slate-500 block mt-0.5">
            DOB: {formatDate(profile.date_of_birth)} (Age 64)
          </span>
          <span className="text-[11px] font-semibold text-teal-800 block mt-0.5">
            Blood Type: {profile.blood_group} • {profile.height_cm} cm • {profile.weight_kg} kg
          </span>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Health profile changes successfully updated.
        </div>
      )}

      {/* Emergency Identification Card */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Emergency Health Card
        </span>
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
            <span className="text-xs text-red-900 font-semibold">Blood Group</span>
            <span className="text-sm font-extrabold text-red-700">{profile.blood_group}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
            <div>
              <span className="text-xs text-slate-700 font-bold block">{profile.emergency_contact?.name}</span>
              <span className="text-[11px] text-slate-500">{profile.emergency_contact?.relationship}</span>
            </div>
            <a
              href={`tel:${profile.emergency_contact?.phone}`}
              className="flex items-center gap-1.5 rounded-full bg-red-700 text-white px-3 py-1 text-xs font-semibold hover:bg-red-800"
            >
              <Phone className="h-3 w-3" />
              Call
            </a>
          </div>

          <div className="text-[11px] text-red-800">
            <strong>Critical Alert:</strong> Severe Penicillin allergy. Carries MedicAlert identifier.
          </div>
        </div>
      </div>

      {/* Confirmed Allergies (Grouped List) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Documented Drug Allergies
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {profile.allergies.map((a) => (
            <div key={a.id} className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">{a.substance}</span>
                <span className="text-[11px] text-red-700 font-semibold mt-0.5 block">{a.reaction}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {a.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chronic Health Conditions (Grouped List) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Active Chronic Conditions
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {profile.chronic_conditions.map((c) => (
            <div key={c.id} className="p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{c.name}</span>
                <span className="text-[10px] font-semibold text-slate-400">ICD: {c.icd10}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {c.notes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sections (Settings style) */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Care Team & Clinical Sharing
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <Link
            href="/doctors"
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Healthcare Providers</span>
                <span className="text-[11px] text-slate-400">Dr. Wei, Dr. Vance, Dr. Jenkins</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>

          <Link
            href="/summaries"
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Printable Clinical Summary</span>
                <span className="text-[11px] text-slate-400">Export for doctor appointments & share links</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Preferences & Data Export</span>
                <span className="text-[11px] text-slate-400">AI explanation depth, units, download JSON</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
