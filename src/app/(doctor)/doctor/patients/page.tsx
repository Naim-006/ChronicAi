"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FolderHeart,
  Search,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  Calendar,
  Activity,
  Droplet,
  User,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getAuthorizedPatients,
  AuthorizedPatientRecord,
} from "@/lib/supabase/services/queue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestAccessModal } from "@/components/doctor/RequestAccessModal";

export default function DoctorPatientsPage() {
  const { doctorProfile } = useAuth();
  const [patients, setPatients] = useState<AuthorizedPatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const doctorId = doctorProfile?.id || "";

  const fetchPatients = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const data = await getAuthorizedPatients(doctorId, searchQuery);
      setPatients(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId, searchQuery]);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Patient Directory & Pre-Visit Briefs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Patients who have granted you active consent. Access real-time longitudinal records and AI briefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
          >
            <KeyRound className="h-3.5 w-3.5 mr-1" />
            Request Patient Access
          </Button>
        </div>
      </div>

      {/* Keyboard-First Search Input */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={searchInputRef}
          placeholder="Search by Patient Code (e.g. CA-XXXX-XXXX) or name... (Press '/' to focus)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-14 h-11 rounded-2xl bg-white/90 dark:bg-card/90 shadow-xs border-slate-200/80 dark:border-white/[0.08]"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            /
          </kbd>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 p-8 backdrop-blur-md">
          <EmptyState
            icon={FolderHeart}
            title={
              searchQuery ? "No Authorized Patients Match Query" : "No Authorized Patients Yet"
            }
            description={
              searchQuery
                ? `No patient records found matching "${searchQuery}". Enter a patient code to send an access request.`
                : "Doctors only see clinical data for patients who have approved an access request. Enter a permanent patient code to request access."
            }
            actionLabel="Request Access by Patient Code"
            onAction={() => setIsModalOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient) => {
            const expDate = new Date(patient.grant_expires_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const initials = patient.patient_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={patient.patient_id}
                className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 p-5 backdrop-blur-md shadow-xs hover:border-emerald-300 dark:hover:border-emerald-600/40 transition-all space-y-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-xs overflow-hidden">
                      {patient.avatar_url ? (
                        <img
                          src={patient.avatar_url}
                          alt={patient.patient_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials || "PT"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {patient.patient_name}
                        </h3>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-300/40">
                          <ShieldCheck className="h-3 w-3" />
                          Authorized
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-400 block mt-0.5">
                        {patient.patient_code}
                      </span>
                    </div>
                  </div>

                  <Link href={`/doctor/patients/${patient.patient_id}`}>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-bold"
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1" />
                      Pre-Visit Brief
                    </Button>
                  </Link>
                </div>

                {/* Patient Vitals Summary */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {patient.blood_group && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                      <Droplet className="h-3 w-3 text-rose-500" />
                      Blood: {patient.blood_group}
                    </span>
                  )}
                  {patient.sex && (
                    <span className="capitalize px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                      {patient.sex}
                    </span>
                  )}
                  {patient.date_of_birth && (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                      DOB: {patient.date_of_birth}
                    </span>
                  )}
                  {patient.last_visit_date && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" /> Last Visit: {patient.last_visit_date}
                    </span>
                  )}
                </div>

                {/* Scopes & Expiry */}
                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold mr-1">Scope:</span>
                    {patient.grant_scope.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 self-end sm:self-auto">
                    Access expires: {expDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Access Modal */}
      <RequestAccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPatients}
      />
    </div>
  );
}
