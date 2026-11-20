"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Plus,
  Trash2,
  Edit2,
  Save,
  Activity,
  AlertTriangle,
  Scale,
  Ruler,
  Droplet,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { uploadAvatar } from "@/lib/supabase/storage";
import { updateHealthProfile } from "@/lib/supabase/services/profile";
import { Allergy, BloodGroup, Sex } from "@/types/medical";

export default function ProfilePage() {
  const { profile, user, effectiveUserId, refreshProfile } = useAuth();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  // Vitals State
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "Unknown">("Unknown");
  const [sex, setSex] = useState<Sex | "">("");

  // Emergency Contact State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRel, setContactRel] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Allergy Modal State
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [isSavingAllergy, setIsSavingAllergy] = useState(false);
  const [allergySubstance, setAllergySubstance] = useState("");
  const [allergyReaction, setAllergyReaction] = useState("");
  const [allergySeverity, setAllergySeverity] = useState<"mild" | "moderate" | "severe">("moderate");

  // Synchronize initial state from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDateOfBirth(profile.date_of_birth || "");
      setHeightCm(profile.height_cm ?? "");
      setWeightKg(profile.weight_kg ?? "");
      setBloodGroup(profile.blood_group || "Unknown");
      setSex(profile.sex || "");
      setContactName(profile.emergency_contact?.name || "");
      setContactRel(profile.emergency_contact?.relationship || "");
      setContactPhone(profile.emergency_contact?.phone || "");
    }
  }, [profile]);

  // Compute live Age from DOB
  const computedAge = useMemo(() => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dateOfBirth]);

  // Height and Weight imperial approximations
  const heightInFeet = useMemo(() => {
    if (typeof heightCm !== "number" || heightCm <= 0) return "";
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
  }, [heightCm]);

  const weightInLbs = useMemo(() => {
    if (typeof weightKg !== "number" || weightKg <= 0) return "";
    return `${(weightKg * 2.20462).toFixed(1)} lbs`;
  }, [weightKg]);

  // Compute live BMI
  const computedBmi =
    typeof heightCm === "number" &&
    heightCm > 0 &&
    typeof weightKg === "number" &&
    weightKg > 0
      ? (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)
      : null;

  const getBmiBadge = (bmiVal: number) => {
    if (bmiVal < 18.5) {
      return { label: "Underweight", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" };
    }
    if (bmiVal < 25) {
      return { label: "Optimal BMI", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" };
    }
    if (bmiVal < 30) {
      return { label: "Overweight", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" };
    }
    return { label: "Class I+ Obesity", color: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" };
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Avatar file size must be less than 5MB.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalAvatarUrl(previewUrl);
    setIsUploadingAvatar(true);

    try {
      const res = await uploadAvatar(file, effectiveUserId);
      if (res.error) {
        setErrorMessage(`Upload failed: ${res.error}`);
      } else if (res.url) {
        setLocalAvatarUrl(res.url);
        await updateHealthProfile(effectiveUserId, {
          avatar_url: res.url,
        });
        await refreshProfile();
        setSavedMessage("Profile photo uploaded and saved successfully.");
      }
    } catch {
      setErrorMessage("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => {
        setSavedMessage(null);
        setErrorMessage(null);
      }, 4000);
    }
  };

  const handleSaveVitals = async () => {
    if (!effectiveUserId) return;
    setIsSavingVitals(true);
    try {
      await updateHealthProfile(effectiveUserId, {
        full_name: fullName.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        height_cm: heightCm === "" ? undefined : Number(heightCm),
        weight_kg: weightKg === "" ? undefined : Number(weightKg),
        blood_group: bloodGroup as BloodGroup,
        sex: (sex as Sex) || undefined,
      });
      await refreshProfile();
      setIsEditingVitals(false);
      setSavedMessage("Demographic details, metrics, and blood type saved successfully.");
      setTimeout(() => setSavedMessage(null), 3500);
    } catch {
      setErrorMessage("Could not save profile details. Please check connection.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSavingVitals(false);
    }
  };

  const handleSaveEmergencyContact = async () => {
    if (!effectiveUserId) return;
    setIsSavingContact(true);
    try {
      await updateHealthProfile(effectiveUserId, {
        emergency_contact: {
          name: contactName.trim(),
          relationship: contactRel.trim(),
          phone: contactPhone.trim(),
        },
      });
      await refreshProfile();
      setIsEditingContact(false);
      setSavedMessage("Emergency contact successfully updated.");
      setTimeout(() => setSavedMessage(null), 3500);
    } catch {
      setErrorMessage("Failed to update emergency contact.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId || !allergySubstance.trim()) return;

    setIsSavingAllergy(true);
    try {
      const currentAllergies: Allergy[] = profile?.allergies || [];
      const newAllergy: Allergy = {
        id: `all-${Date.now()}`,
        substance: allergySubstance.trim(),
        reaction: allergyReaction.trim() || "Unspecified reaction",
        severity: allergySeverity,
        diagnosed_date: new Date().toISOString().split("T")[0],
      };

      const updated = [...currentAllergies, newAllergy];
      await updateHealthProfile(effectiveUserId, { allergies: updated });
      await refreshProfile();

      setShowAllergyModal(false);
      setAllergySubstance("");
      setAllergyReaction("");
      setAllergySeverity("moderate");
      setSavedMessage(`Added allergy: ${newAllergy.substance}`);
      setTimeout(() => setSavedMessage(null), 3500);
    } catch {
      setErrorMessage("Could not record allergy.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSavingAllergy(false);
    }
  };

  const handleDeleteAllergy = async (allergyId: string) => {
    if (!effectiveUserId) return;
    try {
      const currentAllergies: Allergy[] = profile?.allergies || [];
      const updated = currentAllergies.filter((a) => a.id !== allergyId);
      await updateHealthProfile(effectiveUserId, { allergies: updated });
      await refreshProfile();
      setSavedMessage("Allergy record removed.");
      setTimeout(() => setSavedMessage(null), 3000);
    } catch {
      setErrorMessage("Failed to delete allergy.");
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentAvatar =
    localAvatarUrl ||
    profile?.avatar_url ||
    (profile?.preferences as any)?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null;

  const allergies: Allergy[] = profile?.allergies || [];
  const rawConditions = (profile?.chronic_conditions as any[]) || [];
  const conditions = rawConditions.map((c, i) =>
    typeof c === "string"
      ? { id: `cond-${i}`, name: c, status: "active", diagnosed_date: "Prior history" }
      : c
  );

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        eyebrow="Clinical Identity"
        title="Health Profile & Vitals"
        description="Patient biometric profile, emergency card, drug contraindications, and clinical care links."
      />

      {/* Notifications */}
      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900/50 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/50 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Profile Identity */}
      <section className="soft-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-[var(--forest)] text-xl font-extrabold text-white shadow-md overflow-hidden border-2 border-[var(--border)]">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
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
              title="Upload profile photo"
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

          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)] truncate">
              {displayName}
            </h2>
            <div className="mt-0.5 text-xs text-[var(--muted-foreground)] flex items-center gap-2 flex-wrap">
              <span>{user?.email}</span>
              {computedAge !== null && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {computedAge} years old
                  </span>
                </>
              )}
              {profile?.sex && (
                <>
                  <span>•</span>
                  <span className="capitalize">{profile.sex}</span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                <Droplet className="h-3 w-3 text-rose-500" />
                Blood: {profile?.blood_group || "Unknown"}
              </span>
              {dateOfBirth && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--foreground)]">
                  <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  DOB: {dateOfBirth} {computedAge !== null ? `(${computedAge} yrs)` : ""}
                </span>
              )}
              {computedBmi && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getBmiBadge(Number(computedBmi)).color}`}>
                  <Activity className="h-3 w-3" />
                  BMI: {computedBmi} ({getBmiBadge(Number(computedBmi)).label})
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          className="self-end sm:self-center flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </section>

      {/* Demographics, Physical Measurements & Vitals */}
      <section className="soft-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-extrabold text-[var(--foreground)]">
              Demographics &amp; Physical Vitals
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isEditingVitals) {
                // Cancel
                setFullName(profile?.full_name || "");
                setDateOfBirth(profile?.date_of_birth || "");
                setHeightCm(profile?.height_cm ?? "");
                setWeightKg(profile?.weight_kg ?? "");
                setBloodGroup(profile?.blood_group || "Unknown");
                setSex(profile?.sex || "");
                setIsEditingVitals(false);
              } else {
                setIsEditingVitals(true);
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            {isEditingVitals ? "Cancel" : <><Edit2 className="h-3.5 w-3.5" /> Edit Vitals &amp; Bio</>}
          </button>
        </div>

        {isEditingVitals ? (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Date of Birth
                  </label>
                  {computedAge !== null && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      {computedAge} yrs old
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Biological Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as Sex)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Height (cm)
                  </label>
                  {heightInFeet && (
                    <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">
                      ≈ {heightInFeet}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 175"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-[var(--muted-foreground)]">cm</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Weight (kg)
                  </label>
                  {weightInLbs && (
                    <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">
                      ≈ {weightInLbs}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 72.5"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-[var(--muted-foreground)]">kg</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--muted-foreground)]">
                {computedBmi ? (
                  <span>
                    Calculated BMI: <strong className="text-[var(--foreground)]">{computedBmi} kg/m²</strong> ({getBmiBadge(Number(computedBmi)).label})
                  </span>
                ) : (
                  <span>Enter height and weight to calculate BMI.</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveVitals}
                disabled={isSavingVitals}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSavingVitals ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Demographics &amp; Vitals
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Full Name</span>
              <span className="mt-1 block text-sm font-extrabold text-[var(--foreground)] truncate">
                {profile?.full_name || displayName}
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Age &amp; DOB</span>
              <span className="mt-1 block text-sm font-extrabold text-[var(--foreground)]">
                {computedAge !== null ? `${computedAge} yrs` : "—"}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] block truncate">
                {profile?.date_of_birth || "DOB not set"}
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Sex</span>
              <span className="mt-1 block text-sm font-extrabold text-[var(--foreground)] capitalize">
                {profile?.sex || "Unspecified"}
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Blood Group</span>
              <span className="mt-1 block text-sm font-extrabold text-rose-600 dark:text-rose-400">
                {profile?.blood_group || "Unknown"}
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Height</span>
              <span className="mt-1 block text-sm font-extrabold text-[var(--foreground)]">
                {profile?.height_cm ? `${profile.height_cm} cm` : "—"}
              </span>
              {heightInFeet && (
                <span className="text-[10px] text-[var(--muted-foreground)] block">
                  {heightInFeet}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Weight &amp; BMI</span>
              <span className="mt-1 block text-sm font-extrabold text-[var(--foreground)]">
                {profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}
              </span>
              {computedBmi && (
                <span className={`text-[10px] font-bold block ${getBmiBadge(Number(computedBmi)).color.split(" ")[0]}`}>
                  BMI: {computedBmi}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">BMI</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-[var(--foreground)]">
                  {computedBmi || "—"}
                </span>
                {computedBmi && (
                  <span className={`text-[10px] font-bold ${getBmiBadge(Number(computedBmi)).color.split(" ")[0]}`}>
                    {getBmiBadge(Number(computedBmi)).label}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Blood Group</span>
              <span className="mt-1 block text-base font-extrabold text-rose-600 dark:text-rose-400">
                {profile?.blood_group || "Unknown"}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Emergency Card & ICE Contact */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Emergency Medical Health Card
          </span>
          <button
            type="button"
            onClick={() => setIsEditingContact(!isEditingContact)}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            {isEditingContact ? "Cancel" : <><Edit2 className="h-3 w-3" /> Edit Contact</>}
          </button>
        </div>

        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 sm:p-5 shadow-sm space-y-3">
          {isEditingContact ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-rose-900 dark:text-rose-300 uppercase mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-900 dark:text-rose-300 uppercase mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={contactRel}
                    onChange={(e) => setContactRel(e.target.value)}
                    placeholder="e.g. Spouse / Sister"
                    className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-900 dark:text-rose-300 uppercase mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveEmergencyContact}
                  disabled={isSavingContact}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {isSavingContact ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Contact
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/60 dark:border-rose-900/40 pb-3">
              <div>
                <span className="block text-xs font-extrabold text-[var(--foreground)]">
                  {profile?.emergency_contact?.name || "No emergency contact specified"}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {profile?.emergency_contact?.relationship
                    ? `Relationship: ${profile.emergency_contact.relationship}`
                    : "No relationship details saved"}
                </span>
                {profile?.emergency_contact?.phone && (
                  <span className="block mt-0.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                    {profile.emergency_contact.phone}
                  </span>
                )}
              </div>

              {profile?.emergency_contact?.phone && (
                <a
                  href={`tel:${profile.emergency_contact.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 shadow-sm shrink-0"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Emergency Contact
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-rose-900 dark:text-rose-300">
            <span>
              <strong>Allergy Alerts:</strong>{" "}
              {allergies.length > 0
                ? `${allergies.length} documented drug sensitivities on file.`
                : "No severe contraindications recorded."}
            </span>
            <span className="font-bold">Blood: {profile?.blood_group || "Unknown"}</span>
          </div>
        </div>
      </section>

      {/* Allergies & Drug Sensitivities */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Documented Drug &amp; Substance Allergies
          </span>
          <button
            type="button"
            onClick={() => setShowAllergyModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Allergy
          </button>
        </div>

        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {allergies.length === 0 ? (
            <div className="p-5 text-center text-xs text-[var(--muted-foreground)]">
              No documented drug allergies recorded. Click &quot;Add Allergy&quot; above to document medication contraindications.
            </div>
          ) : (
            allergies.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3.5">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--foreground)]">{a.substance}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                        a.severity === "severe"
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                          : a.severity === "moderate"
                          ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <span className="mt-0.5 block text-[11px] text-rose-700 dark:text-rose-400">
                    Reaction: {a.reaction}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAllergy(a.id)}
                  title="Remove allergy record"
                  className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Chronic Conditions (Linked to Chronic Care Manager) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Chronic Conditions ({conditions.length})
          </span>
          <Link
            href="/chronic-care"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Manage Conditions
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {conditions.length === 0 ? (
            <div className="p-5 text-center text-xs text-[var(--muted-foreground)]">
              No chronic conditions recorded. Go to{" "}
              <Link href="/chronic-care" className="font-bold text-emerald-600 underline">
                Chronic Care
              </Link>{" "}
              to add diabetes, hypertension, CKD, or other diagnoses.
            </div>
          ) : (
            conditions.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3.5">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--foreground)]">{c.name}</span>
                    {c.icd10 && (
                      <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--muted-foreground)]">
                        {c.icd10}
                      </span>
                    )}
                  </div>
                  {c.notes && (
                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] truncate">{c.notes}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize shrink-0 ${
                    c.status === "active"
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      : c.status === "managed"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {c.status || "active"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Clinical Links & Sharing */}
      <section className="space-y-2">
        <span className="block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Clinical Care &amp; Sharing
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          <Link
            href="/screenings"
            className="flex items-center justify-between p-3.5 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)]">
                  Clinical Risk Screenings
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  ASCVD 10-Yr, ADA Diabetes, and KDIGO Renal risk calculators
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>

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
                  Healthcare Providers
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Consulting physician directory and contact info
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
                  Printable Clinical Summary
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Export structured health summary for doctor visits
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>
        </div>
      </section>

      {/* Add Allergy Modal */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-[var(--foreground)]">
                  Add Drug or Allergen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllergyModal(false)}
                className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddAllergy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                  Substance / Medication Name *
                </label>
                <input
                  type="text"
                  required
                  value={allergySubstance}
                  onChange={(e) => setAllergySubstance(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa, Ibuprofen, Peanuts"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["Penicillin", "Sulfa drugs", "Aspirin / NSAIDs", "Iodine contrast", "Latex", "Peanuts"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAllergySubstance(preset)}
                      className="rounded-lg bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                  Adverse Reaction / Symptoms
                </label>
                <input
                  type="text"
                  value={allergyReaction}
                  onChange={(e) => setAllergyReaction(e.target.value)}
                  placeholder="e.g. Anaphylaxis, Hives, Facial swelling, Wheezing"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                  Clinical Severity Level
                </label>
                <select
                  value={allergySeverity}
                  onChange={(e) => setAllergySeverity(e.target.value as "mild" | "moderate" | "severe")}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-emerald-600 focus:outline-none"
                >
                  <option value="mild">Mild (Localized rash, mild itching)</option>
                  <option value="moderate">Moderate (Widespread hives, swelling, gastrointestinal)</option>
                  <option value="severe">Severe / Life-Threatening (Anaphylaxis, airway compromise)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAllergyModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAllergy || !allergySubstance.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSavingAllergy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Save to Allergy Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
