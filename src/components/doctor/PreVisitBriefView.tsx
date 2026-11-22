"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Stethoscope,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Calendar,
  Activity,
  Droplet,
  ArrowLeft,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Pill,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import {
  fetchPreVisitBrief,
  authorizeDocumentDownload,
  PreVisitBriefData,
  CitationItem,
  RedFlagAlert,
} from "@/lib/supabase/services/brief";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function PreVisitBriefView({ patientId }: { patientId: string }) {
  const [data, setData] = useState<PreVisitBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cachedTime, setCachedTime] = useState<string | null>(null);

  // Citation Drawer State
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState(false);

  const loadBrief = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchPreVisitBrief(patientId, force);
      if (!res.success || !res.data) {
        throw new Error(res.message || res.error || "Failed to load pre-visit brief.");
      }
      setData(res.data);
      setCachedTime(res.generatedAt || null);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not retrieve patient records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadBrief(false);
    }
  }, [patientId]);

  const handleDownloadDoc = async (documentId: string) => {
    try {
      setDownloadingDoc(true);
      const res = await authorizeDocumentDownload(documentId);
      if (res.success && res.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      } else {
        alert(res.error || "Could not authorize document access.");
      }
    } finally {
      setDownloadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Unable to Load Pre-Visit Brief
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {errorMessage || "Patient has not granted active consent or grant has expired."}
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <Link href="/doctor/patients">
            <Button variant="outline" size="sm" className="rounded-xl text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Return to Directory
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => loadBrief(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const snapshot = data.patientSnapshot;
  const adherence = data.adherence;
  const redFlags = data.redFlags || [];
  const citations = data.citations || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/doctor/patients"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Patients Directory
        </Link>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {cachedTime && (
            <span className="text-[10px] text-slate-400 font-medium">
              Generated: {new Date(cachedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadBrief(true)}
            disabled={refreshing}
            className="h-8 text-xs font-semibold rounded-xl"
          >
            <RotateCcw className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Regenerate Brief
          </Button>
          <Link href={`/doctor/consultations?patientId=${patientId}`}>
            <Button size="sm" className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
              <Stethoscope className="h-3.5 w-3.5 mr-1" />
              Start Consultation Note
            </Button>
          </Link>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {snapshot.fullName}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                Consent Verified
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {snapshot.dateOfBirth && (
                <span>
                  Age: {new Date().getFullYear() - new Date(snapshot.dateOfBirth).getFullYear()} yrs ({snapshot.dateOfBirth})
                </span>
              )}
              {snapshot.sex && <span className="capitalize">• {snapshot.sex}</span>}
              {snapshot.bloodGroup && (
                <span className="flex items-center gap-0.5 font-bold text-rose-600 dark:text-rose-400">
                  <Droplet className="h-3 w-3 fill-current" /> Blood: {snapshot.bloodGroup}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-center min-w-[110px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                30-Day Adherence
              </span>
              <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">
                {adherence.rate}%
              </span>
              <span className="text-[9px] text-emerald-600 block">
                {adherence.takenDoses}/{adherence.totalDoses} doses
              </span>
            </div>
          </div>
        </div>

        {/* Chronic Conditions & Allergies Tags */}
        <div className="border-t border-slate-100 dark:border-white/[0.04] pt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Active Conditions:</span>
          {snapshot.chronicConditions && snapshot.chronicConditions.length > 0 ? (
            snapshot.chronicConditions.map((c: any, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]"
              >
                {typeof c === "string" ? c : c.name}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">None recorded</span>
          )}

          <span className="text-slate-300 dark:text-slate-700 ml-2">|</span>

          <span className="text-[11px] font-bold text-slate-400 ml-2">Known Allergies:</span>
          {snapshot.allergies && snapshot.allergies.length > 0 ? (
            snapshot.allergies.map((a: any, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 font-semibold text-[11px]"
              >
                {a.substance} ({a.severity || "Allergy"})
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">NKDA (No known allergies)</span>
          )}
        </div>
      </div>

      {/* Critical Red Flags Card */}
      {redFlags.length > 0 ? (
        <div className="rounded-3xl border border-amber-300 dark:border-amber-600/50 bg-amber-50/60 dark:bg-amber-950/20 p-5 backdrop-blur-md shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Clinical Red Flags & Attention Items ({redFlags.length})
            </h2>
          </div>
          <div className="space-y-2">
            {redFlags.map((flag, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-800/40 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      flag.severity === "critical" ? "bg-rose-500 animate-ping" : "bg-amber-500"
                    }`}
                  />
                  <span className="font-bold text-slate-900 dark:text-white leading-relaxed">
                    {flag.message}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                  {flag.citation}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>No acute clinical red flags detected in latest vitals and logs.</span>
        </div>
      )}

      {/* 30-Second AI Brief Markdown Section */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                30-Second Pre-Visit Brief
              </h2>
              <p className="text-[11px] text-slate-400">
                AI synthesized from longitudinal health records · Source citations clickable
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            Clinical Summary Only
          </span>
        </div>

        {/* Formatted Markdown */}
        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {data.summaryMarkdown}
          </ReactMarkdown>
        </div>

        {/* Clinical Disclaimer */}
        <div className="border-t border-slate-100 dark:border-white/[0.06] pt-3 text-[10px] text-slate-400 italic">
          Disclaimer: This AI brief provides synthesis and citation navigation only. It does not diagnose, prescribe, or alter clinical treatment. Final clinical evaluation rests with the licensed attending practitioner.
        </div>
      </div>

      {/* Citations & Evidence Panel */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Source Citations & Verified Evidence ({citations.length})
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Click any document to inspect</span>
        </div>

        {citations.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No cited documents attached.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {citations.map((cite) => (
              <button
                key={cite.id}
                type="button"
                onClick={() => setActiveCitation(cite)}
                className="flex items-start justify-between p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:bg-emerald-50/30 transition-all text-left cursor-pointer group"
              >
                <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {cite.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {cite.category} · {cite.date}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {cite.snippet}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 shrink-0 self-center" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  {activeCitation.category}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {activeCitation.title}
                </h3>
                <span className="text-[11px] text-slate-400">Date: {activeCitation.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold block text-slate-900 dark:text-white mb-1">
                Extracted Clinical Excerpt:
              </span>
              {activeCitation.snippet}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCitation(null)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>

              {activeCitation.category !== "Vital Metric" && (
                <Button
                  size="sm"
                  onClick={() => handleDownloadDoc(activeCitation.id)}
                  disabled={downloadingDoc}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {downloadingDoc ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      View Original Document
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
