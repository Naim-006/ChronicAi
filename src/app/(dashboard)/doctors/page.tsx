"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  X,
  Loader2,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { Doctor } from "@/types/medical";
import { useAuth } from "@/context/AuthContext";
import { getDoctors, createDoctor } from "@/lib/supabase/services/appointments";
import { useRealtimeTable } from "@/hooks/useRealtime";

export default function DoctorsPage() {
  const { effectiveUserId } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const loadDoctors = React.useCallback(async () => {
    if (!effectiveUserId) {
      setDoctors([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await getDoctors(effectiveUserId);
      setDoctors(data || []);
    } catch {
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Realtime subscription: syncs care team directory live
  useRealtimeTable({
    table: "doctors",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadDoctors();
    },
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty || !effectiveUserId) return;

    setIsSubmitting(true);
    try {
      const newDoc = await createDoctor({
        user_id: effectiveUserId,
        name,
        specialty,
        clinic_name: clinic || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
      });

      setDoctors((prev) => [newDoc, ...prev]);
      setShowAddModal(false);
      setName("");
      setSpecialty("");
      setClinic("");
      setPhone("");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Healthcare Providers
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Your personal directory of {doctors.length} consulting doctors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="soft-card-lift rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[var(--card)] p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold text-[var(--foreground)]">Add Healthcare Provider</span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-[var(--foreground)] block mb-1">Doctor Name *</label>
              <input
                required
                placeholder="e.g. Dr. Catherine Wei, MD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-8 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-xs text-[var(--foreground)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-[var(--foreground)] block mb-1">Specialty *</label>
                <input
                  required
                  placeholder="e.g. Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full h-8 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-xs text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="font-semibold text-[var(--foreground)] block mb-1">Clinic Name</label>
                <input
                  placeholder="e.g. Metabolic Health"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="w-full h-8 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-xs text-[var(--foreground)]"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-[var(--foreground)] block mb-1">Phone</label>
              <input
                placeholder="e.g. +1 (555) 789-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-8 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-xs text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--foreground)] block mb-1">Clinical Context</label>
              <input
                placeholder="e.g. Primary endocrinologist for quarterly diabetes workup."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-8 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-xs text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white cursor-pointer"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped Doctors List */}
      <div className="rounded-2xl bg-white dark:bg-[var(--card)] border border-[var(--border)] shadow-xs divide-y divide-[var(--border)] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Stethoscope className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">No doctors listed</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Add your doctors to keep their contacts and clinical notes organized.
            </p>
          </div>
        ) : (
          doctors.map((doc) => (
            <div key={doc.id} className="p-4 hover:bg-[var(--muted)]/50 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs shrink-0">
                    {doc.name.split(" ").slice(-1)[0][0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--foreground)] block">{doc.name}</span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">{doc.specialty}</span>
                    {doc.clinic_name && (
                      <span className="text-[11px] text-[var(--muted-foreground)] block">{doc.clinic_name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.phone && (
                    <a
                      href={`tel:${doc.phone}`}
                      className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call</span>
                    </a>
                  )}
                  <Link
                    href={`/appointments?docName=${encodeURIComponent(doc.name)}&specialty=${encodeURIComponent(doc.specialty)}&facility=${encodeURIComponent(doc.clinic_name || "")}`}
                    className="flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Schedule Visit</span>
                  </Link>
                </div>
              </div>

              {doc.notes && (
                <p className="text-[11px] text-[var(--muted-foreground)] pl-12 leading-relaxed">
                  {doc.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
