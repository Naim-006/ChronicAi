"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  doctorRequestAccessByCode,
  doctorListAccessRequests,
} from "@/lib/supabase/services/consent";
import { GrantScopeCategory } from "@/types/doctor-portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ALL_SCOPES: { id: GrantScopeCategory; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "medications", label: "Medications" },
  { id: "metrics", label: "Vitals & Metrics" },
  { id: "documents", label: "Lab Reports" },
  { id: "adherence", label: "Adherence" },
  { id: "timeline", label: "Timeline" },
  { id: "consultations", label: "Consults" },
];

export function RequestAccessModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [patientCode, setPatientCode] = useState("");
  const [scopes, setScopes] = useState<GrantScopeCategory[]>([
    "profile",
    "medications",
    "metrics",
    "documents",
    "adherence",
    "timeline",
    "consultations",
  ]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error" | "rate_limited";
    text: string;
  } | null>(null);

  // Past requests by this doctor
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const data = await doctorListAccessRequests();
      setRecentRequests(data);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecent();
      setResultMessage(null);
      setPatientCode("");
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleScope = (scopeId: GrantScopeCategory) => {
    setScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMessage(null);

    const cleanCode = patientCode.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setLoading(true);
      const res = await doctorRequestAccessByCode({
        patientCode: cleanCode,
        requestedScope: scopes,
        message: reason.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to submit request");
      }

      if (res.status === "rate_limited") {
        setResultMessage({
          type: "rate_limited",
          text: "Too many access attempts. Please wait a moment before trying again.",
        });
      } else {
        setResultMessage({
          type: "success",
          text: "Access request submitted. Ask the patient to approve it under Settings > Doctor Access on their phone.",
        });
        await fetchRecent();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setResultMessage({
        type: "error",
        text: err.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Request Patient Longitudinal Access
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lookup via permanent Patient Code (CA-XXXX-XXXX)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {resultMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 ${
              resultMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {resultMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{resultMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Patient Code (from patient profile / check-in card)
            </label>
            <Input
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
              placeholder="e.g. CA-4821-9920"
              required
              className="h-10 rounded-xl font-mono text-sm tracking-wider uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Requested Clinical Scopes
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SCOPES.map((scope) => {
                const isSelected = scopes.includes(scope.id);
                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => toggleScope(scope.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {scope.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason / Chief Complaint (optional note for patient)
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Follow-up consultation for hypertension & diabetes review"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} className="rounded-xl">
              Close
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !patientCode.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Send Access Request
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Recently Submitted Requests */}
        {recentRequests.length > 0 && (
          <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Recent Access Requests
            </span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
              {recentRequests.map((req) => (
                <div
                  key={req.request_id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {req.patient_name ? req.patient_name : "Pending Patient Approval"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      req.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                        : req.status === "rejected"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
