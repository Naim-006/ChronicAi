"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SPECIALTIES = [
  "General Medicine / Internal Medicine",
  "Endocrinology & Diabetology",
  "Cardiology",
  "Nephrology",
  "Pulmonology",
  "Neurology",
  "Gastroenterology",
  "General Practice / Family Medicine",
  "Other Specialty",
];

export default function DoctorRegisterPage() {
  const router = useRouter();
  const { user, profile, isDoctor, isPendingDoctor, refreshDoctorProfile } = useAuth();

  const [fullName, setFullName] = useState(
    profile?.full_name ? `Dr. ${profile.full_name.replace(/^Dr\.\s*/i, "")}` : "Dr. "
  );
  const [bmdcNumber, setBmdcNumber] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [qualifications, setQualifications] = useState("MBBS");
  const [clinicName, setClinicName] = useState("");
  const [visitingHours, setVisitingHours] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already registered or verified
  if (isDoctor) {
    router.push("/doctor/dashboard");
    return null;
  }
  if (isPendingDoctor) {
    router.push("/doctor/pending");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user?.id) {
      setError("Please sign in first before registering as a doctor.");
      return;
    }

    if (!bmdcNumber.trim()) {
      setError("BMDC registration number is required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/doctor/profile/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          fullName: fullName.trim(),
          bmdcNumber: bmdcNumber.trim().toUpperCase(),
          specialty,
          qualifications: qualifications.trim(),
          chamberInfo: {
            clinic_name: clinicName.trim() || undefined,
            visiting_hours: visitingHours.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to register doctor profile");
      }

      await refreshDoctorProfile();
      router.push("/doctor/pending");
    } catch (err: any) {
      setError(err?.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient Portal
        </Link>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ChronicAI Clinical
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Doctor Registration
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your clinical credentials to activate Doctor Portal capabilities.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Full Name (with Title)
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Full Name"
              required
              className="rounded-xl h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                BMDC Registration Number
              </label>
              <Input
                value={bmdcNumber}
                onChange={(e) => setBmdcNumber(e.target.value)}
                placeholder="e.g. A-12345"
                required
                className="rounded-xl h-10 uppercase"
              />
              <span className="text-[10px] text-slate-400">
                Bangladesh Medical & Dental Council Registration
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Primary Specialty
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s} className="dark:bg-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Qualifications & Degrees
            </label>
            <Input
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="e.g. MBBS, FCPS (Medicine), MD (Endocrinology)"
              className="rounded-xl h-10"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chamber / Practice Details (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Hospital or Clinic Name
                </label>
                <Input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Popular Diagnostic Center, Dhanmondi"
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Visiting Hours
                </label>
                <Input
                  value={visitingHours}
                  onChange={(e) => setVisitingHours(e.target.value)}
                  placeholder="e.g. 5:00 PM - 9:00 PM (Sat - Thu)"
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Chamber Phone / Appointment Serial Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +8801700000000"
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-xs font-bold shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Credentials...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Submit for BMDC Verification
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
