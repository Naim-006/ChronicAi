"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pill,
  Calendar,
  FileText,
  ShieldCheck,
  Check,
  Trash2,
  ArrowRight,
  SlidersHorizontal,
  ExternalLink,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { mockNotifications } from "@/lib/mock-data";
import { ClinicalNotification } from "@/types/medical";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ClinicalNotification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "critical" | "action">("all");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "critical") return n.severity === "critical";
    if (filter === "action")
      return n.type === "verification_required" || n.type === "critical_alert";
    return true;
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: !n.is_read } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getSeverityBadge = (severity: ClinicalNotification["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          label: "Critical Clinical Alert",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
          icon: AlertTriangle,
          iconColor: "text-rose-600",
          cardBorder: "border-rose-200 hover:border-rose-300",
          bgLight: "bg-rose-50/40",
        };
      case "warning":
        return {
          label: "Action Required",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Clock,
          iconColor: "text-amber-600",
          cardBorder: "border-amber-200/90 hover:border-amber-300",
          bgLight: "bg-amber-50/30",
        };
      case "success":
        return {
          label: "Target Achieved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
          iconColor: "text-emerald-600",
          cardBorder: "border-emerald-200 hover:border-emerald-300",
          bgLight: "bg-emerald-50/30",
        };
      default:
        return {
          label: "Care Update",
          badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
          icon: ShieldCheck,
          iconColor: "text-sky-600",
          cardBorder: "border-slate-200 hover:border-slate-300",
          bgLight: "bg-white",
        };
    }
  };

  const formatTimestamp = (isoDate: string) => {
    const diffHours = Math.round(
      (new Date("2026-11-19T12:00:00Z").getTime() - new Date(isoDate).getTime()) /
        (1000 * 60 * 60)
    );
    if (diffHours < 24) {
      return `${Math.max(1, diffHours)}h ago`;
    }
    const days = Math.round(diffHours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-5 max-w-full overflow-hidden">
      {/* Page Header */}
      <PageHeader
        eyebrow="Action Center"
        title="Notifications & Care Alerts"
        description="Clinical notifications, critical biometric variance alerts, and pending document confirmations."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                Mark all read
              </button>
            )}
            <Link
              href="/evaluation"
              className="flex items-center gap-1.5 rounded-2xl bg-[#18261F] text-white px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-[#253D30] transition-colors"
            >
              <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
              <span>Health Evaluation</span>
            </Link>
          </div>
        }
      />

      {/* Health Evaluation Quick Assessment Banner */}
      <section className="soft-card relative overflow-hidden p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border border-emerald-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Clinical Care Evaluation
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                  Score: 88% Optimal
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                Longitudinal Health Trajectory · Elena Vance
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                Glycemic target achieved (HbA1c 6.8%), blood pressure normal, and CKD Stage 2 stable.
              </p>
            </div>
          </div>

          <Link
            href="/evaluation"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>Open Health Evaluation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)]/70 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full hide-scrollbar">
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "action", label: "Action Needed" },
            { id: "critical", label: "Critical Alerts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`shrink-0 cursor-pointer rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                filter === tab.id
                  ? "bg-[#18261F] text-white shadow-sm"
                  : "border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-semibold text-[var(--muted-foreground)] shrink-0 hidden sm:block">
          {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="soft-card space-y-3 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-extrabold text-[var(--foreground)]">
              No Notifications Found
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              You are completely caught up. All extracted records have been confirmed and no acute biometric anomalies are currently active.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const config = getSeverityBadge(n.severity);
            const Icon = config.icon;

            return (
              <article
                key={n.id}
                className={`soft-card relative p-4 sm:p-5 transition-all ${config.cardBorder} ${
                  !n.is_read ? config.bgLight : "bg-white"
                }`}
              >
                {!n.is_read && (
                  <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                )}

                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${config.badgeClass}`}
                  >
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 pr-6">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold border ${config.badgeClass}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[11px] font-bold text-[var(--muted-foreground)]">
                        · {formatTimestamp(n.created_at)}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] truncate hidden md:inline">
                        (Via {n.source_trigger})
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[var(--foreground)] leading-tight">
                      {n.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-slate-700">
                      {n.message}
                    </p>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/90 mt-2">
                      <div className="flex items-center gap-2">
                        {n.link_href && (
                          <Link
                            href={n.link_href}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition-colors"
                          >
                            <span>{n.link_label || "View Details"}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleRead(n.id)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          {n.is_read ? "Mark unread" : "Mark read"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => dismissNotification(n.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Dismiss notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
