"use client";

import React, { useState } from "react";
import { UserPlus, ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { registerClinicVisit, ClinicRecord } from "@/lib/supabase/services/queue";
import { VisitPriority } from "@/types/doctor-portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterVisitModal({
  isOpen,
  onClose,
  doctorId,
  clinics,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  clinics: ClinicRecord[];
  onSuccess?: () => void;
}) {
  const [patientCode, setPatientCode] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState<string>(
    clinics[0]?.id || "c0000000-0000-4000-8000-000000000001"
  );
  const [priority, setPriority] = useState<VisitPriority>("normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    serial?: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const cleanCode = patientCode.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setLoading(true);
      const res = await registerClinicVisit({
        clinicId: selectedClinicId,
        doctorId,
        patientCode: cleanCode,
        priority,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to register visit");
      }

      setResult({
        success: true,
        serial: res.serialNumber,
      });
      setPatientCode("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || "Failed to register visit",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Issue Daily Visit Token
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign serial number for today's chamber queue
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

        {result && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 ${
              result.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="block font-bold">
                    Visit Registered: Daily Serial #{result.serial}
                  </span>
                  <span className="text-[11px] block text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Patient has been placed into the queue. A pending consent request was created.
                  </span>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{result.error}</span>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Patient Code
            </label>
            <Input
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
              placeholder="e.g. CA-4821-9920"
              required
              className="h-10 rounded-xl font-mono text-sm uppercase tracking-wider"
            />
          </div>

          {clinics.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Clinic / Chamber
              </label>
              <select
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Triage Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "normal", label: "Normal", color: "border-slate-200 dark:border-slate-800" },
                { id: "urgent", label: "Urgent", color: "border-amber-400 dark:border-amber-600" },
                { id: "emergency", label: "Emergency", color: "border-rose-400 dark:border-rose-600" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as VisitPriority)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    priority === p.id
                      ? p.id === "emergency"
                        ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                        : p.id === "urgent"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} className="rounded-xl">
              Close
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !patientCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Issuing...
                </>
              ) : (
                "Issue Serial Token"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
