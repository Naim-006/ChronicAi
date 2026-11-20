"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { ClinicalNotification } from "@/types/medical";
import { useAuth } from "@/context/AuthContext";
import {
  getClinicalNotifications,
  markNotificationRead,
  dismissNotification as dismissNotifService,
} from "@/lib/supabase/services/notifications";
import { useRealtimeTable } from "@/hooks/useRealtime";

export default function NotificationsPage() {
  const { effectiveUserId } = useAuth();
  const [notifications, setNotifications] = useState<ClinicalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "critical" | "action">("all");

  const loadNotifications = React.useCallback(async () => {
    if (!effectiveUserId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await getClinicalNotifications(effectiveUserId);
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription: syncs clinical alerts and notifications live
  useRealtimeTable({
    table: "clinical_notifications",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadNotifications();
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "critical") return n.severity === "critical";
    if (filter === "action")
      return n.type === "verification_required" || n.type === "critical_alert";
    return true;
  });

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    for (const notif of notifications) {
      if (!notif.is_read) {
        await markNotificationRead(notif.id);
      }
    }
  };

  const toggleRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: !n.is_read } : n))
    );
    await markNotificationRead(id);
  };

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await dismissNotifService(id);
  };

  const getSeverityBadge = (severity: ClinicalNotification["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          label: "Critical Clinical Alert",
          badgeClass: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900",
          icon: AlertTriangle,
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "warning":
        return {
          label: "Clinical Warning",
          badgeClass: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900",
          icon: AlertTriangle,
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "success":
        return {
          label: "Confirmed / Normal",
          badgeClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
          icon: CheckCircle2,
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      default:
        return {
          label: "Informational",
          badgeClass: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900",
          icon: Bell,
          iconColor: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  const getTypeIcon = (type: ClinicalNotification["type"]) => {
    switch (type) {
      case "medication_reminder":
        return Pill;
      case "appointment_reminder":
        return Calendar;
      case "verification_required":
        return FileText;
      case "critical_alert":
      case "care_insight":
      case "preventive_care":
        return HeartPulse;
      default:
        return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Clinical Alerts & Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-emerald-600 px-2 text-[10px] font-bold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Automated alerts, medication schedules, and clinical review tasks.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-xs hover:bg-[var(--muted)] cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] pb-2 text-xs font-semibold hide-scrollbar">
        {[
          { id: "all", label: "All", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
          {
            id: "critical",
            label: "Critical",
            count: notifications.filter((n) => n.severity === "critical").length,
          },
          {
            id: "action",
            label: "Action Needed",
            count: notifications.filter(
              (n) => n.type === "verification_required" || n.type === "critical_alert"
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              filter === tab.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filter === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="soft-card flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="soft-card p-12 text-center space-y-2">
            <Bell className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">No notifications</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              You are all caught up! There are no alerts matching this filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const badge = getSeverityBadge(notif.severity);
            const IconComponent = getTypeIcon(notif.type);

            return (
              <div
                key={notif.id}
                className={`soft-card relative p-4 transition-all hover:border-emerald-200 dark:hover:border-emerald-800 ${
                  !notif.is_read ? "border-l-4 border-l-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${badge.badgeClass}`}
                    >
                      <IconComponent className={`h-4 w-4 ${badge.iconColor}`} />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          {new Date(notif.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold leading-snug ${
                          notif.is_read ? "text-[var(--foreground)]/80" : "text-[var(--foreground)]"
                        }`}
                      >
                        {notif.title}
                      </h3>

                      <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                        {notif.message}
                      </p>

                      {notif.link_href && (
                        <div className="pt-2">
                          <Link
                            href={notif.link_href}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <span>{notif.link_label || "View details"}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleRead(notif.id)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-emerald-600 rounded-lg hover:bg-[var(--muted)] cursor-pointer"
                      title={notif.is_read ? "Mark unread" : "Mark read"}
                    >
                      <Check className={`h-4 w-4 ${notif.is_read ? "opacity-40" : "text-emerald-600 font-bold"}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissNotification(notif.id)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-600 rounded-lg hover:bg-[var(--muted)] cursor-pointer"
                      title="Dismiss"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
