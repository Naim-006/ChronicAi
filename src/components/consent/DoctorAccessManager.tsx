"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Stethoscope,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Lock,
  Calendar,
  Layers,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  DetailedAccessRequest,
  DetailedAccessGrant,
  getPatientAccessRequests,
  getPatientAccessGrants,
  respondToAccessRequest,
  revokeAccessGrant,
} from "@/lib/supabase/services/consent";
import { GrantScopeCategory } from "@/types/doctor-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ALL_SCOPES: { id: GrantScopeCategory; label: string; desc: string }[] = [
  {
    id: "profile",
    label: "Demographics & Contacts",
    desc: "Full name, age, blood group, allergies & emergency contact details",
  },
  {
    id: "medications",
    label: "Active Medications",
    desc: "Current prescribed drugs, dosage instructions & frequencies",
  },
  {
    id: "metrics",
    label: "Health Metrics & Vitals",
    desc: "Blood pressure, blood glucose, HbA1c & physiological tracking",
  },
  {
    id: "documents",
    label: "Medical Documents & Reports",
    desc: "Uploaded lab test results, radiology scans & discharge summaries",
  },
  {
    id: "adherence",
    label: "Medication Adherence",
    desc: "Daily morning/evening dose logging consistency and trends",
  },
  {
    id: "timeline",
    label: "Medical Timeline",
    desc: "Chronological milestone history of diagnoses and hospital visits",
  },
  {
    id: "consultations",
    label: "Past Consultations & Notes",
    desc: "Previous doctor clinical notes and electronic prescriptions",
  },
];

const DURATION_OPTIONS = [
  { id: "24h", label: "24 Hours", intervalHours: 24 },
  { id: "7d", label: "7 Days", intervalHours: 24 * 7 },
  { id: "30d", label: "30 Days (Recommended)", intervalHours: 24 * 30 },
  { id: "90d", label: "90 Days", intervalHours: 24 * 90 },
];

export function DoctorAccessManager() {
  const [requests, setRequests] = useState<DetailedAccessRequest[]>([]);
  const [grants, setGrants] = useState<DetailedAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Approval Modal State
  const [selectedReq, setSelectedReq] = useState<DetailedAccessRequest | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<GrantScopeCategory[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>("30d");

  // Revoke Confirmation State
  const [revokeTargetGrant, setRevokeTargetGrant] = useState<DetailedAccessGrant | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, grs] = await Promise.all([
        getPatientAccessRequests(),
        getPatientAccessGrants(),
      ]);
      setRequests(reqs);
      setGrants(grs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openApprovalModal = (req: DetailedAccessRequest) => {
    setSelectedReq(req);
    setSelectedScopes(
      req.requested_scope && req.requested_scope.length > 0
        ? req.requested_scope
        : ["profile", "medications", "metrics", "documents", "adherence", "timeline", "consultations"]
    );
    setSelectedDuration("30d");
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setActionLoading(true);
    try {
      const durationHours =
        DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.intervalHours || 720;
      const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

      const res = await respondToAccessRequest({
        requestId: selectedReq.id,
        approve: true,
        scope: selectedScopes,
        expiresAt,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to grant access");
      }

      setToastMessage("Doctor access granted successfully.");
      setSelectedReq(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Could not approve request");
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(true);
    try {
      const res = await respondToAccessRequest({
        requestId,
        approve: false,
      });
      if (!res.success) throw new Error(res.error || "Failed to decline request");
      setToastMessage("Access request declined.");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Could not decline request");
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTargetGrant) return;
    setActionLoading(true);
    try {
      const ok = await revokeAccessGrant(revokeTargetGrant.id);
      if (!ok) throw new Error("Revocation failed");
      setToastMessage("Access revoked. Clinical records locked and doctor's cached brief purged.");
      setRevokeTargetGrant(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke access");
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const toggleScope = (scopeId: GrantScopeCategory) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section 1: Pending Access Requests */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Pending Doctor Access Requests
            </h3>
          </div>
          {requests.length > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">
              {requests.length} Pending
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-card/70 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
            No pending access requests. When a doctor requests permission using your patient code, it will appear here for your approval.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const docName = req.doctor?.full_name || "Practicing Doctor";
              const specialty = req.doctor?.specialty || "Physician";
              const bmdc = req.doctor?.bmdc_number || "Verified BMDC";
              const clinicName = (req.doctor?.chamber_info as any)?.clinic_name || "";

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-4 sm:p-5 backdrop-blur-md shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {docName}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-300/40">
                            {bmdc}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {specialty} {clinicName && `· ${clinicName}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoading}
                        className="text-xs border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openApprovalModal(req)}
                        disabled={actionLoading}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                      >
                        Review & Approve
                      </Button>
                    </div>
                  </div>

                  {req.message && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Doctor Note: </span>
                      {req.message}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">Requested Scope:</span>
                    {req.requested_scope.map((scope) => (
                      <span
                        key={scope}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Active Doctor Access Grants */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Active Doctor Access Grants
            </h3>
          </div>
          {grants.length > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
              {grants.length} Active
            </span>
          )}
        </div>

        {grants.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-card/70 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
            No doctors currently have access to your clinical records.
          </div>
        ) : (
          <div className="space-y-3">
            {grants.map((grant) => {
              const docName = grant.doctor?.full_name || "Practicing Doctor";
              const specialty = grant.doctor?.specialty || "Physician";
              const bmdc = grant.doctor?.bmdc_number || "Verified BMDC";
              const expDate = new Date(grant.expires_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={grant.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 p-4 sm:p-5 backdrop-blur-md shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {docName}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-300/40">
                            {bmdc}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{specialty}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right text-[11px] text-slate-500">
                        <span className="block text-[10px] text-slate-400">Expires</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {expDate}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRevokeTargetGrant(grant)}
                        disabled={actionLoading}
                        className="text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">Granted Scope:</span>
                    {grant.scope.map((scope) => (
                      <span
                        key={scope}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Approve Doctor Access
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Grant permission to {selectedReq.doctor?.full_name || "Doctor"} (
                  {selectedReq.doctor?.bmdc_number || "BMDC"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scope Selection Checkboxes */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Select Allowed Data Categories
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {ALL_SCOPES.map((scope) => {
                  const isChecked = selectedScopes.includes(scope.id);
                  return (
                    <label
                      key={scope.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleScope(scope.id)}
                        className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {scope.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {scope.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Access Duration
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDuration(opt.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      selectedDuration === opt.id
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
              <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                All reads are logged to your personal audit trail. You can revoke access at any time with 1 click.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReq(null)}
                disabled={actionLoading}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={actionLoading || selectedScopes.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Grant Doctor Access
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {revokeTargetGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Revoke Doctor Access?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to revoke access for{" "}
              <strong>{revokeTargetGrant.doctor?.full_name || "this doctor"}</strong>?
              This action will immediately lock all your medical records and permanently purge any
              AI Pre-Visit Brief cached for this doctor.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevokeTargetGrant(null)}
                disabled={actionLoading}
                className="rounded-xl"
              >
                Keep Access
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={actionLoading}
                className="rounded-xl"
              >
                {actionLoading ? "Revoking..." : "Yes, Revoke Access"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
