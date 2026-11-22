"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Play,
  Plus,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  KeyRound,
  RotateCcw,
  Check,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getClinicQueue,
  getDoctorClinics,
  updateVisitTokenStatus,
  QueueItem,
  ClinicRecord,
} from "@/lib/supabase/services/queue";
import { createClient } from "@/lib/supabase/client";
import { VisitTokenStatus, VisitPriority } from "@/types/doctor-portal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { RegisterVisitModal } from "@/components/doctor/RegisterVisitModal";
import { RequestAccessModal } from "@/components/doctor/RequestAccessModal";

export default function DoctorQueuePage() {
  const { doctorProfile } = useAuth();
  const [clinics, setClinics] = useState<ClinicRecord[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "waiting" | "in_progress" | "completed">("all");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const doctorId = doctorProfile?.id || "";

  // 1. Load clinics
  useEffect(() => {
    getDoctorClinics().then((cls) => {
      setClinics(cls);
      if (cls.length > 0) {
        setSelectedClinicId(cls[0].id);
      }
    });
  }, []);

  // 2. Load queue when clinic changes
  const fetchQueue = async () => {
    if (!selectedClinicId) return;
    setLoading(true);
    try {
      const items = await getClinicQueue(selectedClinicId);
      setQueue(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClinicId) {
      fetchQueue();
    }
  }, [selectedClinicId]);

  // 3. Realtime updates on visit_tokens
  useEffect(() => {
    if (!selectedClinicId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime_queue_${selectedClinicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visit_tokens",
          filter: `clinic_id=eq.${selectedClinicId}`,
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClinicId]);

  // Actions
  const handleCallPatient = async (tokenId: string) => {
    setActionLoadingId(tokenId);
    try {
      await updateVisitTokenStatus(tokenId, "in_progress");
      await fetchQueue();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteVisit = async (tokenId: string) => {
    setActionLoadingId(tokenId);
    try {
      await updateVisitTokenStatus(tokenId, "completed");
      await fetchQueue();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelVisit = async (tokenId: string) => {
    if (!confirm("Cancel this visit?")) return;
    setActionLoadingId(tokenId);
    try {
      await updateVisitTokenStatus(tokenId, "cancelled");
      await fetchQueue();
    } finally {
      setActionLoadingId(null);
    }
  };

  // Call Next in triage priority
  const handleCallNext = async () => {
    const waitingPatients = queue.filter((item) => item.status === "waiting");
    if (waitingPatients.length === 0) return;

    // Highest triage first
    const nextPatient = [...waitingPatients].sort((a, b) => {
      const priorityWeight: Record<VisitPriority, number> = {
        emergency: 3,
        urgent: 2,
        normal: 1,
      };
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (diff !== 0) return diff;
      return a.serial_number - b.serial_number;
    })[0];

    if (nextPatient) {
      await handleCallPatient(nextPatient.id);
    }
  };

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (filter === "all") return item.status !== "cancelled";
    return item.status === filter;
  });

  const waitingCount = queue.filter((i) => i.status === "waiting").length;
  const inProgressCount = queue.filter((i) => i.status === "in_progress").length;
  const completedCount = queue.filter((i) => i.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Today's Chamber Live Queue
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Realtime daily serial triage, call next patient, and instant access to pre-visit briefs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRegisterModalOpen(true)}
            className="rounded-xl border-slate-300 dark:border-slate-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Issue Visit Token
          </Button>
          <Button
            size="sm"
            onClick={handleCallNext}
            disabled={waitingCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
          >
            <Play className="h-3.5 w-3.5 mr-1 fill-current" />
            Call Next Patient {waitingCount > 0 && `(${waitingCount})`}
          </Button>
        </div>
      </div>

      {/* KPI Tally Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 backdrop-blur-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Waiting in Chamber
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {waitingCount}
            </span>
            <span className="text-xs text-slate-500">patients</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 backdrop-blur-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            In Consultation
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-200">
              {inProgressCount}
            </span>
            <span className="text-xs text-emerald-600">active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 backdrop-blur-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Seen Today
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {completedCount}
            </span>
            <span className="text-xs text-slate-500">completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 backdrop-blur-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Registered
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {queue.filter((i) => i.status !== "cancelled").length}
            </span>
            <span className="text-xs text-slate-500">today</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          All Active ({queue.filter((i) => i.status !== "cancelled").length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("waiting")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "waiting"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          Waiting ({waitingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("in_progress")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "in_progress"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "completed"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Queue Table Container */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 backdrop-blur-xl shadow-xs overflow-hidden">
        {filteredQueue.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No Patients in this Queue View"
              description="New patients will appear in realtime when reception or the doctor issues daily serial tokens."
              actionLabel="Issue First Token"
              onAction={() => setIsRegisterModalOpen(true)}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {filteredQueue.map((item) => {
              const isCallingThis = actionLoadingId === item.id;
              const arrivalTime = new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    item.status === "in_progress"
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500"
                      : "hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Serial Number Badge */}
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/[0.06] shrink-0 font-mono">
                      <span className="text-[10px] text-slate-400 leading-none">SERIAL</span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        #{item.serial_number}
                      </span>
                    </div>

                    {/* Patient & Triage Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {item.patient_name || `Patient #${item.serial_number}`}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            item.priority === "emergency"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 animate-pulse"
                              : item.priority === "urgent"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {item.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.status === "in_progress"
                              ? "bg-emerald-500 text-white"
                              : item.status === "completed"
                              ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              : "bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200"
                          }`}
                        >
                          {item.status === "in_progress" ? "In Chamber" : item.status}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Arrived {arrivalTime}
                        </span>
                        {item.patient_code && (
                          <span className="font-mono text-[11px] text-slate-400">
                            {item.patient_code}
                          </span>
                        )}
                        {item.has_active_grant ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3 w-3" /> Consent Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAccessModalOpen(true)}
                            className="text-[11px] font-semibold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound className="h-3 w-3" /> Consent Pending (Request)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                    {item.has_active_grant && (
                      <Link href={`/doctor/patients/${item.patient_id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                        >
                          <Stethoscope className="h-3.5 w-3.5 mr-1" />
                          Pre-Visit Brief
                        </Button>
                      </Link>
                    )}

                    {item.status === "waiting" && (
                      <Button
                        size="sm"
                        onClick={() => handleCallPatient(item.id)}
                        disabled={isCallingThis}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                      >
                        <PhoneCall className="h-3.5 w-3.5 mr-1" />
                        Call Patient
                      </Button>
                    )}

                    {item.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteVisit(item.id)}
                        disabled={isCallingThis}
                        className="h-8 text-xs font-bold bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Complete Visit
                      </Button>
                    )}

                    {item.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => handleCancelVisit(item.id)}
                        disabled={isCallingThis}
                        className="text-[11px] text-slate-400 hover:text-rose-500 px-2 py-1 cursor-pointer"
                        title="Cancel visit"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <RegisterVisitModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        doctorId={doctorId}
        clinics={clinics}
        onSuccess={fetchQueue}
      />

      <RequestAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={fetchQueue}
      />
    </div>
  );
}
