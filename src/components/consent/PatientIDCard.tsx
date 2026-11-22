"use client";

import React, { useEffect, useState } from "react";
import { QrCode, Copy, Check, RefreshCw, ShieldCheck, AlertCircle } from "lucide-react";
import { getPatientIdentifier, PatientIdentifierResult } from "@/lib/supabase/services/consent";
import { QRCodeSVG } from "@/components/shared/QRCodeSVG";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PatientIDCard() {
  const [identifier, setIdentifier] = useState<PatientIdentifierResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getPatientIdentifier(false).then((res) => {
      if (isMounted) {
        setIdentifier(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = () => {
    if (!identifier?.patient_code) return;
    navigator.clipboard.writeText(identifier.patient_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await getPatientIdentifier(true);
      setIdentifier(res);
      setShowConfirmRegen(false);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card/80 p-6 backdrop-blur-md">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="h-44 w-44 rounded-2xl" />
          <div className="space-y-3 flex-1 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  const patientCode = identifier?.patient_code || "CA-NOT-ISSUED";

  return (
    <div className="rounded-3xl border border-emerald-200/80 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/70 via-white/80 to-teal-50/50 dark:from-emerald-950/20 dark:via-card/90 dark:to-teal-950/10 p-5 sm:p-6 backdrop-blur-md shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              ChronicAI Medical ID & Quick Check-in
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Permanent lifelong identifier for doctor visits & consent
            </span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
          <ShieldCheck className="h-3 w-3" />
          Encrypted
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
        {/* QR Code Container */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs shrink-0 text-center">
          <QRCodeSVG value={patientCode} size={150} />
          <span className="block mt-1.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
            Scan to Check-In
          </span>
        </div>

        {/* Patient Code Display & Actions */}
        <div className="flex-1 w-full space-y-3 text-center sm:text-left">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Permanent Patient Code
            </span>
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-slate-900 dark:text-white">
                {patientCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                title="Copy Patient Code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
            Provide this code to your doctor or reception. Doctors will not be able to view
            your medical records until you approve their access request in your app.
          </p>

          <div className="pt-1 flex items-center justify-center sm:justify-start gap-3">
            {!showConfirmRegen ? (
              <button
                type="button"
                onClick={() => setShowConfirmRegen(true)}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate Code
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900/50">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                  Regenerating will invalidate your old code. Proceed?
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="h-6 text-[10px] px-2 rounded-lg"
                >
                  {regenerating ? "Rotating..." : "Yes, Rotate"}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowConfirmRegen(false)}
                  className="text-[10px] text-slate-500 hover:underline px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
