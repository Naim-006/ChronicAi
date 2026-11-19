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
  Sparkles,
  HeartPulse,
  Filter,
  X,
} from "lucide-react";
import { mockNotifications } from "@/lib/mock-data";
import { ClinicalNotification } from "@/types/medical";

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
          badgeClass: "bg-red-100 text-red-800 border-red-200",
          icon: AlertTriangle,
          iconColor: "text-red-600",
          cardBorder: "border-red-200 hover:border-red-300",
          bgLight: "bg-red-50/40",
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
          badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
          icon: ShieldCheck,
          iconColor: "text-slate-600",
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">Notifications</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {unreadCount === 0 ? "All caught up" : `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--muted)] cursor-pointer"
          >
            <Check className="h-4 w-4 text-emerald-600" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "all"
              ? "bg-[var(--foreground)] text-white"
              : "bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:border-emerald-300"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "unread"
              ? "bg-[var(--foreground)] text-white"
              : "bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:border-emerald-300"
          }`}
        >
          Unread {unreadCount > 0 && <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{unreadCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setFilter("critical")}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "critical"
              ? "bg-rose-600 text-white"
              : "bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:border-rose-300"
          }`}
        >
          Critical
        </button>
        <button
          type="button"
          onClick={() => setFilter("action")}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "action"
              ? "bg-amber-500 text-white"
              : "bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:border-amber-300"
          }`}
        >
          Action Needed
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="soft-card p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">
              All caught up
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              No notifications to show
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const config = getSeverityBadge(n.severity);
            const Icon = config.icon;

            return (
              <article
                key={n.id}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  !n.is_read ? "bg-white border-emerald-200" : "bg-white border-[var(--border)] hover:border-emerald-200"
                }`}
                onClick={() => !n.is_read && toggleRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.badgeClass.replace('border-', 'bg-').replace('text-', 'text-')}`}>
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                      <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                        {formatTimestamp(n.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug mb-1">
                      {n.title}
                    </h3>

                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                      {n.message}
                    </p>

                    {n.link_href && (
                      <Link
                        href={n.link_href}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {n.link_label || "View"}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(n.id);
                    }}
                    className="shrink-0 p-1.5 text-[var(--muted-foreground)] hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
