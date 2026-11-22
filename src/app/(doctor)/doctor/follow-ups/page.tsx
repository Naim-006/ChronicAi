"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Stethoscope,
  Filter,
  Search,
  User,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/context/AuthContext";
import {
  getDoctorFollowUps,
  updateFollowUpStatus,
  sendFollowUpReminder,
  type DetailedFollowUp,
} from "@/lib/supabase/services/consultation";

type FilterTab = "all" | "due_this_week" | "upcoming" | "overdue" | "completed";

export default function DoctorFollowUpsPage() {
  const router = useRouter();
  const { doctorProfile } = useAuth();

  const [followUps, setFollowUps] = useState<DetailedFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadFollowUps() {
      if (!doctorProfile?.id) return;
      setIsLoading(true);
      const data = await getDoctorFollowUps(doctorProfile.id);
      setFollowUps(data);
      setIsLoading(false);
    }
    loadFollowUps();
  }, [doctorProfile?.id]);

  // Compute metrics
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const nextWeekStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }, []);

  const stats = useMemo(() => {
    let dueThisWeek = 0;
    let overdue = 0;
    let completed = 0;

    followUps.forEach((f) => {
      if (f.status === "completed") {
        completed++;
      } else if (f.status === "scheduled") {
        if (f.scheduled_date < todayStr) {
          overdue++;
        } else if (f.scheduled_date <= nextWeekStr) {
          dueThisWeek++;
        }
      }
    });

    return {
      total: followUps.length,
      dueThisWeek,
      overdue,
      completed,
    };
  }, [followUps, todayStr, nextWeekStr]);

  // Filtered items
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      // Tab filter
      if (activeTab === "due_this_week") {
        if (f.status !== "scheduled" || f.scheduled_date < todayStr || f.scheduled_date > nextWeekStr) {
          return false;
        }
      } else if (activeTab === "upcoming") {
        if (f.status !== "scheduled" || f.scheduled_date <= nextWeekStr) {
          return false;
        }
      } else if (activeTab === "overdue") {
        if (f.status !== "scheduled" || f.scheduled_date >= todayStr) {
          return false;
        }
      } else if (activeTab === "completed") {
        if (f.status !== "completed") {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (f.patient_name || "").toLowerCase().includes(q);
        const matchesReason = (f.reason || "").toLowerCase().includes(q);
        return matchesName || matchesReason;
      }

      return true;
    });
  }, [followUps, activeTab, searchQuery, todayStr, nextWeekStr]);

  const handleMarkCompleted = async (id: string) => {
    const res = await updateFollowUpStatus(id, "completed");
    if (res.success) {
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "completed" } : f))
      );
      setActionMessage("Follow-up marked as completed.");
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleSendReminder = async (f: DetailedFollowUp) => {
    const doctorName = doctorProfile?.full_name ? `Dr. ${doctorProfile.full_name}` : "Your Doctor";
    const res = await sendFollowUpReminder(f.patient_id, doctorName, f.scheduled_date, f.reason || undefined);
    if (res.success) {
      setActionMessage(`Reminder notification sent to ${f.patient_name || "patient"}.`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Follow-up Tracking & Care Adherence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor patient review intervals, track upcoming laboratory investigations, and prompt overdue patients.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => router.push("/doctor/consultations")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
          New Consultation Note
        </Button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-400 block">Total Scheduled</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 backdrop-blur-md">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">Due This Week</span>
          <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 mt-1 block">
            {stats.dueThisWeek}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 backdrop-blur-md">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">Overdue</span>
          <span className="text-2xl font-extrabold text-rose-800 dark:text-rose-300 mt-1 block">
            {stats.overdue}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 backdrop-blur-md">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 block">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-card rounded-xl border border-slate-200 dark:border-border overflow-x-auto text-xs">
          {[
            { id: "all", label: "All Reviews" },
            { id: "due_this_week", label: `Due This Week (${stats.dueThisWeek})` },
            { id: "upcoming", label: "Upcoming" },
            { id: "overdue", label: `Overdue (${stats.overdue})` },
            { id: "completed", label: `Completed (${stats.completed})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white dark:bg-accent text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient or reason..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-slate-100 dark:bg-card animate-pulse border border-slate-200 dark:border-border"
              />
            ))}
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 p-8 backdrop-blur-md">
            <EmptyState
              icon={Calendar}
              title="No Follow-ups Found"
              description="No follow-up review appointments match the selected filter. Schedule a follow-up date during clinical note drafting to populate this tracker."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredFollowUps.map((f) => {
              const isOverdue = f.status === "scheduled" && f.scheduled_date < todayStr;
              const isDueToday = f.status === "scheduled" && f.scheduled_date === todayStr;
              const isCompleted = f.status === "completed";

              const formattedDate = new Date(f.scheduled_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={f.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-xs ${
                    isOverdue
                      ? "border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40"
                      : isDueToday
                      ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800"
                      : "border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {f.patient_name}
                      </span>
                      {isCompleted ? (
                        <Badge variant="success" className="text-[10px]">
                          Completed
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Overdue Review
                        </Badge>
                      ) : isDueToday ? (
                        <Badge variant="warning" className="text-[10px]">
                          Due Today
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Scheduled
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Target: {formattedDate}
                      </span>
                      {f.reason && (
                        <span>
                          <strong className="text-slate-600 dark:text-slate-400">Purpose:</strong> {f.reason}
                        </span>
                      )}
                    </div>

                    {f.recommended_tests && f.recommended_tests.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" />
                          Advised Tests:
                        </span>
                        {f.recommended_tests.map((test, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-card text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border"
                          >
                            {test}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(f)}
                          className="text-xs border-slate-200 dark:border-border text-slate-700 dark:text-slate-300"
                        >
                          <Bell className="h-3.5 w-3.5 mr-1 text-amber-500" />
                          Send Reminder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkCompleted(f.id)}
                          className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark Done
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={() => router.push(`/doctor/consultations?patientId=${f.patient_id}`)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1" />
                      Consult Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
